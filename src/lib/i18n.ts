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

  // buttons
  "btn.reset": { ru: "Сброс", en: "Reset" },
  "btn.share": { ru: "Поделиться", en: "Share" },
  "btn.undo": { ru: "Отменить (Ctrl+Z)", en: "Undo (Ctrl+Z)" },
  "btn.redo": { ru: "Повторить (Ctrl+Shift+Z)", en: "Redo (Ctrl+Shift+Z)" },
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

  // fonts
  "fonts.cyrillicOnly": { ru: "Только кириллица", en: "Cyrillic only" },
  "fonts.search": { ru: "Поиск...", en: "Search..." },
  "fonts.fontLabel": { ru: "Шрифт", en: "Font" },

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
