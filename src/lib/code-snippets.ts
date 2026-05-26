/**
 * Генератор кода для интеграций с фреймворками.
 *
 * Next.js 13+ умеет генерить favicon из `app/icon.tsx` (и
 * `app/apple-icon.tsx`) через `next/og`'s ImageResponse. Файл
 * исполняется на build-time → favicon встроен в сборку без необходимости
 * класть статические PNG в /public.
 *
 * Транслируем FaviconConfig → JSX с inline-style. Все «процентные»
 * параметры из FaviconConfig (font-size, stroke, shadow, border) конвертим
 * в **px** относительно `size` — ImageResponse рендерится на фиксированном
 * canvas, а CSS `%` для большинства этих свойств невалиден (border-width,
 * text-shadow, WebkitTextStroke length units).
 *
 * Шрифты Google Fonts не подгружаются — ImageResponse Edge-runtime не
 * имеет доступа к веб-CSS. Эмитим fallback на sans-serif + TODO-коммент
 * о next/og's `fonts` опции.
 */
import type { FaviconConfig, GradientDirection } from "./types";

/** to-XX → CSS angle/direction для linear-gradient. */
const GRAD_DIR_MAP: Record<Exclude<GradientDirection, "radial">, string> = {
  "to-r": "to right",
  "to-l": "to left",
  "to-t": "to top",
  "to-b": "to bottom",
  "to-tr": "to top right",
  "to-tl": "to top left",
  "to-br": "to bottom right",
  "to-bl": "to bottom left",
};

/** Преобразовать FaviconConfig в CSS-стили обёртки (background + shape + border). */
function wrapperStyle(config: FaviconConfig, size: number): string {
  const parts: string[] = [
    `width: '100%'`,
    `height: '100%'`,
    `display: 'flex'`,
    `alignItems: 'center'`,
    `justifyContent: 'center'`,
  ];

  // background
  if (config.bgMode === "solid") {
    parts.push(`background: '${config.bgColor}'`);
  } else if (config.bgMode === "gradient") {
    const { from, to, direction } = config.bgGradient;
    const grad =
      direction === "radial"
        ? `radial-gradient(circle, ${from}, ${to})`
        : `linear-gradient(${GRAD_DIR_MAP[direction]}, ${from}, ${to})`;
    parts.push(`background: '${grad}'`);
  }
  // transparent → background не задаём (default = none)

  // shape via borderRadius
  if (config.shape === "circle") {
    parts.push(`borderRadius: '50%'`);
  } else if (config.shape === "rounded") {
    parts.push(`borderRadius: '${config.borderRadiusPct}%'`);
  }

  // border — % → px по `size`
  if (config.borderWidth > 0) {
    const borderPx = Math.max(1, Math.round((config.borderWidth / 100) * size));
    parts.push(`border: '${borderPx}px solid ${config.borderColor}'`);
  }

  return `{ ${parts.join(", ")} }`;
}

/** Стили самого текста/иконки. % → px по `size`. */
function contentStyle(config: FaviconConfig, size: number): string {
  const fontPx = Math.max(1, Math.round((config.fontSizePct / 100) * size));
  const parts: string[] = [
    `fontSize: ${fontPx}`,
    `fontWeight: ${config.fontWeight}`,
    `color: '${config.textColor}'`,
    // Google Fonts недоступны в Edge-runtime ImageResponse без явной
    // загрузки через next/og's `fonts` опцию. Дефолт на системный sans-serif.
    `fontFamily: 'sans-serif'`,
    `letterSpacing: '${config.letterSpacing}em'`,
    `lineHeight: 1`,
  ];
  if (config.textStrokeWidth > 0 && config.textStrokeColor) {
    const strokePx = Math.max(1, Math.round((config.textStrokeWidth / 100) * size));
    parts.push(`WebkitTextStroke: '${strokePx}px ${config.textStrokeColor}'`);
  }
  if (config.shadow) {
    const offY = Math.round((config.shadowOffsetY / 100) * size);
    const blurPx = Math.round((config.shadowBlur / 100) * size);
    parts.push(`textShadow: '0 ${offY}px ${blurPx}px ${config.shadowColor}'`);
  }
  return `{ ${parts.join(", ")} }`;
}

/** Эскейп строки для подстановки в JSX-литерал. */
function escapeJsxString(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

/** Содержимое (текст / эмодзи / имя иконки) для inner JSX. */
function contentJsx(config: FaviconConfig, size: number): string {
  if (config.source === "icon") {
    return `<span>{/* TODO: импортируйте lucide-react и подставьте: */}
        {/* <${config.iconName} size={${Math.round(size * 0.8)}} color="${config.textColor}" strokeWidth={${config.iconStrokeWidth}} /> */}
        ?</span>`;
  }
  if (config.source === "image") {
    return `<span>{/* TODO: для source=image используйте обычный PNG в /public */}
        ?</span>`;
  }
  const value = config.source === "emoji" ? config.emoji : config.text;
  return `<span style={${contentStyle(config, size)}}>${escapeJsxString(value)}</span>`;
}

/** Хедер-комментарий с подсказкой про шрифты. */
const FONT_TIP_RU =
  "// NOTE: Google Fonts не подгружены автоматически. Если нужен ваш\n// шрифт — передайте его через `fonts` опцию ImageResponse:\n//   import { readFile } from 'fs/promises'\n//   const fontData = await readFile('./fonts/MyFont.ttf')\n//   return new ImageResponse(<...>, { ...size, fonts: [{ name: 'MyFont', data: fontData, weight: 700 }] })\n";

/**
 * Генерирует код `app/icon.tsx` под текущий конфиг.
 * Size фиксирован 32×32 — стандарт браузерной вкладки.
 */
export function buildNextJsIconSnippet(config: FaviconConfig, size = 32): string {
  return `import { ImageResponse } from 'next/og'

// Image metadata
export const size = { width: ${size}, height: ${size} }
export const contentType = 'image/png'

${FONT_TIP_RU}
// Image generation — Next.js 13+ build-time favicon
export default function Icon() {
  return new ImageResponse(
    (
      <div style={${wrapperStyle(config, size)}}>
        ${contentJsx(config, size)}
      </div>
    ),
    { ...size },
  )
}
`;
}

/** Apple touch icon — 180×180 для iOS home-screen. */
export function buildNextJsAppleIconSnippet(config: FaviconConfig): string {
  const body = buildNextJsIconSnippet(config, 180);
  return body.replace("export default function Icon()", "export default function AppleIcon()");
}

// ── React / Vue inline-SVG components ────────────────────────────────────
//
// Берём готовый SVG из renderToSvgString (тот же что в favicon.svg) и
// заворачиваем в компонент с size-prop. Юзеру: paste в src/, импортируй
// как обычный компонент → отрисует тот же бренд-стиль в любом месте app.
//
// Для иконок (lucide-source) асинхронный путь — динамический импорт
// react-dom/server. Поэтому builders принимают уже-готовый svg-string,
// а ExportPanel сам вызывает renderToSvgString перед билдером.

/**
 * Извлекает внутренности и viewBox из SVG-строки.
 * Ожидаем формат: <svg xmlns="..." viewBox="X Y W H">...</svg>
 */
function parseSvg(svg: string): { viewBox: string; inner: string } {
  const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch?.[1] ?? "0 0 100 100";
  const inner = svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  return { viewBox, inner };
}

/** React-компонент (TSX) с inline-SVG. PascalCase name, size prop default. */
export function buildReactSvgComponent(svg: string, componentName = "FavimakerIcon"): string {
  const { viewBox, inner } = parseSvg(svg);
  return `type ${componentName}Props = {
  /** Размер в пикселях (квадратный). По умолчанию 32. */
  size?: number;
  className?: string;
};

export function ${componentName}({ size = 32, className }: ${componentName}Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="${viewBox}"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      ${inner}
    </svg>
  );
}
`;
}

/** Vue 3 SFC (script setup TS) с inline-SVG. */
export function buildVueSvgComponent(svg: string, componentName = "FavimakerIcon"): string {
  const { viewBox, inner } = parseSvg(svg);
  // Vue использует :width="size" для bind'а к prop. Иначе атрибут пишется
  // как обычная строка и size-prop не действует.
  return `<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Размер в пикселях (квадратный). По умолчанию 32. */
    size?: number;
    class?: string;
  }>(),
  { size: 32 }
);
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="${viewBox}"
    :width="size"
    :height="size"
    :class="$attrs.class"
    aria-hidden="true"
  >
    ${inner}
  </svg>
</template>

<!-- Сгенерировано favimaker. Имя файла: ${componentName}.vue -->
`;
}
