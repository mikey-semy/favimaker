"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Locale = "ru" | "en";

/**
 * Минималистичная i18n без сторонних библиотек: словарь key → строка
 * для каждой локали. Если ключа нет в активной локали — fallback на en.
 */
const dict = {
  // header
  "header.subtitle": { ru: "Favicon-генератор в браузере", en: "Browser-side favicon generator" },

  // sections
  "section.source": { ru: "Источник", en: "Source" },
  "section.shape": { ru: "Форма", en: "Shape" },
  "section.background": { ru: "Фон", en: "Background" },
  "section.effects": { ru: "Эффекты", en: "Effects" },
  "section.presets": { ru: "Готовые стили", en: "Presets" },
  "section.export": { ru: "Экспорт", en: "Export" },

  // source modes
  "source.text": { ru: "Текст", en: "Text" },
  "source.emoji": { ru: "Эмодзи", en: "Emoji" },
  "source.icon": { ru: "Иконка", en: "Icon" },
  "source.image": { ru: "Картинка", en: "Image" },

  // fields
  "field.fontFamily": { ru: "Шрифт", en: "Font" },
  "field.fontWeight": { ru: "Жирность", en: "Weight" },
  "field.fontSize": { ru: "Размер", en: "Size" },
  "field.textColor": { ru: "Цвет текста", en: "Text color" },
  "field.letterSpacing": { ru: "Letter-spacing", en: "Letter-spacing" },
  "field.shapeSquare": { ru: "Квадрат", en: "Square" },
  "field.shapeRounded": { ru: "Скруглённый", en: "Rounded" },
  "field.shapeCircle": { ru: "Круг", en: "Circle" },
  "field.borderRadius": { ru: "Скругление", en: "Corner radius" },
  "field.padding": { ru: "Внутренний отступ", en: "Padding" },
  "field.bgSolid": { ru: "Сплошной", en: "Solid" },
  "field.bgGradient": { ru: "Градиент", en: "Gradient" },
  "field.bgTransparent": { ru: "Прозрачный", en: "Transparent" },
  "field.gradientFrom": { ru: "От", en: "From" },
  "field.gradientTo": { ru: "До", en: "To" },
  "field.gradientDirection": { ru: "Направление", en: "Direction" },
  "field.shadow": { ru: "Тень", en: "Shadow" },
  "field.shadowColor": { ru: "Цвет тени", en: "Shadow color" },
  "field.shadowBlur": { ru: "Размытие", en: "Blur" },
  "field.shadowOffsetY": { ru: "Смещение Y", en: "Offset Y" },
  "field.textStroke": { ru: "Обводка текста", en: "Text stroke" },
  "field.strokeColor": { ru: "Цвет обводки", en: "Stroke color" },
  "field.strokeWidth": { ru: "Толщина", en: "Width" },
  "field.border": { ru: "Бордер", en: "Border" },
  "field.borderColor": { ru: "Цвет бордера", en: "Border color" },
  "field.darkVariant": {
    ru: "Парная иконка для тёмной темы",
    en: "Pair icon for dark theme",
  },
  "field.text2Placeholder": {
    ru: "Вторая строка (для монограммы) — необязательно",
    en: "Second line (for monogram) — optional",
  },
  "field.darkTextColor": { ru: "Текст (тёмная)", en: "Text (dark)" },
  "field.darkBgColor": { ru: "Фон (тёмная)", en: "Background (dark)" },

  // buttons
  "btn.reset": { ru: "Сброс", en: "Reset" },
  "btn.share": { ru: "Поделиться", en: "Share" },
  "btn.undo": { ru: "Отменить (Ctrl+Z)", en: "Undo (Ctrl+Z)" },
  "btn.redo": { ru: "Повторить (Ctrl+Shift+Z)", en: "Redo (Ctrl+Shift+Z)" },

  // keyboard shortcuts
  "shortcut.undo": { ru: "Отменить", en: "Undo" },
  "shortcut.redo": { ru: "Повторить", en: "Redo" },
  "shortcut.download": { ru: "Скачать ZIP", en: "Download ZIP" },
  "shortcut.help": { ru: "Показать это окно", en: "Show this dialog" },
  "shortcut.fontPicker": { ru: "Открыть выбор шрифта", en: "Open font picker" },
  "shortcut.helpTitle": { ru: "Клавиатурные сокращения", en: "Keyboard shortcuts" },
  "shortcut.helpFooter": {
    ru: "Хоткеи работают везде кроме инпутов и текстовых полей.",
    en: "Hotkeys work everywhere except inputs and text fields.",
  },
  "shortcut.helpClose": { ru: "Закрыть", en: "Close" },
  "btn.download": { ru: "Скачать ZIP", en: "Download ZIP" },
  "btn.preparingZip": { ru: "Готовлю архив…", en: "Building archive…" },
  "btn.loadAllFonts": {
    ru: "Загрузить все ~1500 шрифтов Google Fonts",
    en: "Load all ~1500 Google Fonts",
  },
  "btn.loadAllFontsShort": { ru: "Все шрифты", en: "All fonts" },
  "btn.loadingFonts": { ru: "Загружаю каталог…", en: "Loading catalog…" },
  "btn.loadAllIcons": {
    ru: "Показать все ~1500 иконок Lucide",
    en: "Show all ~1500 Lucide icons",
  },
  "btn.curatedIcons": { ru: "Курируемый набор (быстро)", en: "Curated set (fast)" },
  "btn.loadingIcons": { ru: "Загружаю каталог…", en: "Loading catalog…" },
  "btn.showMore": { ru: "Показать ещё", en: "Show more" },
  "msg.nothingFound": { ru: "Ничего не найдено", en: "Nothing found" },
  "msg.fontsLimit": {
    ru: "Показано {visible} из {total} — уточните поиск",
    en: "Showing {visible} of {total} — refine search",
  },

  // icon categories
  "icon.cat.popular": { ru: "Популярные", en: "Popular" },
  "icon.cat.tech": { ru: "Технологии", en: "Tech" },
  "icon.cat.communication": { ru: "Связь", en: "Communication" },
  "icon.cat.objects": { ru: "Объекты", en: "Objects" },
  "icon.cat.nature": { ru: "Природа", en: "Nature" },
  "icon.cat.symbols": { ru: "Символы", en: "Symbols" },
  "icon.cat.transport": { ru: "Транспорт", en: "Transport" },
  "icon.cat.music": { ru: "Музыка / Творчество", en: "Music / Art" },
  "icon.cat.time": { ru: "Время", en: "Time" },
  "icon.cat.geometry": { ru: "Геометрия", en: "Geometry" },
  "btn.uploadImage": { ru: "Загрузить картинку", en: "Upload image" },
  "btn.dropImage": { ru: "Бросьте файл сюда или нажмите", en: "Drop file here or click" },
  "btn.removeImage": { ru: "Убрать картинку", en: "Remove image" },
  "btn.applyPreset": { ru: "Применить", en: "Apply" },

  // export panel
  "export.appName": { ru: "Имя приложения (для manifest)", en: "App name (for manifest)" },
  "export.snippetTitle": {
    ru: "HTML-сниппет для <head>",
    en: "HTML snippet for <head>",
  },
  "export.copySnippet": { ru: "Скопировать HTML-сниппет", en: "Copy HTML snippet" },
  "export.copied": { ru: "Скопировано", en: "Copied" },
  "export.fileList": { ru: "В ZIP-архиве (14 файлов):", en: "In ZIP archive (14 files):" },
  "export.contents": { ru: "Что включить в архив", en: "What to include" },
  "export.filesCount": { ru: "{n} из {total} файлов", en: "{n} of {total} files" },
  "export.selectAll": { ru: "Все", en: "All" },
  "export.selectNone": { ru: "Ничего", en: "None" },
  "export.noneSelected": {
    ru: "Выберите хотя бы один файл",
    en: "Select at least one file",
  },
  "export.frameworkCode": {
    ru: "Код для фреймворков",
    en: "Framework code",
  },
  "export.copyNextIconHint": {
    ru: "Скопировать как app/icon.tsx (Next.js 13+ build-time favicon, 32×32)",
    en: "Copy as app/icon.tsx (Next.js 13+ build-time favicon, 32×32)",
  },
  "export.copyNextAppleIconHint": {
    ru: "Скопировать как app/apple-icon.tsx (180×180 для iOS)",
    en: "Copy as app/apple-icon.tsx (180×180 for iOS)",
  },
  "export.socialMeta": {
    ru: "Соц-карточка (OG-image)",
    en: "Social card (OG-image)",
  },
  "export.siteDescription": {
    ru: "Описание (subtitle + meta)",
    en: "Description (subtitle + meta)",
  },
  "export.siteDescriptionPlaceholder": {
    ru: "Короткое описание сайта",
    en: "Short site description",
  },
  "export.siteUrl": { ru: "URL сайта (canonical)", en: "Site URL (canonical)" },
  "export.fullMetaHead": {
    ru: "Полный <head>-блок (theme-color, application-name…)",
    en: "Full <head> block (theme-color, application-name…)",
  },
  "export.fullMetaHeadHint": {
    ru: "Добавит meta description, theme-color, application-name, apple-mobile-web-app-* в HTML-сниппет",
    en: "Adds meta description, theme-color, application-name, apple-mobile-web-app-* to the HTML snippet",
  },
  "export.copyReactComponentHint": {
    ru: "React-компонент с inline-SVG и size-prop",
    en: "React component with inline SVG and size prop",
  },
  "export.copyVueComponentHint": {
    ru: "Vue 3 SFC с inline-SVG и size-prop",
    en: "Vue 3 SFC with inline SVG and size prop",
  },
  "export.svgComponentUnavailable": {
    ru: "SVG-компонент не генерируется для источника «Картинка»",
    en: "SVG component not generated for image source",
  },
  "export.codegenFailed": {
    ru: "Не удалось сгенерировать код",
    en: "Failed to generate code",
  },
  "inc.svg": { ru: "favicon.svg (vector)", en: "favicon.svg (vector)" },
  "inc.safariPinnedTab": {
    ru: "safari-pinned-tab.svg",
    en: "safari-pinned-tab.svg",
  },
  "inc.svgUnavailable": {
    ru: "SVG не генерируется для источника «Картинка»",
    en: "SVG is not generated for image source",
  },
  "inc.ico": { ru: "favicon.ico (16+32+48)", en: "favicon.ico (16+32+48)" },
  "inc.pngBrowser": { ru: "Browser PNG (16, 32, 96)", en: "Browser PNG (16, 32, 96)" },
  "inc.apple": { ru: "Apple Touch Icon (180)", en: "Apple Touch Icon (180)" },
  "inc.appleVariants": {
    ru: "Apple Touch варианты (120, 152, 167)",
    en: "Apple Touch variants (120, 152, 167)",
  },
  "inc.socialCard": {
    ru: "Соц-карточка og-image.png (1200×630)",
    en: "Social card og-image.png (1200×630)",
  },
  "inc.iosSplash": {
    ru: "iOS PWA splash screens (~24 файла)",
    en: "iOS PWA splash screens (~24 files)",
  },
  "inc.android": { ru: "Android Chrome (192, 512)", en: "Android Chrome (192, 512)" },
  "inc.maskable": { ru: "Maskable (192, 512)", en: "Maskable (192, 512)" },
  "inc.mstile": { ru: "Windows Tile (150)", en: "Windows Tile (150)" },
  "inc.manifest": { ru: "site.webmanifest", en: "site.webmanifest" },
  "inc.browserconfig": { ru: "browserconfig.xml", en: "browserconfig.xml" },
  "inc.htmlSnippet": { ru: "HTML-сниппет", en: "HTML snippet" },
  "inc.readme": { ru: "README.txt", en: "README.txt" },

  // preview
  "preview.title": { ru: "Предпросмотр × 4", en: "Preview × 4" },
  "preview.realSizes": { ru: "Реальные размеры", en: "Real sizes" },
  "preview.inBrowser": { ru: "В браузере", en: "In browser" },
  "preview.onThemes": { ru: "На светлом и тёмном фоне", en: "On light & dark" },
  "preview.dropHere": {
    ru: "Бросьте картинку — заменит источник",
    en: "Drop an image — replaces source",
  },
  "preview.dropLoaded": { ru: "Картинка загружена", en: "Image loaded" },
  "preview.dropNotImage": {
    ru: "Это не картинка",
    en: "Not an image file",
  },

  // fonts
  "fonts.cyrillicOnly": { ru: "Только кириллица", en: "Cyrillic only" },
  "fonts.search": { ru: "Поиск...", en: "Search..." },
  "fonts.fontLabel": { ru: "Шрифт", en: "Font" },
  "fonts.loadFailed": {
    ru: "Не удалось загрузить полный каталог шрифтов — остаюсь на курируемом",
    en: "Failed to load full font catalog — staying on curated list",
  },

  // gradient directions
  "grad.br": { ru: "↘ к нижне-правому", en: "↘ bottom-right" },
  "grad.r": { ru: "→ вправо", en: "→ right" },
  "grad.b": { ru: "↓ вниз", en: "↓ down" },
  "grad.bl": { ru: "↙ к нижне-левому", en: "↙ bottom-left" },
  "grad.tr": { ru: "↗ к верхне-правому", en: "↗ top-right" },
  "grad.tl": { ru: "↖ к верхне-левому", en: "↖ top-left" },
  "grad.t": { ru: "↑ вверх", en: "↑ up" },
  "grad.l": { ru: "← влево", en: "← left" },
  "grad.radial": { ru: "⊙ радиальный", en: "⊙ radial" },

  // WCAG contrast badge
  "contrast.aaa": {
    ru: "Контраст {ratio}:1 — AAA, отличная читаемость",
    en: "Contrast {ratio}:1 — AAA, excellent readability",
  },
  "contrast.aa": {
    ru: "Контраст {ratio}:1 — AA, нормальная читаемость",
    en: "Contrast {ratio}:1 — AA, good readability",
  },
  "contrast.aaLarge": {
    ru: "Контраст {ratio}:1 — слабовато, для favicon желательно ≥4.5",
    en: "Contrast {ratio}:1 — borderline, ≥4.5 recommended for favicons",
  },
  "contrast.fail": {
    ru: "Контраст {ratio}:1 — низкий, иконка плохо читаема (нужно ≥4.5)",
    en: "Contrast {ratio}:1 — too low, icon hard to read (need ≥4.5)",
  },

  // color input
  "color.eyedropper": {
    ru: "Пипетка — взять цвет с экрана",
    en: "Eyedropper — pick a color from screen",
  },
  "color.eyedropperFailed": {
    ru: "Не удалось взять цвет",
    en: "Failed to pick color",
  },

  // PWA
  "pwa.install": {
    ru: "Установить favimaker как приложение",
    en: "Install favimaker as an app",
  },

  // Audit page
  "audit.title": { ru: "Аудит фавикона / meta", en: "Favicon / meta audit" },
  "audit.backToEditor": { ru: "← К редактору", en: "← Back to editor" },
  "audit.intro": {
    ru: "Проверьте свой сайт: какие favicon/PWA/social теги уже есть, а каких не хватает. Вставьте URL (fetch через CORS-proxy) или сразу HTML страницы.",
    en: "Check your site: which favicon/PWA/social tags are present, which are missing. Enter URL (fetched via CORS proxy) or paste page HTML directly.",
  },
  "audit.urlLabel": { ru: "URL страницы", en: "Page URL" },
  "audit.urlHint": {
    ru: "Если fetch не сработает (proxy упал / CSP) — скопируйте HTML вручную ниже.",
    en: "If fetch fails (proxy down / CSP) — paste HTML manually below.",
  },
  "audit.fetchAndAudit": { ru: "Загрузить и аудит", en: "Fetch and audit" },
  "audit.fetching": { ru: "Загружаю…", en: "Fetching…" },
  "audit.pasteLabel": { ru: "Или вставьте HTML вручную", en: "Or paste HTML manually" },
  "audit.pastePlaceholder": {
    ru: "<head>...</head> или весь HTML страницы",
    en: "<head>...</head> or full page HTML",
  },
  "audit.auditPasted": { ru: "Аудит вставленного", en: "Audit pasted HTML" },
  "audit.emptyInput": { ru: "Пустой ввод", en: "Empty input" },
  "audit.emptyUrl": { ru: "Введите URL", en: "Enter URL" },
  "audit.parseFailed": { ru: "Не удалось распарсить HTML", en: "Failed to parse HTML" },
  "audit.fetchFailed": {
    ru: "Не удалось загрузить — попробуйте вставить HTML вручную",
    en: "Fetch failed — try pasting HTML manually",
  },
  "audit.scoreLabel": { ru: "Оценка: {score} / 100", en: "Score: {score} / 100" },
  "audit.catFavicon": { ru: "Favicon", en: "Favicon" },
  "audit.catPwa": { ru: "PWA", en: "PWA" },
  "audit.catSocial": { ru: "Соц-превью", en: "Social previews" },
  "audit.catGeneral": { ru: "Общие meta", en: "General meta" },
  "audit.faviconIco": { ru: "favicon.ico (legacy)", en: "favicon.ico (legacy)" },
  "audit.faviconSvg": { ru: "favicon.svg (vector)", en: "favicon.svg (vector)" },
  "audit.faviconPng": { ru: "PNG-фавиконы (16/32/+)", en: "PNG favicons (16/32/+)" },
  "audit.appleTouchIcon": { ru: "Apple touch icon", en: "Apple touch icon" },
  "audit.maskIcon": { ru: "Safari mask-icon (pinned-tab)", en: "Safari mask-icon (pinned-tab)" },
  "audit.manifest": { ru: "Web manifest", en: "Web manifest" },
  "audit.themeColor": { ru: "theme-color", en: "theme-color" },
  "audit.appleMobileWebAppCapable": {
    ru: "apple-mobile-web-app-capable",
    en: "apple-mobile-web-app-capable",
  },
  "audit.iosSplash": { ru: "iOS splash screens", en: "iOS splash screens" },
  "audit.ogTitle": { ru: "og:title", en: "og:title" },
  "audit.ogDescription": { ru: "og:description", en: "og:description" },
  "audit.ogImage": { ru: "og:image", en: "og:image" },
  "audit.ogUrl": { ru: "og:url", en: "og:url" },
  "audit.twitterCard": { ru: "twitter:card", en: "twitter:card" },
  "audit.twitterImage": { ru: "twitter:image", en: "twitter:image" },
  "audit.htmlTitle": { ru: "<title>", en: "<title>" },
  "audit.description": { ru: "meta description", en: "meta description" },
  "audit.catManifest": { ru: "Содержимое manifest.json", en: "Manifest content" },
  "audit.manifestFetchFailed": {
    ru: "Manifest найден, но содержимое не удалось загрузить",
    en: "Manifest link found, but content fetch failed",
  },
  "audit.manifestName": { ru: "name", en: "name" },
  "audit.manifestShortName": { ru: "short_name", en: "short_name" },
  "audit.manifestStartUrl": { ru: "start_url", en: "start_url" },
  "audit.manifestDisplay": {
    ru: "display (standalone/minimal-ui/fullscreen)",
    en: "display (standalone/minimal-ui/fullscreen)",
  },
  "audit.manifestIcon192": { ru: "icon 192×192 (PNG)", en: "icon 192×192 (PNG)" },
  "audit.manifestIcon512": { ru: "icon 512×512 (PNG)", en: "icon 512×512 (PNG)" },
  "audit.manifestMaskable": {
    ru: "maskable icon (Android adaptive)",
    en: "maskable icon (Android adaptive)",
  },
  "audit.manifestThemeColor": { ru: "theme_color", en: "theme_color" },
  "audit.manifestBackgroundColor": { ru: "background_color", en: "background_color" },

  // misc
  "msg.shareCopied": { ru: "Ссылка скопирована", en: "Link copied" },
  "msg.shareFallback": {
    ru: "Не удалось скопировать ссылку",
    en: "Failed to copy link",
  },

  // history
  "section.history": { ru: "История", en: "History" },
  "history.empty": {
    ru: "Здесь появятся иконки, которые вы скачали",
    en: "Icons you download will appear here",
  },
  "history.restore": { ru: "Применить", en: "Apply" },
  "history.download": { ru: "Скачать снова", en: "Download again" },
  "history.pin": { ru: "Закрепить (не выкинется лимитом)", en: "Pin (kept past the limit)" },
  "history.unpin": { ru: "Открепить", en: "Unpin" },
  "history.renameHint": {
    ru: "Двойной клик чтобы переименовать",
    en: "Double-click to rename",
  },
  "history.export": { ru: "Экспорт", en: "Export" },
  "history.import": { ru: "Импорт", en: "Import" },
  "history.exportHint": {
    ru: "Скачать историю как JSON-файл",
    en: "Download history as JSON file",
  },
  "history.importHint": {
    ru: "Загрузить историю из JSON-файла (merge с текущей)",
    en: "Load history from JSON file (merge with current)",
  },
  "history.exportedToast": {
    ru: "История экспортирована",
    en: "History exported",
  },
  "history.importedToast": {
    ru: "Импортировано записей: {n}",
    en: "Imported {n} entries",
  },
  "history.importNothingNew": {
    ru: "Нет новых записей для импорта",
    en: "Nothing new to import",
  },
  "history.importBadJson": {
    ru: "Невалидный JSON или формат истории",
    en: "Invalid JSON or history format",
  },
  "history.delete": { ru: "Удалить", en: "Delete" },
  "history.clearAll": { ru: "Очистить", en: "Clear" },
  "history.confirmClear": {
    ru: "Нажмите ещё раз",
    en: "Click again",
  },
  "history.clearedToast": { ru: "История очищена", en: "History cleared" },
  "history.justNow": { ru: "только что", en: "just now" },
  "history.minutesAgo": { ru: "{n} мин назад", en: "{n} min ago" },
  "history.hoursAgo": { ru: "{n} ч назад", en: "{n} h ago" },
  "history.daysAgo": { ru: "{n} д назад", en: "{n} d ago" },

  // footer
  "footer.builtWith": { ru: "Open source · MIT · собрано с", en: "Open source · MIT · built with" },
  "footer.fontsBy": { ru: "Шрифты:", en: "Fonts:" },
} as const;

type DictKey = keyof typeof dict;

type LocaleStore = {
  locale: Locale;
  setLocale: (l: Locale) => void;
};

export const useLocale = create<LocaleStore>()(
  persist(
    (set) => ({
      locale: "ru",
      setLocale: (l) => set({ locale: l }),
    }),
    { name: "favimaker.locale.v1" },
  ),
);

/** Хук-помощник — возвращает функцию t(key) для текущей локали. */
export function useT() {
  const locale = useLocale((s) => s.locale);
  return (key: DictKey): string => {
    const entry = dict[key];
    return entry?.[locale] ?? entry?.en ?? key;
  };
}
