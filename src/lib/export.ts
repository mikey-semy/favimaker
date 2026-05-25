"use client";

import JSZip from "jszip";
import { encodeIco } from "./ico";
import { buildBrowserConfig, buildHtmlSnippet, buildManifest } from "./manifest";
import { renderToPngBlob } from "./renderer";
import type { FaviconConfig } from "./types";

/**
 * Стандартные PNG-варианты под все веб-платформы. Покрывают браузеры
 * (16/32/96), iOS home screen (180), Android Chrome / PWA (192/512),
 * Windows Tiles (150), плюс maskable-варианты для Android-launcher с
 * формой-маской.
 */
const PNG_SIZES = {
  "favicon-16x16.png": 16,
  "favicon-32x32.png": 32,
  "favicon-96x96.png": 96,
  "apple-touch-icon.png": 180,
  "android-chrome-192x192.png": 192,
  "android-chrome-512x512.png": 512,
  "mstile-150x150.png": 150,
} as const;

/** Размеры что вшиваются в один .ico-файл — Vista+ принимает PNG-payload. */
const ICO_SIZES = [16, 32, 48];

/** Maskable-варианты для Android-launcher (могут обрезать иконку под любую форму).
 *  Контент должен помещаться в safe-zone 80% → принудительный padding ≥18%
 *  и непрозрачный фон. */
const MASKABLE_SIZES = {
  "android-chrome-maskable-192x192.png": 192,
  "android-chrome-maskable-512x512.png": 512,
} as const;

async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

function buildReadmeText(locale: "ru" | "en"): string {
  if (locale === "en") {
    return [
      "favimaker — generated favicon package",
      "",
      "Files:",
      "  favicon.ico                              — legacy browsers / Windows (16+32+48)",
      "  favicon-16x16.png                        — browser tab",
      "  favicon-32x32.png                        — browser tab (retina)",
      "  favicon-96x96.png                        — legacy Chrome / Android",
      "  apple-touch-icon.png (180x180)           — iOS / macOS Safari home screen",
      "  android-chrome-192x192.png               — Android Chrome (standard)",
      "  android-chrome-512x512.png               — Android Chrome (large) + PWA splash",
      "  android-chrome-maskable-192x192.png      — Android launcher with mask (safe zone)",
      "  android-chrome-maskable-512x512.png      — same for large",
      "  mstile-150x150.png                       — Windows pinned tile",
      "  site.webmanifest                         — PWA manifest (with maskable variants)",
      "  browserconfig.xml                        — Windows tiles config",
      "  README.html-snippet.html                 — ready <link> tags for <head>",
      "",
      "Installation:",
      "  1. Unpack everything into /public of your site root.",
      "  2. Paste contents of README.html-snippet.html into your <head>.",
      "",
      "macOS Safari pinned tab (safari-pinned-tab.svg) skipped —",
      "it requires monochrome SVG generation. Safari works fine without it.",
      "",
      "Generated with favimaker (https://github.com/mikey-semy/favimaker)",
    ].join("\n");
  }
  return [
    "favimaker — сгенерированный пакет favicon",
    "",
    "Файлы:",
    "  favicon.ico                              — старые браузеры / Windows (16+32+48)",
    "  favicon-16x16.png                        — браузерная вкладка",
    "  favicon-32x32.png                        — браузерная вкладка retina",
    "  favicon-96x96.png                        — legacy Chrome / Android",
    "  apple-touch-icon.png (180x180)           — iOS / macOS Safari home screen",
    "  android-chrome-192x192.png               — Android Chrome (стандарт)",
    "  android-chrome-512x512.png               — Android Chrome (large) + PWA splash",
    "  android-chrome-maskable-192x192.png      — Android-launcher с обрезкой (safe zone)",
    "  android-chrome-maskable-512x512.png      — то же для large",
    "  mstile-150x150.png                       — Windows pinned tile",
    "  site.webmanifest                         — PWA-манифест (с maskable-вариантами)",
    "  browserconfig.xml                        — config для Windows tiles",
    "  README.html-snippet.html                 — готовые <link> для <head>",
    "",
    "Установка:",
    "  1. Распакуйте всё в /public корня сайта.",
    "  2. Вставьте содержимое README.html-snippet.html в <head>.",
    "",
    "macOS Safari pinned tab (safari-pinned-tab.svg) пропущен —",
    "требует одноцветной SVG-генерации. Safari работает и без него.",
    "",
    "Сгенерировано favimaker (https://github.com/mikey-semy/favimaker)",
  ].join("\n");
}

/** Подготовить конфиг под maskable-рендер: safe-zone + непрозрачный фон. */
function toMaskableConfig(config: FaviconConfig): FaviconConfig {
  const next = { ...config };
  next.paddingPct = Math.max(config.paddingPct, 18);
  next.shape = "square"; // maskable рисуется в квадрат, маску накладывает ОС
  next.borderRadiusPct = 0;
  // Maskable должен быть непрозрачным — Android заливает остальное чёрным иначе
  if (config.bgMode === "transparent") {
    next.bgMode = "solid";
    next.bgColor = config.bgColor || "#ffffff";
  }
  return next;
}

/**
 * Собрать ZIP со всем набором favicon-ассетов под текущий конфиг.
 * Возвращает Blob готовый для скачивания через FileSaver / URL.createObjectURL.
 */
export async function buildFaviconZip(
  config: FaviconConfig,
  appName: string,
  locale: "ru" | "en" = "ru",
): Promise<Blob> {
  const zip = new JSZip();

  // Параллельный рендер всех 12 PNG (7 стандартных + 2 maskable + 3 ICO).
  // На слабых устройствах это раза в 2-3 быстрее последовательного await.
  const maskableConfig = toMaskableConfig(config);
  const [standardBlobs, maskableBlobs, icoPngs] = await Promise.all([
    Promise.all(
      Object.entries(PNG_SIZES).map(async ([fn, size]) => [fn, await renderToPngBlob(size, config)] as const),
    ),
    Promise.all(
      Object.entries(MASKABLE_SIZES).map(
        async ([fn, size]) => [fn, await renderToPngBlob(size, maskableConfig)] as const,
      ),
    ),
    Promise.all(
      ICO_SIZES.map(async (size) => ({
        size,
        png: await blobToUint8Array(await renderToPngBlob(size, config)),
      })),
    ),
  ]);

  for (const [fn, blob] of standardBlobs) zip.file(fn, blob);
  for (const [fn, blob] of maskableBlobs) zip.file(fn, blob);
  zip.file("favicon.ico", encodeIco(icoPngs));

  // Manifest (с maskable-вариантами) + browserconfig (Windows tiles) + HTML snippet
  zip.file("site.webmanifest", buildManifest(config, appName || "Site"));
  zip.file("browserconfig.xml", buildBrowserConfig(config));
  zip.file("README.html-snippet.html", buildHtmlSnippet());

  zip.file("README.txt", buildReadmeText(locale));

  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}

/** Скачать blob через временный <a>. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
