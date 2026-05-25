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

  // misc
  "msg.shareCopied": { ru: "Ссылка скопирована", en: "Link copied" },
  "msg.shareFallback": {
    ru: "Не удалось скопировать ссылку",
    en: "Failed to copy link",
  },

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
