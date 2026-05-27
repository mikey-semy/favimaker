"use client";

/**
 * Audit head of a deployed site — что есть из иконок/meta, а чего нет.
 * Без бэкенда: парсим строку HTML через DOMParser. Источник HTML — либо
 * paste от юзера, либо fetch через public CORS-proxy (corsproxy.io).
 *
 * Намеренно НЕ автогенерим / не правим — это «диагностика», не «фикс»:
 * юзер сам решает что добавить через favimaker.
 */

export type AuditCategory = "favicon" | "pwa" | "social" | "general" | "manifest";
export type AuditStatus = "ok" | "missing" | "warn";

export type AuditCheck = {
  id: string;
  category: AuditCategory;
  status: AuditStatus;
  /** i18n-ключ для label. */
  labelKey: string;
  /** Опциональное доп. описание (URL/значение что нашли). */
  details?: string;
};

export type AuditResult = {
  checks: AuditCheck[];
  /** Найденный <title>, для отображения. */
  pageTitle: string | null;
  /** 0-100, % пройденных проверок (warn = 0.5). */
  score: number;
};

/**
 * Распарсить HTML и проверить наличие ключевых favicon/PWA/social тегов.
 * Body можно не передавать — берём только <head>.
 */
export function auditHtmlHead(html: string): AuditResult {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return { checks: [], pageTitle: null, score: 0 };
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const head = doc.head;
  if (!head) {
    return { checks: [], pageTitle: null, score: 0 };
  }

  const checks: AuditCheck[] = [];

  // ── favicon ────────────────────────────────────────────────────────────
  const iconLinks = head.querySelectorAll<HTMLLinkElement>("link[rel*='icon']");
  const hasIco = Array.from(iconLinks).some((l) => l.href.toLowerCase().endsWith(".ico"));
  const hasSvg = Array.from(iconLinks).some(
    (l) =>
      l.getAttribute("type") === "image/svg+xml" || l.href.toLowerCase().endsWith(".svg"),
  );
  const pngIcons = Array.from(iconLinks).filter(
    (l) => l.getAttribute("type") === "image/png" || l.href.toLowerCase().endsWith(".png"),
  );

  checks.push({
    id: "favicon.ico",
    category: "favicon",
    status: hasIco ? "ok" : "missing",
    labelKey: "audit.faviconIco",
  });
  checks.push({
    id: "favicon.svg",
    category: "favicon",
    status: hasSvg ? "ok" : "warn",
    labelKey: "audit.faviconSvg",
  });
  checks.push({
    id: "favicon.png",
    category: "favicon",
    status: pngIcons.length >= 2 ? "ok" : pngIcons.length > 0 ? "warn" : "missing",
    labelKey: "audit.faviconPng",
    details: pngIcons.length > 0 ? `${pngIcons.length} PNG` : undefined,
  });

  const appleTouch = head.querySelector("link[rel='apple-touch-icon']");
  checks.push({
    id: "apple-touch-icon",
    category: "favicon",
    status: appleTouch ? "ok" : "missing",
    labelKey: "audit.appleTouchIcon",
  });

  const maskIcon = head.querySelector("link[rel='mask-icon']");
  checks.push({
    id: "mask-icon",
    category: "favicon",
    status: maskIcon ? "ok" : "warn",
    labelKey: "audit.maskIcon",
  });

  // ── PWA ────────────────────────────────────────────────────────────────
  const manifest = head.querySelector("link[rel='manifest']");
  checks.push({
    id: "manifest",
    category: "pwa",
    status: manifest ? "ok" : "missing",
    labelKey: "audit.manifest",
    details: manifest?.getAttribute("href") ?? undefined,
  });

  const themeColor = head.querySelector("meta[name='theme-color']");
  checks.push({
    id: "theme-color",
    category: "pwa",
    status: themeColor ? "ok" : "warn",
    labelKey: "audit.themeColor",
    details: themeColor?.getAttribute("content") ?? undefined,
  });

  const appleCapable = head.querySelector("meta[name='apple-mobile-web-app-capable']");
  checks.push({
    id: "apple-mobile-web-app-capable",
    category: "pwa",
    status: appleCapable ? "ok" : "warn",
    labelKey: "audit.appleMobileWebAppCapable",
  });

  const splash = head.querySelector("link[rel='apple-touch-startup-image']");
  checks.push({
    id: "apple-touch-startup-image",
    category: "pwa",
    status: splash ? "ok" : "warn",
    labelKey: "audit.iosSplash",
  });

  // ── Social (OG / Twitter) ──────────────────────────────────────────────
  const ogTitle = head.querySelector("meta[property='og:title']");
  const ogDesc = head.querySelector("meta[property='og:description']");
  const ogImage = head.querySelector("meta[property='og:image']");
  const ogUrl = head.querySelector("meta[property='og:url']");
  checks.push({
    id: "og:title",
    category: "social",
    status: ogTitle ? "ok" : "missing",
    labelKey: "audit.ogTitle",
    details: ogTitle?.getAttribute("content")?.slice(0, 60),
  });
  checks.push({
    id: "og:description",
    category: "social",
    status: ogDesc ? "ok" : "warn",
    labelKey: "audit.ogDescription",
  });
  checks.push({
    id: "og:image",
    category: "social",
    status: ogImage ? "ok" : "missing",
    labelKey: "audit.ogImage",
    details: ogImage?.getAttribute("content") ?? undefined,
  });
  checks.push({
    id: "og:url",
    category: "social",
    status: ogUrl ? "ok" : "warn",
    labelKey: "audit.ogUrl",
  });

  const twCard = head.querySelector("meta[name='twitter:card']");
  const twImage = head.querySelector("meta[name='twitter:image']");
  checks.push({
    id: "twitter:card",
    category: "social",
    status: twCard ? "ok" : "warn",
    labelKey: "audit.twitterCard",
    details: twCard?.getAttribute("content") ?? undefined,
  });
  checks.push({
    id: "twitter:image",
    category: "social",
    status: twImage ? "ok" : "warn",
    labelKey: "audit.twitterImage",
  });

  // ── General ────────────────────────────────────────────────────────────
  const title = head.querySelector("title");
  const description = head.querySelector("meta[name='description']");
  checks.push({
    id: "title",
    category: "general",
    status: title?.textContent?.trim() ? "ok" : "missing",
    labelKey: "audit.htmlTitle",
    details: title?.textContent?.trim().slice(0, 60),
  });
  checks.push({
    id: "description",
    category: "general",
    status: description ? "ok" : "warn",
    labelKey: "audit.description",
    details: description?.getAttribute("content")?.slice(0, 80),
  });

  // Score: ok=1, warn=0.5, missing=0
  const total = checks.length;
  const earned = checks.reduce(
    (s, c) => s + (c.status === "ok" ? 1 : c.status === "warn" ? 0.5 : 0),
    0,
  );
  const score = total > 0 ? Math.round((earned / total) * 100) : 0;

  return {
    checks,
    pageTitle: title?.textContent?.trim() || null,
    score,
  };
}

/**
 * Fetch HTML по URL через public CORS-proxy. Fallback на paste-HTML
 * если proxy недоступен. Bytes возвращаются как text.
 */
export async function fetchHtmlViaCorsProxy(url: string): Promise<string> {
  // corsproxy.io — публичный, бесплатный, free-tier ~100 req/hour per IP.
  // Достаточно для аудита: 1 запрос на проверку.
  const proxied = `https://corsproxy.io/?url=${encodeURIComponent(url)}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(proxied, { signal: controller.signal });
    if (!res.ok) throw new Error(`Proxy returned ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── Manifest content audit ──────────────────────────────────────────────
// Если на странице нашёлся <link rel="manifest" href="...">, fetch'им сам
// manifest.json через тот же CORS-proxy и валидируем поля по PWA Lighthouse
// criteria. Возвращаем дополнительные AuditCheck'и.

type ManifestIcon = {
  src?: string;
  sizes?: string;
  type?: string;
  purpose?: string;
};

type Manifest = {
  name?: string;
  short_name?: string;
  start_url?: string;
  display?: string;
  icons?: ManifestIcon[];
  theme_color?: string;
  background_color?: string;
};

/** Извлечь href из <link rel="manifest"> + резолвнуть относительно base URL. */
export function extractManifestUrl(html: string, baseUrl?: string): string | null {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") return null;
  const doc = new DOMParser().parseFromString(html, "text/html");
  const link = doc.head?.querySelector<HTMLLinkElement>("link[rel='manifest']");
  const href = link?.getAttribute("href");
  if (!href) return null;
  if (!baseUrl) return href;
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return href;
  }
}

/** Fetch manifest.json через CORS-proxy + validate. */
export async function fetchAndAuditManifest(manifestUrl: string): Promise<AuditCheck[]> {
  const proxied = `https://corsproxy.io/?url=${encodeURIComponent(manifestUrl)}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);
  let manifest: Manifest;
  try {
    const res = await fetch(proxied, { signal: controller.signal });
    if (!res.ok) throw new Error(`Manifest fetch ${res.status}`);
    manifest = (await res.json()) as Manifest;
  } finally {
    clearTimeout(timeoutId);
  }
  return auditManifestContent(manifest);
}

/** Pure-функция: применить PWA Lighthouse-критерии к parsed manifest. */
export function auditManifestContent(manifest: Manifest): AuditCheck[] {
  const checks: AuditCheck[] = [];

  checks.push({
    id: "manifest.name",
    category: "manifest",
    status: manifest.name?.trim() ? "ok" : "missing",
    labelKey: "audit.manifestName",
    details: manifest.name?.trim(),
  });
  checks.push({
    id: "manifest.short_name",
    category: "manifest",
    status: manifest.short_name?.trim() ? "ok" : "warn",
    labelKey: "audit.manifestShortName",
  });
  checks.push({
    id: "manifest.start_url",
    category: "manifest",
    status: manifest.start_url?.trim() ? "ok" : "missing",
    labelKey: "audit.manifestStartUrl",
    details: manifest.start_url?.trim(),
  });

  const validDisplay = ["standalone", "minimal-ui", "fullscreen"];
  const hasValidDisplay = manifest.display && validDisplay.includes(manifest.display);
  checks.push({
    id: "manifest.display",
    category: "manifest",
    status: hasValidDisplay ? "ok" : manifest.display === "browser" ? "warn" : "missing",
    labelKey: "audit.manifestDisplay",
    details: manifest.display,
  });

  const icons = manifest.icons ?? [];
  // Любая icon entry где sizes включает «192x192» и type/расширение = png
  const has192 = icons.some(
    (i) =>
      (i.sizes ?? "").split(/\s+/).includes("192x192") &&
      (i.type === "image/png" || (i.src ?? "").toLowerCase().endsWith(".png")),
  );
  const has512 = icons.some(
    (i) =>
      (i.sizes ?? "").split(/\s+/).includes("512x512") &&
      (i.type === "image/png" || (i.src ?? "").toLowerCase().endsWith(".png")),
  );
  checks.push({
    id: "manifest.icon192",
    category: "manifest",
    status: has192 ? "ok" : "missing",
    labelKey: "audit.manifestIcon192",
  });
  checks.push({
    id: "manifest.icon512",
    category: "manifest",
    status: has512 ? "ok" : "missing",
    labelKey: "audit.manifestIcon512",
  });

  const hasMaskable = icons.some((i) => (i.purpose ?? "").includes("maskable"));
  checks.push({
    id: "manifest.maskable",
    category: "manifest",
    status: hasMaskable ? "ok" : "warn",
    labelKey: "audit.manifestMaskable",
  });

  checks.push({
    id: "manifest.theme_color",
    category: "manifest",
    status: manifest.theme_color ? "ok" : "warn",
    labelKey: "audit.manifestThemeColor",
    details: manifest.theme_color,
  });
  checks.push({
    id: "manifest.background_color",
    category: "manifest",
    status: manifest.background_color ? "ok" : "warn",
    labelKey: "audit.manifestBackgroundColor",
    details: manifest.background_color,
  });

  return checks;
}
