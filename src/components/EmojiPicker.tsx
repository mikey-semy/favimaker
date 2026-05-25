"use client";

import dynamic from "next/dynamic";
import {
  Categories,
  EmojiStyle,
  Theme,
  type EmojiClickData,
} from "emoji-picker-react";
import { useConfig } from "@/lib/store";
import { useTheme } from "@/lib/theme";
import { useLocale } from "@/lib/i18n";
import { TextInput } from "./inputs";

/**
 * Готовая библиотека emoji-picker-react с Twemoji-рендером.
 * Все эмодзи рендерятся через PNG-картинки Twitter — выглядят
 * одинаково в любой ОС, не зависят от системных шрифтов
 * (без □/тофу и без склеек ZWJ-последовательностей).
 *
 * Сам компонент подгружается dynamic (SSR=false) — он клиент-only.
 */
const Picker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => (
    <div className="h-72 flex items-center justify-center text-xs text-muted">Загружаю…</div>
  ),
});

const CATEGORIES_RU = [
  { category: Categories.SUGGESTED, name: "Часто используемые" },
  { category: Categories.SMILEYS_PEOPLE, name: "Смайлы и люди" },
  { category: Categories.ANIMALS_NATURE, name: "Животные и природа" },
  { category: Categories.FOOD_DRINK, name: "Еда и напитки" },
  { category: Categories.TRAVEL_PLACES, name: "Путешествия и места" },
  { category: Categories.ACTIVITIES, name: "Активности" },
  { category: Categories.OBJECTS, name: "Объекты" },
  { category: Categories.SYMBOLS, name: "Символы" },
  { category: Categories.FLAGS, name: "Флаги" },
];

const CATEGORIES_EN = [
  { category: Categories.SUGGESTED, name: "Frequently Used" },
  { category: Categories.SMILEYS_PEOPLE, name: "Smileys & People" },
  { category: Categories.ANIMALS_NATURE, name: "Animals & Nature" },
  { category: Categories.FOOD_DRINK, name: "Food & Drink" },
  { category: Categories.TRAVEL_PLACES, name: "Travel & Places" },
  { category: Categories.ACTIVITIES, name: "Activities" },
  { category: Categories.OBJECTS, name: "Objects" },
  { category: Categories.SYMBOLS, name: "Symbols" },
  { category: Categories.FLAGS, name: "Flags" },
];

export function EmojiPicker() {
  const { config, set } = useConfig();
  const theme = useTheme((s) => s.theme);
  const locale = useLocale((s) => s.locale);

  const handleClick = (data: EmojiClickData) => {
    set("emoji", data.emoji);
  };

  const categories = locale === "ru" ? CATEGORIES_RU : CATEGORIES_EN;
  const searchPlaceholder = locale === "ru" ? "Поиск..." : "Search...";

  return (
    <div className="space-y-3">
      <TextInput
        value={config.emoji}
        onChange={(e) => set("emoji", e.target.value)}
        placeholder="🦝"
        maxLength={8}
        className="text-2xl text-center"
      />

      <div className="rounded-[var(--r-md)] overflow-hidden border border-line">
        <Picker
          onEmojiClick={handleClick}
          theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
          emojiStyle={EmojiStyle.TWITTER}
          width="100%"
          height={360}
          lazyLoadEmojis
          searchPlaceHolder={searchPlaceholder}
          previewConfig={{ showPreview: false }}
          categories={categories}
        />
      </div>
    </div>
  );
}
