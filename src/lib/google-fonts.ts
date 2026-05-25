/**
 * Курируемый список популярных Google Fonts — без авторизации Google Fonts API.
 * Покрывает большинство кейсов для favicon: жирные геометрические/гротески,
 * пара serif, пара дисплейных. Все поддерживают latin + cyrillic.
 *
 * Каждый шрифт загружается через <link href="https://fonts.googleapis.com/...">
 * только когда выбран — не тянем все 25 шрифтов сразу.
 */
export type GoogleFont = {
  family: string;
  category: "sans-serif" | "serif" | "display" | "monospace";
  weights: number[];
  /** Поддерживает кириллицу. */
  cyrillic: boolean;
};

export const POPULAR_FONTS: GoogleFont[] = [
  // Sans-serif (геометрические)
  { family: "Inter", category: "sans-serif", weights: [400, 500, 700, 900], cyrillic: true },
  { family: "Manrope", category: "sans-serif", weights: [400, 500, 700, 800], cyrillic: true },
  { family: "Onest", category: "sans-serif", weights: [400, 500, 700, 900], cyrillic: true },
  { family: "Montserrat", category: "sans-serif", weights: [400, 700, 900], cyrillic: true },
  { family: "Poppins", category: "sans-serif", weights: [400, 700, 900], cyrillic: false },
  { family: "Roboto", category: "sans-serif", weights: [400, 700, 900], cyrillic: true },
  { family: "Open Sans", category: "sans-serif", weights: [400, 700, 800], cyrillic: true },
  { family: "Nunito", category: "sans-serif", weights: [400, 700, 900], cyrillic: true },
  { family: "Rubik", category: "sans-serif", weights: [400, 700, 900], cyrillic: true },
  { family: "Work Sans", category: "sans-serif", weights: [400, 700, 900], cyrillic: true },
  { family: "DM Sans", category: "sans-serif", weights: [400, 700], cyrillic: false },
  { family: "Space Grotesk", category: "sans-serif", weights: [400, 700], cyrillic: false },
  { family: "Unbounded", category: "display", weights: [400, 700, 900], cyrillic: true },

  // Display
  { family: "Bebas Neue", category: "display", weights: [400], cyrillic: true },
  { family: "Russo One", category: "display", weights: [400], cyrillic: true },
  { family: "Press Start 2P", category: "display", weights: [400], cyrillic: true },
  { family: "Anton", category: "display", weights: [400], cyrillic: true },
  { family: "Archivo Black", category: "display", weights: [400], cyrillic: false },

  // Serif
  { family: "Playfair Display", category: "serif", weights: [400, 700, 900], cyrillic: true },
  { family: "Lora", category: "serif", weights: [400, 700], cyrillic: true },
  { family: "Merriweather", category: "serif", weights: [400, 700, 900], cyrillic: true },

  // Monospace
  { family: "JetBrains Mono", category: "monospace", weights: [400, 700], cyrillic: true },
  { family: "Fira Code", category: "monospace", weights: [400, 700], cyrillic: true },
  { family: "IBM Plex Mono", category: "monospace", weights: [400, 700], cyrillic: true },
];

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
    // fail-safe: шрифт может не загрузиться, продолжаем с fallback
  }
}
