/**
 * Конфигурация фавикона — единый источник правды для рендера, превью и экспорта.
 * Сохраняется в localStorage и сериализуется в URL для share-ссылок.
 */

export type Shape = "square" | "circle" | "rounded";

export type SourceMode = "text" | "emoji" | "icon" | "image";

export type BgMode = "solid" | "gradient" | "transparent";

export type GradientDirection =
  | "to-r"
  | "to-l"
  | "to-t"
  | "to-b"
  | "to-tr"
  | "to-tl"
  | "to-br"
  | "to-bl"
  | "radial";

export type FaviconConfig = {
  /** Источник изображения */
  source: SourceMode;
  /** Текст (если source=text). 1-4 символа обычно. */
  text: string;
  /** Эмодзи (если source=emoji). */
  emoji: string;
  /** Имя иконки из lucide-react (если source=icon), например "Heart" / "Code". */
  iconName: string;
  /** Толщина обводки lucide-иконки (1-4). */
  iconStrokeWidth: number;
  /** dataURL загруженной картинки (если source=image). */
  imageDataUrl: string | null;

  /** Шрифт — имя из Google Fonts. */
  fontFamily: string;
  fontWeight: number;
  /** Размер текста в процентах от canvas. */
  fontSizePct: number;
  /** Межбуквенный интервал в em. */
  letterSpacing: number;
  textColor: string;
  /** Цвет обводки текста, null = нет. */
  textStrokeColor: string | null;
  textStrokeWidth: number;

  /** Фон */
  bgMode: BgMode;
  bgColor: string;
  bgGradient: {
    from: string;
    to: string;
    direction: GradientDirection;
  };

  /** Форма иконки */
  shape: Shape;
  /** Радиус для shape=rounded в процентах. */
  borderRadiusPct: number;
  /** Внутренний отступ в процентах. */
  paddingPct: number;

  /** Тень */
  shadow: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetY: number;

  /** Бордер */
  borderWidth: number;
  borderColor: string;

  /** Dark-mode вариант: парная иконка для prefers-color-scheme: dark.
   *  Когда enabled, экспорт добавляет favicon-dark.svg + media-query
   *  link tags в HTML-сниппет. Цвета — переопределение базового config
   *  (текст и фон), остальные поля (shape/font/source/etc) наследуются. */
  darkVariantEnabled: boolean;
  darkTextColor: string;
  darkBgColor: string;
};

export const DEFAULT_CONFIG: FaviconConfig = {
  source: "text",
  text: "F",
  emoji: "🦝",
  iconName: "Heart",
  iconStrokeWidth: 2,
  imageDataUrl: null,

  fontFamily: "Inter",
  fontWeight: 700,
  fontSizePct: 60,
  letterSpacing: 0,
  textColor: "#ffffff",
  textStrokeColor: null,
  textStrokeWidth: 0,

  bgMode: "solid",
  bgColor: "#7c5cff",
  bgGradient: {
    from: "#7c5cff",
    to: "#ec4899",
    direction: "to-br",
  },

  shape: "rounded",
  borderRadiusPct: 22,
  paddingPct: 10,

  shadow: false,
  shadowColor: "#000000",
  shadowBlur: 8,
  shadowOffsetY: 2,

  borderWidth: 0,
  borderColor: "#000000",

  darkVariantEnabled: false,
  darkTextColor: "#ffffff",
  darkBgColor: "#0a0a0f",
};

/** Целевые размеры PNG для экспорта. */
export const EXPORT_SIZES = [16, 32, 48, 180, 192, 512] as const;
export type ExportSize = (typeof EXPORT_SIZES)[number];
