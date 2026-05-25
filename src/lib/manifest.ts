import type { FaviconConfig } from "./types";

/**
 * Сгенерировать site.webmanifest для PWA / Android.
 * Theme/background-color берём из конфига чтобы Android-launcher и iOS-splash
 * совпадали с самой иконкой.
 */
export function buildManifest(config: FaviconConfig, appName = "Site"): string {
  const themeColor =
    config.bgMode === "solid"
      ? config.bgColor
      : config.bgMode === "gradient"
        ? config.bgGradient.from
        : "#ffffff";

  return JSON.stringify(
    {
      name: appName,
      short_name: appName,
      icons: [
        { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
      ],
      theme_color: themeColor,
      background_color: themeColor,
      display: "standalone",
    },
    null,
    2,
  );
}

/** HTML-сниппет для вставки в <head> сайта. */
export function buildHtmlSnippet(): string {
  return `<!-- Сгенерировано favimaker. Положите все файлы в /public корня сайта. -->
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
`;
}
