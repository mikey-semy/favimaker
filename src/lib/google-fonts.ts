/**
 * Источники шрифтов: курируемый список (всегда доступен) + динамическая
 * загрузка полного каталога Google Fonts через публичный Fontsource API
 * (~1500 шрифтов). Кэш на 24ч в localStorage.
 *
 * Сами шрифты подгружаются через Google Fonts CSS API (<link rel="stylesheet">),
 * никаких ключей не требуется. Fontsource API нужен только для МЕТАДАННЫХ.
 */
export type GoogleFont = {
  family: string;
  category: "sans-serif" | "serif" | "display" | "monospace" | "handwriting";
  weights: number[];
  /** Поддерживает кириллицу. */
  cyrillic: boolean;
};

/** Курируемый список — топ-100 популярных. Всегда доступен без сетевого запроса. */
export const POPULAR_FONTS: GoogleFont[] = [
  // === Sans-serif ===
  { family: "Inter", category: "sans-serif", weights: [400, 500, 600, 700, 800, 900], cyrillic: true },
  { family: "Roboto", category: "sans-serif", weights: [400, 500, 700, 900], cyrillic: true },
  { family: "Open Sans", category: "sans-serif", weights: [400, 600, 700, 800], cyrillic: true },
  { family: "Lato", category: "sans-serif", weights: [400, 700, 900], cyrillic: false },
  { family: "Montserrat", category: "sans-serif", weights: [400, 600, 700, 800, 900], cyrillic: true },
  { family: "Poppins", category: "sans-serif", weights: [400, 600, 700, 800, 900], cyrillic: false },
  { family: "Source Sans 3", category: "sans-serif", weights: [400, 600, 700, 900], cyrillic: true },
  { family: "Raleway", category: "sans-serif", weights: [400, 700, 900], cyrillic: true },
  { family: "Nunito", category: "sans-serif", weights: [400, 600, 700, 800, 900], cyrillic: true },
  { family: "Ubuntu", category: "sans-serif", weights: [400, 500, 700], cyrillic: true },
  { family: "Rubik", category: "sans-serif", weights: [400, 600, 700, 800, 900], cyrillic: true },
  { family: "Work Sans", category: "sans-serif", weights: [400, 600, 700, 900], cyrillic: true },
  { family: "Manrope", category: "sans-serif", weights: [400, 600, 700, 800], cyrillic: true },
  { family: "Onest", category: "sans-serif", weights: [400, 500, 700, 900], cyrillic: true },
  { family: "DM Sans", category: "sans-serif", weights: [400, 500, 700], cyrillic: false },
  { family: "Space Grotesk", category: "sans-serif", weights: [400, 500, 700], cyrillic: false },
  { family: "Karla", category: "sans-serif", weights: [400, 600, 700, 800], cyrillic: true },
  { family: "Fira Sans", category: "sans-serif", weights: [400, 500, 700, 900], cyrillic: true },
  { family: "Mulish", category: "sans-serif", weights: [400, 600, 700, 800, 900], cyrillic: true },
  { family: "Barlow", category: "sans-serif", weights: [400, 600, 700, 800, 900], cyrillic: false },
  { family: "PT Sans", category: "sans-serif", weights: [400, 700], cyrillic: true },
  { family: "Cabin", category: "sans-serif", weights: [400, 500, 700], cyrillic: true },
  { family: "Quicksand", category: "sans-serif", weights: [400, 500, 600, 700], cyrillic: true },
  { family: "Hind", category: "sans-serif", weights: [400, 500, 600, 700], cyrillic: false },
  { family: "Heebo", category: "sans-serif", weights: [400, 700, 800, 900], cyrillic: false },
  { family: "Oxygen", category: "sans-serif", weights: [400, 700], cyrillic: true },
  { family: "Mukta", category: "sans-serif", weights: [400, 600, 700, 800], cyrillic: false },
  { family: "Asap", category: "sans-serif", weights: [400, 600, 700], cyrillic: false },
  { family: "Exo 2", category: "sans-serif", weights: [400, 600, 700, 800, 900], cyrillic: true },
  { family: "Catamaran", category: "sans-serif", weights: [400, 700, 800, 900], cyrillic: false },

  // === Display ===
  { family: "Bebas Neue", category: "display", weights: [400], cyrillic: true },
  { family: "Anton", category: "display", weights: [400], cyrillic: true },
  { family: "Russo One", category: "display", weights: [400], cyrillic: true },
  { family: "Archivo Black", category: "display", weights: [400], cyrillic: false },
  { family: "Unbounded", category: "display", weights: [400, 700, 800, 900], cyrillic: true },
  { family: "Oswald", category: "display", weights: [400, 600, 700], cyrillic: true },
  { family: "Righteous", category: "display", weights: [400], cyrillic: false },
  { family: "Press Start 2P", category: "display", weights: [400], cyrillic: true },
  { family: "Lobster", category: "display", weights: [400], cyrillic: true },
  { family: "Pacifico", category: "display", weights: [400], cyrillic: true },
  { family: "Permanent Marker", category: "display", weights: [400], cyrillic: false },
  { family: "Bungee", category: "display", weights: [400], cyrillic: false },
  { family: "Fjalla One", category: "display", weights: [400], cyrillic: true },
  { family: "Alfa Slab One", category: "display", weights: [400], cyrillic: false },
  { family: "Black Ops One", category: "display", weights: [400], cyrillic: false },
  { family: "Audiowide", category: "display", weights: [400], cyrillic: true },
  { family: "Orbitron", category: "display", weights: [400, 600, 700, 800, 900], cyrillic: false },
  { family: "Bowlby One", category: "display", weights: [400], cyrillic: false },
  { family: "Chango", category: "display", weights: [400], cyrillic: false },
  { family: "Black Han Sans", category: "display", weights: [400], cyrillic: false },
  { family: "Titan One", category: "display", weights: [400], cyrillic: false },
  { family: "Bowlby One SC", category: "display", weights: [400], cyrillic: false },

  // === Serif ===
  { family: "Playfair Display", category: "serif", weights: [400, 600, 700, 800, 900], cyrillic: true },
  { family: "Merriweather", category: "serif", weights: [400, 700, 900], cyrillic: true },
  { family: "PT Serif", category: "serif", weights: [400, 700], cyrillic: true },
  { family: "Lora", category: "serif", weights: [400, 600, 700], cyrillic: true },
  { family: "Roboto Slab", category: "serif", weights: [400, 600, 700, 900], cyrillic: true },
  { family: "Slabo 27px", category: "serif", weights: [400], cyrillic: false },
  { family: "Crimson Text", category: "serif", weights: [400, 600, 700], cyrillic: false },
  { family: "EB Garamond", category: "serif", weights: [400, 600, 700, 800], cyrillic: true },
  { family: "Cormorant Garamond", category: "serif", weights: [400, 600, 700], cyrillic: true },
  { family: "Libre Baskerville", category: "serif", weights: [400, 700], cyrillic: false },
  { family: "Bitter", category: "serif", weights: [400, 600, 700, 900], cyrillic: true },
  { family: "Bree Serif", category: "serif", weights: [400], cyrillic: false },
  { family: "Arvo", category: "serif", weights: [400, 700], cyrillic: false },
  { family: "Domine", category: "serif", weights: [400, 600, 700], cyrillic: false },
  { family: "Old Standard TT", category: "serif", weights: [400, 700], cyrillic: true },
  { family: "Cardo", category: "serif", weights: [400, 700], cyrillic: false },
  { family: "Source Serif 4", category: "serif", weights: [400, 600, 700, 900], cyrillic: true },
  { family: "Noto Serif", category: "serif", weights: [400, 700], cyrillic: true },

  // === Monospace ===
  { family: "JetBrains Mono", category: "monospace", weights: [400, 500, 700, 800], cyrillic: true },
  { family: "Fira Code", category: "monospace", weights: [400, 500, 600, 700], cyrillic: true },
  { family: "Source Code Pro", category: "monospace", weights: [400, 600, 700, 900], cyrillic: true },
  { family: "Roboto Mono", category: "monospace", weights: [400, 500, 700], cyrillic: true },
  { family: "IBM Plex Mono", category: "monospace", weights: [400, 600, 700], cyrillic: true },
  { family: "Inconsolata", category: "monospace", weights: [400, 700, 900], cyrillic: true },
  { family: "Space Mono", category: "monospace", weights: [400, 700], cyrillic: false },
  { family: "Ubuntu Mono", category: "monospace", weights: [400, 700], cyrillic: true },
  { family: "Cousine", category: "monospace", weights: [400, 700], cyrillic: true },
  { family: "Anonymous Pro", category: "monospace", weights: [400, 700], cyrillic: true },

  // === Handwriting / Script ===
  { family: "Caveat", category: "handwriting", weights: [400, 600, 700], cyrillic: true },
  { family: "Shadows Into Light", category: "handwriting", weights: [400], cyrillic: false },
  { family: "Indie Flower", category: "handwriting", weights: [400], cyrillic: false },
  { family: "Dancing Script", category: "handwriting", weights: [400, 600, 700], cyrillic: true },
  { family: "Sacramento", category: "handwriting", weights: [400], cyrillic: false },
  { family: "Great Vibes", category: "handwriting", weights: [400], cyrillic: false },
  { family: "Satisfy", category: "handwriting", weights: [400], cyrillic: false },
  { family: "Kalam", category: "handwriting", weights: [400, 700], cyrillic: false },
  { family: "Amatic SC", category: "handwriting", weights: [400, 700], cyrillic: false },
  { family: "Architects Daughter", category: "handwriting", weights: [400], cyrillic: false },
];

/** Кэш полного списка Google Fonts (фетчится с Fontsource API). */
const CACHE_KEY = "favimaker.fonts.cache.v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 часа

type CacheEntry = {
  timestamp: number;
  fonts: GoogleFont[];
};

// Module-level memory cache — переживает unmount/remount компонента
// (юзер переключился между табами Editor и вернулся — данные не теряются).
let memoryCache: GoogleFont[] | null = null;
// Shared promise чтобы одновременные вызовы не делали параллельных fetch.
let inFlight: Promise<GoogleFont[]> | null = null;

/** Синхронный доступ к кэшу (для useState initial value). */
export function getCachedFonts(): GoogleFont[] | null {
  if (memoryCache) return memoryCache;
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const entry = JSON.parse(cached) as CacheEntry;
      if (Date.now() - entry.timestamp < CACHE_TTL_MS) {
        memoryCache = entry.fonts;
        return entry.fonts;
      }
    }
  } catch {
    // невалидный кэш
  }
  return null;
}

/**
 * Загрузить полный каталог Google Fonts (~1968 шт.).
 *
 * **Primary source**: `public/google-fonts.json` (same-origin, ~180КБ raw /
 *   ~30КБ gzip). Захоститен с приложением — никогда не CORS, не блокируется
 *   корпоративными firewall'ами / AdBlock'ами / CSP.
 * **Fallback**: api.fontsource.org. Срабатывает только если same-origin
 *   почему-то 404 (например, забыли задеплоить public/) — на проде не должно.
 *
 * Дедупликация одновременных вызовов через shared promise.
 */
export async function fetchAllFonts(): Promise<GoogleFont[]> {
  const cached = getCachedFonts();
  if (cached) return cached;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const fonts = await fetchFromBundled().catch(() => fetchFromFontsource());
      memoryCache = fonts;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ timestamp: Date.now(), fonts } satisfies CacheEntry),
          );
        } catch {
          // localStorage может быть полным — игнорируем
        }
      }
      return fonts;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

/** Same-origin: загружаем bundled-каталог. JSON уже в нашей shape — без map. */
async function fetchFromBundled(): Promise<GoogleFont[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch("/google-fonts.json", { signal: controller.signal });
    if (!res.ok) throw new Error(`bundled catalog: ${res.status}`);
    return (await res.json()) as GoogleFont[];
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Внешний API — fallback если bundled недоступен. */
async function fetchFromFontsource(): Promise<GoogleFont[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch("https://api.fontsource.org/v1/fonts?type=google", {
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Fontsource API: ${res.status}`);
    const raw = (await res.json()) as Array<{
      family: string;
      category: string;
      weights: number[];
      subsets: string[];
    }>;
    return raw.map((f) => ({
      family: f.family,
      category: (["sans-serif", "serif", "display", "monospace", "handwriting"].includes(
        f.category,
      )
        ? f.category
        : "sans-serif") as GoogleFont["category"],
      weights: f.weights.length > 0 ? f.weights : [400],
      cyrillic: f.subsets.includes("cyrillic"),
    }));
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Динамически добавить <link> на Google Fonts CSS для выбранного шрифта. */
const loaded = new Set<string>();

export function loadGoogleFont(family: string, weights: number[]): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  const key = `${family}:${weights.join(",")}`;
  if (loaded.has(key)) return Promise.resolve();
  loaded.add(key);

  const familyParam = family.replace(/ /g, "+");
  const weightsParam = weights.join(";");
  const href = `https://fonts.googleapis.com/css2?family=${familyParam}:wght@${weightsParam}&display=swap`;

  return new Promise((resolve) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });
}

/** Дождаться загрузки шрифта через FontFace API (нужно перед canvas-рендером). */
export async function waitForFont(family: string, weight: number, sample = "Aa"): Promise<void> {
  if (typeof document === "undefined") return;
  if (!("fonts" in document)) return;
  try {
    await document.fonts.load(`${weight} 16px "${family}"`, sample);
  } catch {
    // fail-safe
  }
}
