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
  const value = config.source === "emoji" ? config.emoji : config.text;
  if (!value) return "";
  const padding = (config.paddingPct / 100) * SIZE;
  const inner = SIZE - padding * 2;
  const baseSize = (config.fontSizePct / 100) * SIZE;
  const source = config.source === "emoji" ? "emoji" : "text";
  const measured = measureTextWidth(
    value,
    config.fontFamily,
    config.fontWeight,
    baseSize,
    source,
  );
  const scale = measured > inner ? inner / measured : 1;
  const finalSize = baseSize * scale;
  const family =
    source === "emoji"
      ? `'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif`
      : `'${config.fontFamily}',sans-serif`;
  const stroke =
    config.textStrokeWidth > 0
      ? ` stroke="${config.textStrokeColor ?? "#000"}" stroke-width="${((config.textStrokeWidth / 100) * SIZE).toFixed(2)}" stroke-linejoin="round" paint-order="stroke fill"`
      : "";
  return `<text x="50" y="50" font-family="${escapeXml(family)}" font-weight="${config.fontWeight}" font-size="${finalSize.toFixed(2)}" letter-spacing="${config.letterSpacing}em" text-anchor="middle" dominant-baseline="central" fill="${config.textColor}"${stroke}>${escapeXml(value)}</text>`;
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

/** Главный экспорт: вернёт SVG-строку или null для source=image. */
export async function renderToSvgString(config: FaviconConfig): Promise<string | null> {
  if (config.source === "image") return null;

  const { defs: bgDefs, fill: bgFill } = backgroundDefs(config);
  const { clipDefs, clipAttr } = shapeClip(config);

  const bgEl = shapeBgRect(config, bgFill);
  const content =
    config.source === "icon" ? await renderIconSvg(config) : renderTextSvg(config);
  const border = renderBorder(config);

  const defsBlock = bgDefs || clipDefs ? `<defs>${bgDefs}${clipDefs}</defs>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">${defsBlock}<g${clipAttr}>${bgEl}${content}</g>${border}</svg>`;
}
