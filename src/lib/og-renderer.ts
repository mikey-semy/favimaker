"use client";

/**
 * Open Graph image renderer — 1200×630 PNG для соц-карточек (Facebook,
 * Twitter "summary_large_image", LinkedIn, Telegram link-preview).
 *
 * Layout MVP (icon-left):
 *   ┌──────────────────────────────────────────────────────┐
 *   │  padding=64                                          │
 *   │  ┌──────┐    Title (large bold, до 3 строк)          │
 *   │  │ ICON │                                            │
 *   │  │      │    Subtitle (regular, до 2 строк)          │
 *   │  └──────┘                                            │
 *   │                                                      │
 *   └──────────────────────────────────────────────────────┘
 *
 * Background — наследует от FaviconConfig (solid/gradient). Цвет текста
 * подбирается автоматически по контрасту против усреднённого bg —
 * белый или почти-чёрный, что лучше читается.
 */
import { contrastRatio } from "./contrast";
import { renderToCanvas } from "./renderer";
import type { FaviconConfig } from "./types";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const PADDING = 64;
const ICON_SIZE = OG_HEIGHT - PADDING * 2; // 502
const ICON_TEXT_GAP = 56;
const TEXT_X = PADDING + ICON_SIZE + ICON_TEXT_GAP;
const TEXT_WIDTH = OG_WIDTH - TEXT_X - PADDING;

const TITLE_FONT_SIZE = 72;
const TITLE_LINE_HEIGHT = 1.1;
const TITLE_MAX_LINES = 3;
const SUBTITLE_FONT_SIZE = 32;
const SUBTITLE_LINE_HEIGHT = 1.35;
const SUBTITLE_MAX_LINES = 3;
const TITLE_SUBTITLE_GAP = 24;

/** Подобрать цвет текста (белый или near-black) для лучшей читаемости. */
function pickTextColor(bgRefColor: string): string {
  const vsWhite = contrastRatio("#ffffff", bgRefColor) ?? 1;
  const vsDark = contrastRatio("#0a0a0f", bgRefColor) ?? 1;
  return vsWhite >= vsDark ? "#ffffff" : "#0a0a0f";
}

/** Усреднённый «представительный» цвет фона — для оценки контраста. */
function effectiveBgRefColor(config: FaviconConfig): string {
  if (config.bgMode === "solid") return config.bgColor;
  if (config.bgMode === "gradient") {
    // Берём from — обычно градиент идёт «из тёмного к ещё более тёмному»
    // или «из бренд-цвета», то и другое одинаково красит фон карточки.
    return config.bgGradient.from;
  }
  // transparent → представим как белый (большинство сайтов на светлом)
  return "#ffffff";
}

/** Залить bg на весь canvas по правилам FaviconConfig. */
function fillBackground(ctx: CanvasRenderingContext2D, config: FaviconConfig) {
  if (config.bgMode === "transparent") {
    // Для OG transparent не имеет смысла (платформы заливают чёрным) —
    // делаем явный белый bg.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, OG_WIDTH, OG_HEIGHT);
    return;
  }
  if (config.bgMode === "solid") {
    ctx.fillStyle = config.bgColor;
    ctx.fillRect(0, 0, OG_WIDTH, OG_HEIGHT);
    return;
  }
  // gradient — горизонтальный по направлению из FaviconConfig
  const { from, to, direction } = config.bgGradient;
  let grad: CanvasGradient;
  if (direction === "radial") {
    grad = ctx.createRadialGradient(
      OG_WIDTH / 2,
      OG_HEIGHT / 2,
      0,
      OG_WIDTH / 2,
      OG_HEIGHT / 2,
      Math.max(OG_WIDTH, OG_HEIGHT) / 2,
    );
  } else {
    const dirMap: Record<string, [number, number, number, number]> = {
      "to-r": [0, OG_HEIGHT / 2, OG_WIDTH, OG_HEIGHT / 2],
      "to-l": [OG_WIDTH, OG_HEIGHT / 2, 0, OG_HEIGHT / 2],
      "to-t": [OG_WIDTH / 2, OG_HEIGHT, OG_WIDTH / 2, 0],
      "to-b": [OG_WIDTH / 2, 0, OG_WIDTH / 2, OG_HEIGHT],
      "to-tr": [0, OG_HEIGHT, OG_WIDTH, 0],
      "to-tl": [OG_WIDTH, OG_HEIGHT, 0, 0],
      "to-br": [0, 0, OG_WIDTH, OG_HEIGHT],
      "to-bl": [OG_WIDTH, 0, 0, OG_HEIGHT],
    };
    const [x0, y0, x1, y1] = dirMap[direction] ?? dirMap["to-br"];
    grad = ctx.createLinearGradient(x0, y0, x1, y1);
  }
  grad.addColorStop(0, from);
  grad.addColorStop(1, to);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, OG_WIDTH, OG_HEIGHT);
}

/** Word-wrap с обрезкой до maxLines (последняя получает «…» если переполнена). */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  if (!text) return [];
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      if (lines.length >= maxLines) break;
      line = word;
    } else {
      line = test;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  // Если последняя строка содержит ВСЕ оставшиеся слова и не влезает —
  // обрежем до ширины с «…».
  if (lines.length === maxLines && words.length > 0) {
    const totalWordsUsed = lines.join(" ").split(/\s+/).length;
    if (totalWordsUsed < words.length) {
      const last = lines[lines.length - 1];
      lines[lines.length - 1] = truncateToWidth(ctx, last + " …", maxWidth);
    }
  }
  return lines;
}

function truncateToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let s = text;
  while (s.length > 1 && ctx.measureText(s + "…").width > maxWidth) {
    s = s.slice(0, -1);
  }
  return s + "…";
}

/**
 * Главная функция. Возвращает PNG Blob 1200×630.
 *
 * Использует существующий renderToCanvas для иконки → drawImage'ит её
 * в position'е (PADDING, PADDING). Иконка наследует ВСЕ FaviconConfig
 * (shape, gradient, shadow, border, etc) — выглядит как «большой favicon».
 */
export async function renderOgImageToBlob(
  config: FaviconConfig,
  title: string,
  subtitle: string,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = OG_WIDTH;
  canvas.height = OG_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  // 1. Background
  fillBackground(ctx, config);

  // 2. Icon — рендерим в sub-canvas через existing renderer, потом drawImage
  const iconCanvas = document.createElement("canvas");
  iconCanvas.width = ICON_SIZE;
  iconCanvas.height = ICON_SIZE;
  await renderToCanvas(iconCanvas, config);
  ctx.drawImage(iconCanvas, PADDING, PADDING);

  // 3. Text
  const textColor = pickTextColor(effectiveBgRefColor(config));
  ctx.fillStyle = textColor;
  ctx.textBaseline = "top";

  // Title
  ctx.font = `700 ${TITLE_FONT_SIZE}px "Inter", "Helvetica", sans-serif`;
  const titleLines = wrapText(ctx, title || "", TEXT_WIDTH, TITLE_MAX_LINES);
  let y = (OG_HEIGHT - estimateTextBlockHeight(titleLines.length, true, subtitle.length > 0)) / 2;
  for (const line of titleLines) {
    ctx.fillText(line, TEXT_X, y);
    y += TITLE_FONT_SIZE * TITLE_LINE_HEIGHT;
  }

  // Subtitle (с пониженной opacity для иерархии)
  if (subtitle) {
    y += TITLE_SUBTITLE_GAP - TITLE_FONT_SIZE * (TITLE_LINE_HEIGHT - 1);
    ctx.font = `400 ${SUBTITLE_FONT_SIZE}px "Inter", "Helvetica", sans-serif`;
    ctx.globalAlpha = 0.75;
    const subtitleLines = wrapText(ctx, subtitle, TEXT_WIDTH, SUBTITLE_MAX_LINES);
    for (const line of subtitleLines) {
      ctx.fillText(line, TEXT_X, y);
      y += SUBTITLE_FONT_SIZE * SUBTITLE_LINE_HEIGHT;
    }
    ctx.globalAlpha = 1;
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob returned null"))),
      "image/png",
    );
  });
}

/**
 * Оценка высоты текстового блока для вертикального центрирования.
 * Приблизительно — учитываем title + (gap + subtitle если есть).
 */
function estimateTextBlockHeight(
  titleLineCount: number,
  hasTitle: boolean,
  hasSubtitle: boolean,
): number {
  if (!hasTitle && !hasSubtitle) return 0;
  let h = titleLineCount * TITLE_FONT_SIZE * TITLE_LINE_HEIGHT;
  if (hasSubtitle) {
    // Приблизительно: 1.5 строки субтитла в среднем
    h += TITLE_SUBTITLE_GAP + 1.5 * SUBTITLE_FONT_SIZE * SUBTITLE_LINE_HEIGHT;
  }
  return h;
}
