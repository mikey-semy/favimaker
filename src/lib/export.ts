"use client";

import JSZip from "jszip";
import { encodeIco } from "./ico";
import { buildHtmlSnippet, buildManifest } from "./manifest";
import { renderToPngBlob } from "./renderer";
import type { FaviconConfig } from "./types";

const PNG_SIZES = {
  "favicon-16x16.png": 16,
  "favicon-32x32.png": 32,
  "apple-touch-icon.png": 180,
  "android-chrome-192x192.png": 192,
  "android-chrome-512x512.png": 512,
} as const;

/** Размеры что вшиваются в один .ico-файл — Vista+ принимает PNG-payload. */
const ICO_SIZES = [16, 32, 48];

async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

/**
 * Собрать ZIP со всем набором favicon-ассетов под текущий конфиг.
 * Возвращает Blob готовый для скачивания через FileSaver / URL.createObjectURL.
 */
export async function buildFaviconZip(
  config: FaviconConfig,
  appName: string,
): Promise<Blob> {
  const zip = new JSZip();

  // PNG-варианты
  for (const [filename, size] of Object.entries(PNG_SIZES)) {
    const blob = await renderToPngBlob(size, config);
    zip.file(filename, blob);
  }

  // ICO (16 + 32 + 48 склеены)
  const icoImages = await Promise.all(
    ICO_SIZES.map(async (size) => ({
      size,
      png: await blobToUint8Array(await renderToPngBlob(size, config)),
    })),
  );
  const icoBytes = encodeIco(icoImages);
  zip.file("favicon.ico", icoBytes);

  // Manifest + HTML snippet
  zip.file("site.webmanifest", buildManifest(config, appName || "Site"));
  zip.file("README.html-snippet.html", buildHtmlSnippet());

  // README в zip-е
  zip.file(
    "README.txt",
    [
      "favimaker — сгенерированный пакет favicon",
      "",
      "Файлы:",
      "  favicon.ico                       — для старых браузеров / Windows",
      "  favicon-16x16.png                 — браузерная вкладка",
      "  favicon-32x32.png                 — браузерная вкладка retina",
      "  apple-touch-icon.png (180x180)    — iOS home screen",
      "  android-chrome-192x192.png        — Android (стандарт)",
      "  android-chrome-512x512.png        — Android (large)",
      "  site.webmanifest                  — PWA-манифест",
      "",
      "Установка:",
      "  1. Распакуйте всё в /public корня сайта.",
      "  2. Вставьте содержимое README.html-snippet.html в <head>.",
      "",
      "Сгенерировано favimaker (https://favimaker.app)",
    ].join("\n"),
  );

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
