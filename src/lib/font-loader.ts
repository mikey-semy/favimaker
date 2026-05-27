"use client";

/**
 * Загрузить Google Font ttf + распарсить через opentype.js + сгенерить
 * SVG path для произвольного текста. Self-contained SVG-favicon без
 * зависимости от наличия шрифта в standalone-контексте браузера.
 *
 * Cost: opentype.js ~300КБ (dynamic import при первом вызове), плюс
 * ~1-2с на fetch ttf. Поэтому функция вызывается ТОЛЬКО когда юзер
 * явно включил `embedFontInSvg`.
 *
 * Цепочка fetch'ей повторяет логику Next.js snippet (VOID-36) —
 * Google Fonts CSS API → regex ttf URL → fetch ttf bytes.
 */

const TTF_CACHE = new Map<string, ArrayBuffer>();
let opentypeModulePromise: Promise<typeof import("opentype.js")> | null = null;

function loadOpentype(): Promise<typeof import("opentype.js")> {
  if (!opentypeModulePromise) {
    opentypeModulePromise = import("opentype.js");
  }
  return opentypeModulePromise;
}

async function fetchGoogleFontTtf(family: string, weight: number): Promise<ArrayBuffer> {
  const cacheKey = `${family}:${weight}`;
  const cached = TTF_CACHE.get(cacheKey);
  if (cached) return cached;

  const cssUrl = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}&display=swap`;
  // User-Agent трюк — Google отдаёт ttf вместо woff2 если запросил
  // «старый» браузер. Иначе opentype.js не распарсит woff2 без extra
  // зависимости (wawoff2 wasm).
  const cssRes = await fetch(cssUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; FaviMaker)" },
  });
  if (!cssRes.ok) throw new Error(`Google Fonts CSS API ${cssRes.status}`);
  const css = await cssRes.text();
  const match =
    css.match(/url\((https:[^)]+)\)\s*format\(['"]truetype['"]\)/) ||
    css.match(/url\((https:[^)]+\.ttf)\)/);
  if (!match) throw new Error("No ttf URL in Google Fonts CSS");

  const fontRes = await fetch(match[1]);
  if (!fontRes.ok) throw new Error(`ttf fetch ${fontRes.status}`);
  const buffer = await fontRes.arrayBuffer();
  TTF_CACHE.set(cacheKey, buffer);
  return buffer;
}

/**
 * Сгенерировать SVG path data для текста + сразу attribute блок для
 * <path d="..." fill="...">. Возвращает строку готовую для вставки в SVG.
 *
 * @param text — исходный текст (1-4 char'а обычно)
 * @param family — Google Font family
 * @param weight — fontWeight (400/700/etc)
 * @param fontSize — пиксельный размер
 * @param viewBoxSize — для центрирования (text-anchor middle, baseline middle)
 * @param color — fill цвет path
 * @param stroke — опциональный stroke
 */
export async function renderTextAsSvgPath(
  text: string,
  family: string,
  weight: number,
  fontSize: number,
  viewBoxSize: number,
  color: string,
  stroke?: { color: string; widthPx: number },
): Promise<string | null> {
  if (!text) return null;
  try {
    const buffer = await fetchGoogleFontTtf(family, weight);
    const opentype = await loadOpentype();
    const font = opentype.parse(buffer);

    // opentype.getPath(text, x, y, fontSize) — y это baseline. Мы хотим
    // центрировать оптически. Используем font.getAdvanceWidth для ширины,
    // ascender/descender для вертикального центрирования.
    const advanceWidth = font.getAdvanceWidth(text, fontSize);
    // Auto-shrink если ширина больше viewBox-padding (5% запас).
    const maxWidth = viewBoxSize * 0.95;
    let finalSize = fontSize;
    if (advanceWidth > maxWidth) {
      finalSize = fontSize * (maxWidth / advanceWidth);
    }
    const finalAdvance = font.getAdvanceWidth(text, finalSize);

    // Vertical metrics (units → px): ascender/descender в em-units, делим
    // на unitsPerEm * finalSize.
    const ascender = (font.ascender / font.unitsPerEm) * finalSize;
    const descender = (font.descender / font.unitsPerEm) * finalSize;
    const glyphHeight = ascender - descender;

    const x = (viewBoxSize - finalAdvance) / 2;
    const y = (viewBoxSize + glyphHeight) / 2 - ascender + (ascender - Math.abs(descender)) / 2;

    const path = font.getPath(text, x, y, finalSize);
    const d = path.toPathData(3); // 3 decimal places
    if (!d) return null;

    const strokeAttr = stroke
      ? ` stroke="${stroke.color}" stroke-width="${stroke.widthPx.toFixed(2)}" stroke-linejoin="round" paint-order="stroke fill"`
      : "";
    return `<path d="${d}" fill="${color}"${strokeAttr}/>`;
  } catch (err) {
    // Fail-safe: вернём null, caller fallback'нётся на <text>.
    if (typeof console !== "undefined") {
      console.warn("[font-to-path] failed:", err);
    }
    return null;
  }
}
