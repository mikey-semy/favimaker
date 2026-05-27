"use client";

import JSZip from "jszip";
import { encodeIco } from "./ico";
import {
  buildBrowserConfig,
  buildHtmlSnippet,
  buildManifest,
  themeColorFromConfig,
} from "./manifest";
import { renderToPngBlob } from "./renderer";
import { renderOgImageToBlob } from "./og-renderer";
import { renderToPinnedTabSvg, renderToSvgString } from "./svg-render";
import type { FaviconConfig } from "./types";

/** Группы файлов архива — пользователь может выключать ненужные. */
export type ExportInclude = {
  svg: boolean;
  safariPinnedTab: boolean;
  ico: boolean;
  pngBrowser: boolean;
  apple: boolean;
  /** Apple touch icon доп. размеры (120/152/167). Off по умолчанию —
   *  Apple HIG, 180×180 покрывает большинство кейсов; эти варианты — для
   *  точного соответствия конкретным устройствам (iPhone @2x, iPad, iPad Pro). */
  appleVariants: boolean;
  android: boolean;
  maskable: boolean;
  mstile: boolean;
  /** Open Graph image 1200×630 (Facebook/Twitter/LinkedIn/Telegram preview).
   *  По умолчанию on — большинство сайтов хотят соц-превью. */
  socialCard: boolean;
  manifest: boolean;
  browserconfig: boolean;
  htmlSnippet: boolean;
  readme: boolean;
};

export const DEFAULT_INCLUDE: ExportInclude = {
  svg: true,
  safariPinnedTab: true,
  ico: true,
  pngBrowser: true,
  apple: true,
  appleVariants: false,
  android: true,
  maskable: true,
  mstile: true,
  socialCard: true,
  manifest: true,
  browserconfig: true,
  htmlSnippet: true,
  readme: true,
};

/** Сколько файлов соответствует каждой группе (для счётчика в UI). */
export const INCLUDE_FILE_COUNTS: Record<keyof ExportInclude, number> = {
  svg: 1,
  safariPinnedTab: 1,
  ico: 1,
  pngBrowser: 3,
  apple: 1,
  appleVariants: 3,
  android: 2,
  maskable: 2,
  mstile: 1,
  socialCard: 1,
  manifest: 1,
  browserconfig: 1,
  htmlSnippet: 1,
  readme: 1,
};

const BROWSER_PNG = { "favicon-16x16.png": 16, "favicon-32x32.png": 32, "favicon-96x96.png": 96 } as const;
const ANDROID_PNG = {
  "android-chrome-192x192.png": 192,
  "android-chrome-512x512.png": 512,
} as const;

/** Apple touch icon доп. размеры — iPhone @2x (120), iPad (152), iPad Pro (167). */
const APPLE_VARIANTS = {
  "apple-touch-icon-120x120.png": 120,
  "apple-touch-icon-152x152.png": 152,
  "apple-touch-icon-167x167.png": 167,
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
      "  favicon.svg                              — modern browsers (vector, sharp at any DPI)",
      "  favicon.ico                              — legacy browsers / Windows (16+32+48)",
      "  favicon-16x16.png                        — browser tab",
      "  favicon-32x32.png                        — browser tab (retina)",
      "  favicon-96x96.png                        — legacy Chrome / Android",
      "  apple-touch-icon.png (180x180)           — iOS / macOS Safari home screen",
      "  apple-touch-icon-120x120.png             — iPhone @2x (opt-in)",
      "  apple-touch-icon-152x152.png             — iPad (opt-in)",
      "  apple-touch-icon-167x167.png             — iPad Pro (opt-in)",
      "  android-chrome-192x192.png               — Android Chrome (standard)",
      "  android-chrome-512x512.png               — Android Chrome (large) + PWA splash",
      "  android-chrome-maskable-192x192.png      — Android launcher with mask (safe zone)",
      "  android-chrome-maskable-512x512.png      — same for large",
      "  mstile-150x150.png                       — Windows pinned tile",
      "  safari-pinned-tab.svg                    — Safari pinned tab (monochrome mask)",
      "  og-image.png (1200x630)                  — Open Graph / Twitter card preview",
      "  site.webmanifest                         — PWA manifest (with maskable variants)",
      "  browserconfig.xml                        — Windows tiles config",
      "  README.html-snippet.html                 — ready <link> tags for <head>",
      "",
      "Installation:",
      "  1. Unpack everything into /public of your site root.",
      "  2. Paste contents of README.html-snippet.html into your <head>.",
      "",
      "Generated with favimaker (https://github.com/mikey-semy/favimaker)",
    ].join("\n");
  }
  return [
    "favimaker — сгенерированный пакет favicon",
    "",
    "Файлы:",
    "  favicon.svg                              — современные браузеры (vector, резко на любом DPI)",
    "  favicon.ico                              — старые браузеры / Windows (16+32+48)",
    "  favicon-16x16.png                        — браузерная вкладка",
    "  favicon-32x32.png                        — браузерная вкладка retina",
    "  favicon-96x96.png                        — legacy Chrome / Android",
    "  apple-touch-icon.png (180x180)           — iOS / macOS Safari home screen",
    "  apple-touch-icon-120x120.png             — iPhone @2x (opt-in)",
    "  apple-touch-icon-152x152.png             — iPad (opt-in)",
    "  apple-touch-icon-167x167.png             — iPad Pro (opt-in)",
    "  android-chrome-192x192.png               — Android Chrome (стандарт)",
    "  android-chrome-512x512.png               — Android Chrome (large) + PWA splash",
    "  android-chrome-maskable-192x192.png      — Android-launcher с обрезкой (safe zone)",
    "  android-chrome-maskable-512x512.png      — то же для large",
    "  mstile-150x150.png                       — Windows pinned tile",
    "  safari-pinned-tab.svg                    — Safari pinned tab (монохромная маска)",
    "  og-image.png (1200x630)                  — Open Graph / Twitter card превью",
    "  site.webmanifest                         — PWA-манифест (с maskable-вариантами)",
    "  browserconfig.xml                        — config для Windows tiles",
    "  README.html-snippet.html                 — готовые <link> для <head>",
    "",
    "Установка:",
    "  1. Распакуйте всё в /public корня сайта.",
    "  2. Вставьте содержимое README.html-snippet.html в <head>.",
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
export type SocialMeta = {
  /** Subtitle/description под title в OG-картинке + og:description в snippet. */
  description?: string;
  /** Canonical URL сайта — попадает в og:url meta. */
  url?: string;
  /** Включить полный meta-head блок (theme-color/application-name/apple-*). */
  fullMetaHead?: boolean;
};

export async function buildFaviconZip(
  config: FaviconConfig,
  appName: string,
  locale: "ru" | "en" = "ru",
  include: ExportInclude = DEFAULT_INCLUDE,
  social: SocialMeta = {},
): Promise<Blob> {
  const zip = new JSZip();

  // Группы PNG, отрендерим только те что включены — экономия CPU когда
  // юзер выключил половину.
  const pngTasks: Promise<readonly [string, Blob]>[] = [];
  if (include.pngBrowser) {
    for (const [fn, size] of Object.entries(BROWSER_PNG)) {
      pngTasks.push(renderToPngBlob(size, config).then((b) => [fn, b] as const));
    }
  }
  if (include.apple) {
    pngTasks.push(renderToPngBlob(180, config).then((b) => ["apple-touch-icon.png", b] as const));
  }
  if (include.appleVariants) {
    for (const [fn, size] of Object.entries(APPLE_VARIANTS)) {
      pngTasks.push(renderToPngBlob(size, config).then((b) => [fn, b] as const));
    }
  }
  if (include.android) {
    for (const [fn, size] of Object.entries(ANDROID_PNG)) {
      pngTasks.push(renderToPngBlob(size, config).then((b) => [fn, b] as const));
    }
  }
  if (include.mstile) {
    pngTasks.push(renderToPngBlob(150, config).then((b) => ["mstile-150x150.png", b] as const));
  }

  const maskableTasks: Promise<readonly [string, Blob]>[] = [];
  if (include.maskable) {
    const maskableConfig = toMaskableConfig(config);
    for (const [fn, size] of Object.entries(MASKABLE_SIZES)) {
      maskableTasks.push(
        renderToPngBlob(size, maskableConfig).then((b) => [fn, b] as const),
      );
    }
  }

  const icoTask = include.ico
    ? Promise.all(
        ICO_SIZES.map(async (size) => ({
          size,
          png: await blobToUint8Array(await renderToPngBlob(size, config)),
        })),
      )
    : Promise.resolve(null);

  // SVG-таски: вернут null для image-source (raster в SVG бессмысленен)
  const svgTask: Promise<string | null> = include.svg
    ? renderToSvgString(config)
    : Promise.resolve(null);
  const pinnedTabTask: Promise<string | null> = include.safariPinnedTab
    ? renderToPinnedTabSvg(config)
    : Promise.resolve(null);

  // OG-card: 1200×630 PNG. Если title (appName) пустой — не генерим
  // карточку без хоть какого-то заголовка (выглядит ущербно).
  const ogTask: Promise<Blob | null> =
    include.socialCard && (appName || "").trim()
      ? renderOgImageToBlob(config, appName || "Site", social.description ?? "")
      : Promise.resolve(null);

  const [pngBlobs, maskableBlobs, icoPngs, svgString, pinnedTabSvg, ogBlob] =
    await Promise.all([
      Promise.all(pngTasks),
      Promise.all(maskableTasks),
      icoTask,
      svgTask,
      pinnedTabTask,
      ogTask,
    ]);

  for (const [fn, blob] of pngBlobs) zip.file(fn, blob);
  for (const [fn, blob] of maskableBlobs) zip.file(fn, blob);
  if (icoPngs) zip.file("favicon.ico", encodeIco(icoPngs));
  if (svgString) zip.file("favicon.svg", svgString);
  if (pinnedTabSvg) zip.file("safari-pinned-tab.svg", pinnedTabSvg);
  if (ogBlob) zip.file("og-image.png", ogBlob);

  if (include.manifest) {
    zip.file("site.webmanifest", buildManifest(config, appName || "Site"));
  }
  if (include.browserconfig) {
    zip.file("browserconfig.xml", buildBrowserConfig(config));
  }
  if (include.htmlSnippet) {
    zip.file(
      "README.html-snippet.html",
      buildHtmlSnippet({
        svg: include.svg && config.source !== "image",
        safariPinnedTab: include.safariPinnedTab && config.source !== "image",
        safariPinnedTabColor: config.textColor,
        ico: include.ico,
        pngBrowser: include.pngBrowser,
        apple: include.apple,
        appleVariants: include.appleVariants,
        manifest: include.manifest,
        browserconfig: include.browserconfig,
        socialCard: include.socialCard && !!ogBlob,
        socialTitle: appName,
        socialDescription: social.description,
        socialUrl: social.url,
        fullMetaHead: social.fullMetaHead,
        themeColorLight: social.fullMetaHead ? themeColorFromConfig(config) : undefined,
      }),
    );
  }
  if (include.readme) {
    zip.file("README.txt", buildReadmeText(locale));
  }

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
