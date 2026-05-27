"use client";

/**
 * Генератор SVG-фавикона. Современные браузеры приоритезируют
 * <link rel="icon" type="image/svg+xml"> — резко на любом DPI без
 * растеризации N размеров. Для source=image возвращаем null (SVG-обёртка
 * вокруг raster бессмысленна — пусть юзер качает PNG-варианты).
 *
 * Ограничение по шрифтам: SVG-файл загружается браузером в standalone-
 * контексте без CSS сайта, поэтому Google Font в нём недоступен. Записываем
 * font-family как fallback на sans-serif. Для идеальной типографии нужен
 * font-to-path (issue под этим в backlog'е).
 */
import { renderTextAsSvgPath } from "./font-loader";
import type { FaviconConfig } from "./types";

const SIZE = 100;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function backgroundDefs(config: FaviconConfig): { defs: string; fill: string } {
  if (config.bgMode === "transparent") return { defs: "", fill: "none" };
  if (config.bgMode === "solid") return { defs: "", fill: config.bgColor };
  const { from, to, direction } = config.bgGradient;
  const id = "fmbg";
  if (direction === "radial") {
    return {
      defs: `<radialGradient id="${id}" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/></radialGradient>`,
      fill: `url(#${id})`,
    };
  }
  const dirMap: Record<string, [number, number, number, number]> = {
    "to-r": [0, 50, 100, 50],
    "to-l": [100, 50, 0, 50],
    "to-t": [50, 100, 50, 0],
    "to-b": [50, 0, 50, 100],
    "to-tr": [0, 100, 100, 0],
    "to-tl": [100, 100, 0, 0],
    "to-br": [0, 0, 100, 100],
    "to-bl": [100, 0, 0, 100],
  };
  const [x1, y1, x2, y2] = dirMap[direction] ?? dirMap["to-br"];
  return {
    defs: `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/></linearGradient>`,
    fill: `url(#${id})`,
  };
}

function shapeBgRect(config: FaviconConfig, fill: string): string {
  if (fill === "none") return "";
  if (config.shape === "circle") {
    return `<circle cx="50" cy="50" r="50" fill="${fill}"/>`;
  }
  if (config.shape === "rounded") {
    const r = (config.borderRadiusPct / 100) * 50;
    return `<rect x="0" y="0" width="100" height="100" rx="${r}" ry="${r}" fill="${fill}"/>`;
  }
  return `<rect x="0" y="0" width="100" height="100" fill="${fill}"/>`;
}

function shapeClip(config: FaviconConfig): { clipDefs: string; clipAttr: string } {
  if (config.shape === "circle") {
    return {
      clipDefs: `<clipPath id="fmclip"><circle cx="50" cy="50" r="50"/></clipPath>`,
      clipAttr: ` clip-path="url(#fmclip)"`,
    };
  }
  if (config.shape === "rounded") {
    const r = (config.borderRadiusPct / 100) * 50;
    return {
      clipDefs: `<clipPath id="fmclip"><rect x="0" y="0" width="100" height="100" rx="${r}" ry="${r}"/></clipPath>`,
      clipAttr: ` clip-path="url(#fmclip)"`,
    };
  }
  return { clipDefs: "", clipAttr: "" };
}

/**
 * Меряем ширину текста через offscreen canvas — чтобы совпало с тем, что
 * рисует renderer.ts и live-preview. Если font ещё не загружен — fallback
 * на грубую оценку (text.length * 0.6 * fontSize).
 */
function measureTextWidth(
  text: string,
  fontFamily: string,
  fontWeight: number,
  fontSize: number,
  source: "text" | "emoji",
): number {
  if (typeof document === "undefined") return text.length * fontSize * 0.6;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return text.length * fontSize * 0.6;
  const stack =
    source === "emoji"
      ? `"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`
      : `"${fontFamily}",sans-serif`;
  ctx.font = `${fontWeight} ${fontSize}px ${stack}`;
  return ctx.measureText(text).width || text.length * fontSize * 0.6;
}

function renderTextSvg(config: FaviconConfig): string {
  // Для emoji теперь отдельный path через Twemoji (renderEmojiSvg).
  const lines: string[] = [config.text, config.text2].filter((s) => s && s.length > 0);
  if (lines.length === 0) return "";

  const padding = (config.paddingPct / 100) * SIZE;
  const inner = SIZE - padding * 2;
  const baseSize = (config.fontSizePct / 100) * SIZE;
  const lineFontSize = lines.length > 1 ? baseSize * 0.55 : baseSize;
  const source = "text" as const;
  const family = `'${config.fontFamily}',sans-serif`;
  const stroke =
    config.textStrokeWidth > 0
      ? ` stroke="${config.textStrokeColor ?? "#000"}" stroke-width="${((config.textStrokeWidth / 100) * SIZE).toFixed(2)}" stroke-linejoin="round" paint-order="stroke fill"`
      : "";

  const LINE_HEIGHT = 1.0;
  const totalBlockHeight = lines.length * lineFontSize * LINE_HEIGHT;
  const blockStartY = (SIZE - totalBlockHeight) / 2;

  return lines
    .map((text, i) => {
      const measured = measureTextWidth(
        text,
        config.fontFamily,
        config.fontWeight,
        lineFontSize,
        source,
      );
      const horizScale = measured > inner ? inner / measured : 1;
      const finalSize = lineFontSize * horizScale;
      const cy = blockStartY + (i + 0.5) * lineFontSize * LINE_HEIGHT;
      return `<text x="50" y="${cy.toFixed(2)}" font-family="${escapeXml(family)}" font-weight="${config.fontWeight}" font-size="${finalSize.toFixed(2)}" letter-spacing="${config.letterSpacing}em" text-anchor="middle" dominant-baseline="central" fill="${config.textColor}"${stroke}>${escapeXml(text)}</text>`;
    })
    .join("");
}

/**
 * Twemoji emoji-renderer. Fetch'аем SVG с jsDelivr и inline-им в нашу SVG
 * через nested <svg> с x/y/width/height — это валидный SVG 1.1/2.
 *
 * Зачем не использовать font-based <text>? Системные emoji-шрифты
 * (Segoe UI Emoji и т.п.) часто не имеют новых codepoint'ов → пустые
 * квадраты. Twemoji даёт consistent цветной рендер на любой ОС и
 * соответствует Twitter-стилю picker'а.
 *
 * Standalone SVG получает embedded inline glyph (без external dep) —
 * ~5-15KB на emoji.
 *
 * Кэшируем — повторные рендеры одной и той же emoji не делают fetch.
 */
const emojiSvgCache = new Map<string, Promise<string>>();
function emojiToTwemojiCp(emoji: string): string {
  const cps: number[] = [];
  for (const ch of emoji) {
    const cp = ch.codePointAt(0);
    if (cp !== undefined) cps.push(cp);
  }
  const filtered = cps.length > 1 ? cps.filter((cp) => cp !== 0xfe0f) : cps;
  return filtered.map((cp) => cp.toString(16)).join("-");
}
async function renderEmojiSvg(config: FaviconConfig): Promise<string> {
  if (!config.emoji) return "";
  const padding = (config.paddingPct / 100) * SIZE;
  const inner = SIZE - padding * 2;
  const cp = emojiToTwemojiCp(config.emoji);
  let p = emojiSvgCache.get(cp);
  if (!p) {
    p = fetch(`https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${cp}.svg`)
      .then((r) => (r.ok ? r.text() : ""))
      .catch(() => "");
    if (emojiSvgCache.size > 32) {
      const firstKey = emojiSvgCache.keys().next().value;
      if (firstKey) emojiSvgCache.delete(firstKey);
    }
    emojiSvgCache.set(cp, p);
  }
  const svgText = await p;
  if (!svgText) return "";
  // Достаём viewBox + inner content. Twemoji SVG-ки = "<svg ... viewBox='0 0 36 36'>...</svg>".
  const vbMatch = svgText.match(/viewBox=["']([^"']+)["']/i);
  const innerMatch = svgText.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
  if (!innerMatch) return "";
  const viewBox = vbMatch?.[1] ?? "0 0 36 36";
  // Nested <svg> со своим viewBox масштабируется под x/y/width/height родителя.
  return `<svg x="${padding.toFixed(2)}" y="${padding.toFixed(2)}" width="${inner.toFixed(2)}" height="${inner.toFixed(2)}" viewBox="${escapeXml(viewBox)}">${innerMatch[1]}</svg>`;
}

/** Динамически загружаем lucide и react-dom/server — не тянем в bundle если не нужно. */
async function renderIconSvg(config: FaviconConfig): Promise<string> {
  const [lucide, { renderToStaticMarkup }, React] = await Promise.all([
    import("lucide-react"),
    import("react-dom/server"),
    import("react"),
  ]);
  const Icon = (
    lucide as unknown as Record<
      string,
      React.ComponentType<{ size: number; color: string; strokeWidth: number }>
    >
  )[config.iconName];
  if (!Icon) return "";
  const padding = (config.paddingPct / 100) * SIZE;
  const inner = SIZE - padding * 2;
  const element = React.createElement(Icon, {
    size: inner,
    color: config.textColor,
    strokeWidth: config.iconStrokeWidth,
  });
  const iconMarkup = renderToStaticMarkup(element);
  return `<g transform="translate(${padding} ${padding})">${iconMarkup}</g>`;
}

/**
 * SVG-эквивалент canvas shadow: feDropShadow. Тень применяется только к
 * контенту (text/icon), как в renderer.ts. stdDeviation ≈ canvas shadowBlur / 2
 * (Chromium reference) — даёт визуальный match с canvas-превью.
 * Расширенный filter region чтобы тень не обрезалась filter-боксом.
 */
function shadowFilter(config: FaviconConfig): { defs: string; filterAttr: string } {
  if (!config.shadow) return { defs: "", filterAttr: "" };
  const blur = (config.shadowBlur / 100) * SIZE;
  const dy = (config.shadowOffsetY / 100) * SIZE;
  return {
    defs: `<filter id="fmshadow" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="0" dy="${dy.toFixed(2)}" stdDeviation="${(blur / 2).toFixed(2)}" flood-color="${config.shadowColor}"/></filter>`,
    filterAttr: ` filter="url(#fmshadow)"`,
  };
}

function renderBorder(config: FaviconConfig): string {
  if (!config.borderWidth) return "";
  const w = (config.borderWidth / 100) * SIZE;
  const color = config.borderColor;
  if (config.shape === "circle") {
    return `<circle cx="50" cy="50" r="${50 - w / 2}" fill="none" stroke="${color}" stroke-width="${w}"/>`;
  }
  if (config.shape === "rounded") {
    const r = Math.max(0, (config.borderRadiusPct / 100) * 50 - w / 2);
    return `<rect x="${w / 2}" y="${w / 2}" width="${100 - w}" height="${100 - w}" rx="${r}" ry="${r}" fill="none" stroke="${color}" stroke-width="${w}"/>`;
  }
  return `<rect x="${w / 2}" y="${w / 2}" width="${100 - w}" height="${100 - w}" fill="none" stroke="${color}" stroke-width="${w}"/>`;
}

/**
 * Заменить <text>-блок на font-as-path для одной строки. Возвращает null
 * если font fetch / parse / path-generation упали — caller fallback'нётся
 * на обычный renderTextSvg.
 *
 * Только single-line (text2 пустой) — multi-line с разными scale'ами на
 * линию — overkill для font-path версии (редкий use-case).
 */
async function renderTextSvgWithFontPath(config: FaviconConfig): Promise<string | null> {
  if (config.source !== "text" || !config.text || config.text2) return null;
  const baseSize = (config.fontSizePct / 100) * SIZE;
  const strokeWidth =
    config.textStrokeWidth > 0 ? (config.textStrokeWidth / 100) * SIZE : 0;
  return renderTextAsSvgPath(
    config.text,
    config.fontFamily,
    config.fontWeight,
    baseSize,
    SIZE,
    config.textColor,
    strokeWidth > 0
      ? { color: config.textStrokeColor ?? "#000000", widthPx: strokeWidth }
      : undefined,
  );
}

/** Главный экспорт: вернёт SVG-строку или null для source=image. */
export async function renderToSvgString(config: FaviconConfig): Promise<string | null> {
  if (config.source === "image") return null;

  const { defs: bgDefs, fill: bgFill } = backgroundDefs(config);
  const { clipDefs, clipAttr } = shapeClip(config);
  const { defs: shadowDefs, filterAttr: shadowAttr } = shadowFilter(config);

  const bgEl = shapeBgRect(config, bgFill);

  // Embed font as path: только text-source, single-line, юзер явно включил.
  // Fallback на <text> если что-то упало (нет сети / opentype не распарсил).
  let rawContent: string;
  if (config.source === "icon") {
    rawContent = await renderIconSvg(config);
  } else if (config.source === "emoji") {
    rawContent = await renderEmojiSvg(config);
  } else if (config.embedFontInSvg && config.source === "text") {
    const pathSvg = await renderTextSvgWithFontPath(config);
    rawContent = pathSvg ?? renderTextSvg(config);
  } else {
    rawContent = renderTextSvg(config);
  }
  // Тень оборачиваем только содержимое (text/icon), чтобы не давать её
  // фону — как в canvas-рендере. Если shadow off — обёртка не нужна.
  const content = shadowAttr ? `<g${shadowAttr}>${rawContent}</g>` : rawContent;
  const border = renderBorder(config);

  const allDefs = bgDefs + clipDefs + shadowDefs;
  const defsBlock = allDefs ? `<defs>${allDefs}</defs>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">${defsBlock}<g${clipAttr}>${bgEl}${content}</g>${border}</svg>`;
}

/**
 * Применить dark-override к config: textColor и bgColor берутся из dark-полей,
 * bgMode форсируется в "solid" (gradient в dark MVP не поддерживается —
 * слишком много полей дублировать ради краевого кейса).
 *
 * Полезно для рендера парных иконок (favicon-dark.svg / favicon-dark.png).
 */
export function withDarkOverride(config: FaviconConfig): FaviconConfig {
  return {
    ...config,
    textColor: config.darkTextColor,
    bgMode: "solid",
    bgColor: config.darkBgColor,
  };
}

/**
 * Safari pinned-tab SVG: монохромный силуэт без фона/формы/тени/бордера.
 * Safari использует только alpha-канал — заливает финальную иконку цветом
 * из атрибута `color` на <link rel="mask-icon">. В файле фиксируем чёрный
 * — он всё равно будет перекрашен браузером.
 *
 * Для source=image возвращаем null: трассировка силуэта по альфе raster-а
 * без OpenCV сложна и за пределами скоупа.
 */
export async function renderToPinnedTabSvg(config: FaviconConfig): Promise<string | null> {
  if (config.source === "image") return null;
  const monoConfig: FaviconConfig = {
    ...config,
    textColor: "#000000",
    textStrokeColor: null,
    textStrokeWidth: 0,
    bgMode: "transparent",
    borderWidth: 0,
    shadow: false,
    shape: "square",
    borderRadiusPct: 0,
  };
  return renderToSvgString(monoConfig);
}
