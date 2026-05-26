import type { FaviconConfig } from "./types";

function themeColorFromConfig(config: FaviconConfig): string {
  if (config.bgMode === "solid") return config.bgColor;
  if (config.bgMode === "gradient") return config.bgGradient.from;
  return "#ffffff";
}

/**
 * Сгенерировать site.webmanifest для PWA / Android.
 * Включает maskable-варианты с purpose="maskable" — Android-launcher с
 * формой-маской (круг, squircle и т.п.) использует их вместо обычных.
 */
export function buildManifest(config: FaviconConfig, appName = "Site"): string {
  const themeColor = themeColorFromConfig(config);

  return JSON.stringify(
    {
      name: appName,
      short_name: appName,
      icons: [
        {
          src: "/android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/android-chrome-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/android-chrome-maskable-192x192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable",
        },
        {
          src: "/android-chrome-maskable-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
      theme_color: themeColor,
      background_color: themeColor,
      display: "standalone",
    },
    null,
    2,
  );
}

/**
 * browserconfig.xml — для старых Windows pinned-tiles (IE10+, Edge legacy).
 * Современные браузеры игнорируют, но безвредно.
 */
export function buildBrowserConfig(config: FaviconConfig): string {
  const tileColor = themeColorFromConfig(config);
  return `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="/mstile-150x150.png"/>
      <TileColor>${tileColor}</TileColor>
    </tile>
  </msapplication>
</browserconfig>
`;
}

/**
 * HTML-сниппет для вставки в <head> сайта.
 *
 * Все секции — опциональные, чтобы сниппет не ссылался на файлы которых
 * нет в архиве. Если include не задан — включаем всё (старый default).
 */
export type SnippetInclude = {
  svg?: boolean;
  safariPinnedTab?: boolean;
  /** Цвет для атрибута `color=` на <link rel="mask-icon"> (Safari pinned-tab). */
  safariPinnedTabColor?: string;
  ico?: boolean;
  pngBrowser?: boolean;
  apple?: boolean;
  manifest?: boolean;
  browserconfig?: boolean;
};

export function buildHtmlSnippet(include: SnippetInclude = {}): string {
  // Дефолт для bool-флагов = true (для старых вызовов без аргумента — full snippet)
  const flag = (key: keyof SnippetInclude) => include[key] !== false;
  const lines: string[] = ["<!-- Сгенерировано favimaker. Положите все файлы в /public корня сайта. -->"];

  // SVG идёт первым: современные браузеры приоритезируют его перед ico/png
  if (flag("svg")) lines.push(`<link rel="icon" type="image/svg+xml" href="/favicon.svg">`);
  if (flag("ico")) lines.push(`<link rel="icon" href="/favicon.ico" sizes="any">`);
  if (flag("pngBrowser")) {
    lines.push(`<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">`);
    lines.push(`<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">`);
    lines.push(`<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png">`);
  }
  if (flag("apple")) lines.push(`<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">`);
  if (flag("safariPinnedTab")) {
    const color = include.safariPinnedTabColor ?? "#000000";
    lines.push(`<link rel="mask-icon" href="/safari-pinned-tab.svg" color="${color}">`);
  }
  if (flag("manifest")) lines.push(`<link rel="manifest" href="/site.webmanifest">`);
  if (flag("browserconfig")) lines.push(`<meta name="msapplication-config" content="/browserconfig.xml">`);

  return lines.join("\n") + "\n";
}
