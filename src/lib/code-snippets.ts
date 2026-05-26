/**
 * Генератор кода для интеграций с фреймворками.
 *
 * Next.js 13+ умеет генерить favicon из `app/icon.tsx` (и
 * `app/apple-icon.tsx`) через `next/og`'s ImageResponse. Файл
 * исполняется на build-time → favicon встроен в сборку без необходимости
 * класть статические PNG в /public.
 *
 * Мы транслируем FaviconConfig → JSX с inline-style. Шрифты Google Fonts
 * не подгружаются — ImageResponse работает в Edge runtime без CSS, поэтому
 * для красивого результата с custom шрифтом юзеру нужно докачать ttf
 * через `next/og`'s `fonts` опцию. Базовый вариант полагается на
 * системный sans-serif (как и SVG favicon).
 */
import type { FaviconConfig } from "./types";

/** Преобразовать FaviconConfig в CSS-стили обёртки (background + shape). */
function wrapperStyle(config: FaviconConfig): string {
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
    const cssDir = direction === "radial"
      ? `circle`
      : direction.replace("to-", "to ").replace("r", "right").replace("l", "left").replace("t", "top").replace("b", "bottom");
    const grad = direction === "radial"
      ? `radial-gradient(circle, ${from}, ${to})`
      : `linear-gradient(${cssDir}, ${from}, ${to})`;
    parts.push(`background: '${grad}'`);
  }
  // transparent → background не задаём, default = none

  // shape via borderRadius
  if (config.shape === "circle") {
    parts.push(`borderRadius: '50%'`);
  } else if (config.shape === "rounded") {
    parts.push(`borderRadius: '${config.borderRadiusPct}%'`);
  }

  // border
  if (config.borderWidth > 0) {
    parts.push(`border: '${config.borderWidth}% solid ${config.borderColor}'`);
  }

  return `{ ${parts.join(", ")} }`;
}

/** Стили самого текста/иконки внутри обёртки. */
function contentStyle(config: FaviconConfig): string {
  const parts: string[] = [
    `fontSize: '${config.fontSizePct}%'`,
    `fontWeight: ${config.fontWeight}`,
    `color: '${config.textColor}'`,
    `fontFamily: '${config.fontFamily.replace(/'/g, "\\'")}, sans-serif'`,
    `letterSpacing: '${config.letterSpacing}em'`,
    `lineHeight: 1`,
    `textAlign: 'center'`,
  ];
  if (config.textStrokeWidth > 0 && config.textStrokeColor) {
    parts.push(
      `WebkitTextStroke: '${config.textStrokeWidth}% ${config.textStrokeColor}'`,
    );
  }
  if (config.shadow) {
    parts.push(
      `textShadow: '0 ${config.shadowOffsetY}% ${config.shadowBlur}% ${config.shadowColor}'`,
    );
  }
  return `{ ${parts.join(", ")} }`;
}

/** Эскейп строки для подстановки в JSX-литерал. */
function escapeJsxString(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

/** Содержимое (текст / эмодзи / имя иконки) для inner JSX. */
function contentJsx(config: FaviconConfig): string {
  if (config.source === "icon") {
    return `<span>{/* TODO: импортируйте lucide-react и подставьте: */}\n        {/* <${config.iconName} size="100%" color="${config.textColor}" strokeWidth={${config.iconStrokeWidth}} /> */}\n        ?</span>`;
  }
  if (config.source === "image") {
    return `<span>{/* TODO: для source=image используйте обычный PNG в /public */}\n        ?</span>`;
  }
  const value = config.source === "emoji" ? config.emoji : config.text;
  return `<span style={${contentStyle(config)}}>${escapeJsxString(value)}</span>`;
}

/**
 * Генерирует код `app/icon.tsx` под текущий конфиг.
 * Size фиксирован 32×32 — стандарт браузерной вкладки.
 */
export function buildNextJsIconSnippet(config: FaviconConfig, size = 32): string {
  return `import { ImageResponse } from 'next/og'

// Image metadata
export const size = { width: ${size}, height: ${size} }
export const contentType = 'image/png'

// Image generation — генерируется на build-time, кладётся в .next/static
export default function Icon() {
  return new ImageResponse(
    (
      <div style={${wrapperStyle(config)}}>
        ${contentJsx(config)}
      </div>
    ),
    { ...size },
  )
}
`;
}

/** Apple touch icon — 180×180 для iOS home-screen. */
export function buildNextJsAppleIconSnippet(config: FaviconConfig): string {
  // Same generator, just different size and filename hint
  const body = buildNextJsIconSnippet(config, 180);
  // Replace `export default function Icon` with `AppleIcon` для семантики
  return body.replace("export default function Icon()", "export default function AppleIcon()");
}
