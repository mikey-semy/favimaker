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

/** Подсказка про шрифты (короткий вариант, без custom-font кода). */
const FONT_TIP_SHORT =
  "// NOTE: ImageResponse рендерит на Edge runtime — Google Fonts не\n// подгружаются автоматически. Включите 'Подгружать custom-шрифт' в\n// favimaker'е чтобы получить полный fetch-код для текущего шрифта.\n";

/** Code-блок для inline-загрузки Google Font ttf через fetch. */
function buildFontFetchCode(
  fontFamily: string,
  fontWeight: number,
  varName: string,
): string {
  // Google Fonts API endpoint для конкретного weight'а — отдаёт CSS с
  // ссылкой на ttf/woff2 файлы. Мы фетчим CSS, оттуда regex'им url(...) →
  // фетч самого шрифта. Простой workaround т.к. /api/v1/fonts/{name}
  // нестабильный, а CSS API работает всегда.
  const cssUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, "+")}:wght@${fontWeight}&display=swap`;
  return `// Загружаем ttf шрифта ${fontFamily} weight ${fontWeight} через Google Fonts API.
// На Edge runtime fs/promises недоступен — используем fetch.
async function ${varName}(): Promise<ArrayBuffer> {
  const cssRes = await fetch(
    '${cssUrl}',
    // User-Agent чтобы Google вернул ttf а не woff2 (Edge runtime не умеет
    // распаковывать woff2 на лету в некоторых конфигах).
    { headers: { 'User-Agent': 'Mozilla/5.0' } },
  )
  const css = await cssRes.text()
  const match = css.match(/url\\((https:[^)]+)\\)\\s*format\\('truetype'\\)/) ||
                css.match(/url\\((https:[^)]+\\.ttf)\\)/)
  if (!match) throw new Error('Не удалось извлечь ttf URL из Google Fonts CSS')
  const fontRes = await fetch(match[1])
  return await fontRes.arrayBuffer()
}
`;
}

/**
 * Генерирует код `app/icon.tsx` под текущий конфиг.
 * @param size — пиксельная ширина/высота. 32 для tab favicon, 180 для apple.
 * @param withFonts — встроить fetch + fonts option для рендера с custom шрифтом.
 */
export function buildNextJsIconSnippet(
  config: FaviconConfig,
  size = 32,
  withFonts = false,
): string {
  // Custom font только для text-source (для icon/emoji не имеет смысла).
  const useFonts = withFonts && config.source === "text";
  const fontHelperName = `load${config.fontFamily.replace(/\W/g, "")}${config.fontWeight}`;

  const fontsBlock = useFonts
    ? buildFontFetchCode(config.fontFamily, config.fontWeight, fontHelperName)
    : "";
  const fontsOption = useFonts
    ? `,
      fonts: [
        {
          name: '${config.fontFamily}',
          data: await ${fontHelperName}(),
          weight: ${config.fontWeight},
          style: 'normal',
        },
      ],`
    : "";

  return `import { ImageResponse } from 'next/og'

// Image metadata
export const size = { width: ${size}, height: ${size} }
export const contentType = 'image/png'

${useFonts ? fontsBlock : FONT_TIP_SHORT}
// Image generation — Next.js 13+ build-time favicon
export default async function Icon() {
  return new ImageResponse(
    (
      <div style={${wrapperStyle(config, size)}}>
        ${contentJsx(config, size)}
      </div>
    ),
    {
      ...size${fontsOption}
    },
  )
}
`;
}

/** Apple touch icon — 180×180 для iOS home-screen. */
export function buildNextJsAppleIconSnippet(config: FaviconConfig, withFonts = false): string {
  const body = buildNextJsIconSnippet(config, 180, withFonts);
  return body.replace("export default async function Icon()", "export default async function AppleIcon()");
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

// ── Framework wrappers вокруг HTML-сниппета ─────────────────────────────
//
// Большинство фреймворков спокойно принимают plain HTML-тэги в <head>
// (Vite/SvelteKit/Astro/Nuxt — всё работает). Эта секция даёт готовые
// «куда вставить» wrappers, чтобы юзеру не гадать с конвенциями.

export type FrameworkId = "html" | "astro" | "vite" | "sveltekit" | "nuxt" | "remix";

export type FrameworkSpec = {
  id: FrameworkId;
  /** Human label для UI. */
  label: string;
  /** Файл куда вставлять (i18n-агностично, оставим en). */
  filePath: string;
  /** Обёртка вокруг готового HTML-сниппета. По умолчанию — pass-through. */
  wrap?: (htmlSnippet: string) => string;
};

function indent(text: string, spaces = 4): string {
  const pad = " ".repeat(spaces);
  return text
    .split("\n")
    .map((l) => (l.length > 0 ? pad + l : l))
    .join("\n");
}

export const FRAMEWORKS: FrameworkSpec[] = [
  {
    id: "html",
    label: "Plain HTML",
    filePath: "index.html — внутри <head>",
  },
  {
    id: "vite",
    label: "Vite",
    filePath: "index.html — внутри <head> (vanilla Vite шаблон)",
  },
  {
    id: "sveltekit",
    label: "SvelteKit",
    filePath: "src/app.html — заменить %sveltekit.head% или дописать выше",
  },
  {
    id: "astro",
    label: "Astro",
    filePath: "src/layouts/Layout.astro — внутри <head>",
    wrap: (snippet) =>
      `---
// src/layouts/Layout.astro
interface Props { title: string }
const { title } = Astro.props
---
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
${indent(snippet, 4)}
  </head>
  <body>
    <slot />
  </body>
</html>
`,
  },
  {
    id: "nuxt",
    label: "Nuxt 3",
    filePath: "app.vue → useHead(...) ИЛИ nuxt.config.ts → app.head",
    wrap: (snippet) =>
      `// app.vue — простой вариант: вставить plain HTML в <Head> компонент
<template>
  <Head>
${indent(snippet, 4)}
  </Head>
  <div>
    <NuxtPage />
  </div>
</template>

<!-- Альтернатива: useHead({ link: [...], meta: [...] }) — см. документацию
     Nuxt 3 / @vueuse/head. Plain HTML внутри <Head>-компонента — самый
     простой путь, формат-совместимо с тем что генерит favimaker. -->
`,
  },
  {
    id: "remix",
    label: "Remix",
    filePath: "app/root.tsx — экспорт links() / meta()",
    wrap: (snippet) =>
      `// app/root.tsx
// Remix предлагает декларативные экспорты links() и meta(), но они принимают
// объекты — конвертация plain HTML в их формат требует ручного разбора.
// Самый простой путь — оставить favicon-link'и в head через <Links /> +
// дополнительные раздать через <head> в Document component:

import { Links, Meta, Outlet, Scripts } from "@remix-run/react"

export default function App() {
  return (
    <html lang="ru">
      <head>
        <Meta />
        <Links />
${indent(snippet, 8)}
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  )
}
`,
  },
];

export function wrapForFramework(id: FrameworkId, htmlSnippet: string): string {
  const spec = FRAMEWORKS.find((f) => f.id === id);
  return spec?.wrap ? spec.wrap(htmlSnippet) : htmlSnippet;
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
