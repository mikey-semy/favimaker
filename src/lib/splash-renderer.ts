"use client";

/**
 * iOS PWA splash screens — `apple-touch-startup-image`. Apple требует
 * отдельный PNG под каждое разрешение + media-query на link tag, иначе
 * splash не покажется при запуске standalone-PWA с home screen.
 *
 * Mapping: device → (width × height portrait, device-pixel-ratio).
 * Landscape — те же device-точки но swap width/height.
 *
 * Rendering: bg на весь canvas (solid/gradient из FaviconConfig), иконка
 * по центру в ~30% от min-side (через renderToCanvas в sub-canvas →
 * drawImage). transparent bg → белый bg (iOS заливает чёрным иначе).
 */
import type { FaviconConfig } from "./types";
import { renderToCanvas } from "./renderer";

/** Список целевых iPhone + iPad устройств. Sub-set Apple HIG для разумного
 *  размера архива — топовые модели на 2024+. */
export type SplashDevice = {
  /** Human-readable label для имени файла. */
  id: string;
  /** Width × Height в физических пикселях, portrait. */
  width: number;
  height: number;
  /** device-pixel-ratio (1 / 2 / 3). Используется в media-query. */
  dpr: number;
  /** Device-width в pt (CSS пикселях). */
  ptWidth: number;
  ptHeight: number;
};

export const SPLASH_DEVICES: SplashDevice[] = [
  // iPhone (DPR 2 / 3)
  { id: "iphone-se", width: 750, height: 1334, dpr: 2, ptWidth: 375, ptHeight: 667 },
  { id: "iphone-xr-11", width: 828, height: 1792, dpr: 2, ptWidth: 414, ptHeight: 896 },
  { id: "iphone-x-xs-11pro", width: 1125, height: 2436, dpr: 3, ptWidth: 375, ptHeight: 812 },
  { id: "iphone-xs-max-11-pro-max", width: 1242, height: 2688, dpr: 3, ptWidth: 414, ptHeight: 896 },
  { id: "iphone-12-mini", width: 1080, height: 2340, dpr: 3, ptWidth: 360, ptHeight: 780 },
  { id: "iphone-12-13-14", width: 1170, height: 2532, dpr: 3, ptWidth: 390, ptHeight: 844 },
  { id: "iphone-14-plus-12-13-pro-max", width: 1284, height: 2778, dpr: 3, ptWidth: 428, ptHeight: 926 },
  { id: "iphone-14-pro-15", width: 1179, height: 2556, dpr: 3, ptWidth: 393, ptHeight: 852 },
  { id: "iphone-14-pro-max-15-pro-max", width: 1290, height: 2796, dpr: 3, ptWidth: 430, ptHeight: 932 },
  // iPad (DPR 2)
  { id: "ipad-mini-air", width: 1536, height: 2048, dpr: 2, ptWidth: 768, ptHeight: 1024 },
  { id: "ipad-pro-11", width: 1668, height: 2388, dpr: 2, ptWidth: 834, ptHeight: 1194 },
  { id: "ipad-pro-13", width: 2048, height: 2732, dpr: 2, ptWidth: 1024, ptHeight: 1366 },
];

/** Залить bg на весь canvas (solid/gradient как в FaviconConfig). */
function fillBg(ctx: CanvasRenderingContext2D, w: number, h: number, config: FaviconConfig) {
  if (config.bgMode === "transparent" || config.bgMode === "solid") {
    ctx.fillStyle = config.bgMode === "transparent" ? "#ffffff" : config.bgColor;
    ctx.fillRect(0, 0, w, h);
    return;
  }
  // gradient
  const { from, to, direction } = config.bgGradient;
  let grad: CanvasGradient;
  if (direction === "radial") {
    grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 2);
  } else {
    const dirMap: Record<string, [number, number, number, number]> = {
      "to-r": [0, h / 2, w, h / 2],
      "to-l": [w, h / 2, 0, h / 2],
      "to-t": [w / 2, h, w / 2, 0],
      "to-b": [w / 2, 0, w / 2, h],
      "to-tr": [0, h, w, 0],
      "to-tl": [w, h, 0, 0],
      "to-br": [0, 0, w, h],
      "to-bl": [w, 0, 0, h],
    };
    const [x0, y0, x1, y1] = dirMap[direction] ?? dirMap["to-br"];
    grad = ctx.createLinearGradient(x0, y0, x1, y1);
  }
  grad.addColorStop(0, from);
  grad.addColorStop(1, to);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

/** Отрендерить splash для устройства в заданной ориентации. */
export async function renderSplashToBlob(
  config: FaviconConfig,
  device: SplashDevice,
  orientation: "portrait" | "landscape",
): Promise<Blob> {
  const w = orientation === "portrait" ? device.width : device.height;
  const h = orientation === "portrait" ? device.height : device.width;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  fillBg(ctx, w, h, config);

  // Иконка по центру, ~30% от min-side. Не больше 512px чтобы не плыло
  // на iPad Pro (там min=1668, *0.3 = 500 — fit).
  const minSide = Math.min(w, h);
  const iconSize = Math.min(Math.round(minSide * 0.3), 512);
  const iconCanvas = document.createElement("canvas");
  iconCanvas.width = iconSize;
  iconCanvas.height = iconSize;
  await renderToCanvas(iconCanvas, config);
  ctx.drawImage(iconCanvas, (w - iconSize) / 2, (h - iconSize) / 2);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob returned null"))),
      "image/png",
    );
  });
}

/** Имя файла под device + orientation. Совпадает с тем что в snippet. */
export function splashFileName(device: SplashDevice, orientation: "portrait" | "landscape"): string {
  return `apple-splash-${device.id}-${orientation}.png`;
}

/** Media-query для link[apple-touch-startup-image] под device + orientation. */
export function splashMediaQuery(
  device: SplashDevice,
  orientation: "portrait" | "landscape",
): string {
  // Apple специфика: device-width/height в pt, -webkit-device-pixel-ratio,
  // и orientation. Точное совпадение всех трёх — иначе iOS не покажет.
  return `(device-width: ${device.ptWidth}px) and (device-height: ${device.ptHeight}px) and (-webkit-device-pixel-ratio: ${device.dpr}) and (orientation: ${orientation})`;
}

/** Все splash-задачи (portrait + landscape для всех устройств) — для Promise.all. */
export function buildAllSplashTasks(
  config: FaviconConfig,
): Promise<readonly [string, Blob]>[] {
  const tasks: Promise<readonly [string, Blob]>[] = [];
  for (const device of SPLASH_DEVICES) {
    for (const orientation of ["portrait", "landscape"] as const) {
      tasks.push(
        renderSplashToBlob(config, device, orientation).then(
          (blob) => [splashFileName(device, orientation), blob] as const,
        ),
      );
    }
  }
  return tasks;
}

/** Все link-tags для HTML-сниппета. */
export function buildAllSplashLinks(): string[] {
  const lines: string[] = [];
  for (const device of SPLASH_DEVICES) {
    for (const orientation of ["portrait", "landscape"] as const) {
      const href = `/${splashFileName(device, orientation)}`;
      const media = splashMediaQuery(device, orientation);
      lines.push(`<link rel="apple-touch-startup-image" href="${href}" media="${media}">`);
    }
  }
  return lines;
}
