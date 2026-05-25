import type { FaviconConfig } from "./types";
import { DEFAULT_CONFIG } from "./types";

/**
 * Курируемые preset-стили — кликом применяется к текущему конфигу.
 * Каждый — частичный override DEFAULT_CONFIG, чтобы пресет получился
 * целостным независимо от того с какого состояния стартовали.
 */
export type Preset = {
  id: string;
  name: { ru: string; en: string };
  /** Демо-текст для превью пресета. */
  sampleText: string;
  config: FaviconConfig;
};

const make = (override: Partial<FaviconConfig>): FaviconConfig => ({
  ...DEFAULT_CONFIG,
  ...override,
});

export const PRESETS: Preset[] = [
  {
    id: "monogram",
    name: { ru: "Монограмма", en: "Monogram" },
    sampleText: "M",
    config: make({
      source: "text",
      text: "M",
      fontFamily: "Inter",
      fontWeight: 800,
      fontSizePct: 65,
      textColor: "#ffffff",
      bgMode: "solid",
      bgColor: "#0f172a",
      shape: "rounded",
      borderRadiusPct: 25,
      paddingPct: 10,
    }),
  },
  {
    id: "neon",
    name: { ru: "Неон", en: "Neon" },
    sampleText: "N",
    config: make({
      source: "text",
      text: "N",
      fontFamily: "Orbitron",
      fontWeight: 900,
      fontSizePct: 60,
      textColor: "#00ffff",
      bgMode: "solid",
      bgColor: "#0a0a0f",
      shape: "rounded",
      borderRadiusPct: 22,
      paddingPct: 12,
      shadow: true,
      shadowColor: "#00ffff",
      shadowBlur: 12,
      shadowOffsetY: 0,
    }),
  },
  {
    id: "glassmorphism",
    name: { ru: "Glassmorphism", en: "Glassmorphism" },
    sampleText: "G",
    config: make({
      source: "text",
      text: "G",
      fontFamily: "Manrope",
      fontWeight: 700,
      fontSizePct: 55,
      textColor: "#ffffff",
      bgMode: "gradient",
      bgGradient: { from: "#a78bfa", to: "#f472b6", direction: "to-br" },
      shape: "circle",
      paddingPct: 12,
      borderWidth: 2,
      borderColor: "#ffffff",
    }),
  },
  {
    id: "retro-sunset",
    name: { ru: "Ретро закат", en: "Retro sunset" },
    sampleText: "R",
    config: make({
      source: "text",
      text: "R",
      fontFamily: "Bebas Neue",
      fontWeight: 400,
      fontSizePct: 70,
      letterSpacing: 0.02,
      textColor: "#fef3c7",
      bgMode: "gradient",
      bgGradient: { from: "#f97316", to: "#7c2d12", direction: "to-b" },
      shape: "square",
      paddingPct: 8,
    }),
  },
  {
    id: "pixel-art",
    name: { ru: "Пиксель-арт", en: "Pixel art" },
    sampleText: "P",
    config: make({
      source: "text",
      text: "P",
      fontFamily: "Press Start 2P",
      fontWeight: 400,
      fontSizePct: 50,
      textColor: "#fbbf24",
      bgMode: "solid",
      bgColor: "#1e293b",
      shape: "square",
      paddingPct: 18,
    }),
  },
  {
    id: "minimal-line",
    name: { ru: "Минимал. контур", en: "Minimal outline" },
    sampleText: "A",
    config: make({
      source: "text",
      text: "A",
      fontFamily: "Inter",
      fontWeight: 900,
      fontSizePct: 60,
      textColor: "#000000",
      bgMode: "solid",
      bgColor: "#ffffff",
      shape: "circle",
      paddingPct: 12,
      borderWidth: 3,
      borderColor: "#000000",
    }),
  },
  {
    id: "duotone",
    name: { ru: "Дуотон", en: "Duotone" },
    sampleText: "D",
    config: make({
      source: "text",
      text: "D",
      fontFamily: "Poppins",
      fontWeight: 800,
      fontSizePct: 60,
      textColor: "#fce7f3",
      bgMode: "gradient",
      bgGradient: { from: "#3b82f6", to: "#ec4899", direction: "to-tr" },
      shape: "rounded",
      borderRadiusPct: 24,
      paddingPct: 10,
    }),
  },
  {
    id: "brutalist",
    name: { ru: "Бруталист", en: "Brutalist" },
    sampleText: "B",
    config: make({
      source: "text",
      text: "B",
      fontFamily: "Anton",
      fontWeight: 400,
      fontSizePct: 75,
      textColor: "#000000",
      bgMode: "solid",
      bgColor: "#facc15",
      shape: "square",
      paddingPct: 6,
      borderWidth: 6,
      borderColor: "#000000",
    }),
  },
  {
    id: "emoji-soft",
    name: { ru: "Эмодзи", en: "Emoji" },
    sampleText: "🦝",
    config: make({
      source: "emoji",
      emoji: "🦝",
      bgMode: "gradient",
      bgGradient: { from: "#fef3c7", to: "#fde68a", direction: "to-br" },
      shape: "circle",
      paddingPct: 12,
    }),
  },
  {
    id: "tech-mono",
    name: { ru: "Tech mono", en: "Tech mono" },
    sampleText: "</>",
    config: make({
      source: "text",
      text: "</>",
      fontFamily: "JetBrains Mono",
      fontWeight: 800,
      fontSizePct: 45,
      textColor: "#22c55e",
      bgMode: "solid",
      bgColor: "#0a0a0f",
      shape: "rounded",
      borderRadiusPct: 18,
      paddingPct: 14,
    }),
  },
];
