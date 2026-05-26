/**
 * WCAG 2.x contrast helpers. Чистые функции, без React.
 *
 * Формула: https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 *   L = 0.2126·R + 0.7152·G + 0.0722·B (relative luminance)
 *   ratio = (L1 + 0.05) / (L2 + 0.05), где L1 ≥ L2
 *
 * Пороги:
 *   AAA normal:  ≥ 7.0
 *   AA  normal:  ≥ 4.5
 *   AA  large:   ≥ 3.0  (favicon-«символ» крупный → можно ослабить, но
 *                       строгий 4.5 более универсален; используем его)
 */

import type { FaviconConfig } from "./types";

export type ContrastLevel = "AAA" | "AA" | "AA-large" | "fail";

/** Парсит #RRGGBB / #RGB / #RRGGBBAA в {r,g,b} 0..255. Alpha игнорируется. */
function parseHex(hex: string): { r: number; g: number; b: number } | null {
  if (!hex) return null;
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length === 8) h = h.slice(0, 6);
  if (h.length !== 6 || !/^[0-9a-f]{6}$/i.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** sRGB → linear (per WCAG). */
function linearize(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number | null {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  return 0.2126 * linearize(rgb.r) + 0.7152 * linearize(rgb.g) + 0.0722 * linearize(rgb.b);
}

/** Возвращает контраст по WCAG. null если хоть один цвет не распарсился. */
export function contrastRatio(fg: string, bg: string): number | null {
  const L1 = luminance(fg);
  const L2 = luminance(bg);
  if (L1 === null || L2 === null) return null;
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

export function classifyContrast(ratio: number): ContrastLevel {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA-large";
  return "fail";
}

/**
 * Эффективный «фон» относительно которого считаем контраст текста/иконки.
 *
 * - solid: один цвет → одно число
 * - gradient: считаем оба края, возвращаем **минимальный** контраст
 *   (худший случай — где будет хуже всего видно)
 * - transparent: null — фон зависит от хоста, judgement невозможен
 *
 * Null также для:
 * - source=image: фоном выступает картинка, не цвет
 * - source=emoji: textColor рендерером игнорируется (эмодзи рисуются
 *   своими цветами через системный emoji-font), контраст судить не от чего
 */
export function effectiveContrast(config: FaviconConfig): number | null {
  if (config.source === "image" || config.source === "emoji") return null;
  if (config.bgMode === "transparent") return null;
  const fg = config.textColor;
  if (config.bgMode === "solid") return contrastRatio(fg, config.bgColor);
  // gradient
  const a = contrastRatio(fg, config.bgGradient.from);
  const b = contrastRatio(fg, config.bgGradient.to);
  if (a === null || b === null) return a ?? b;
  return Math.min(a, b);
}
