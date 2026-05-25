"use client";

import dynamic from "next/dynamic";
import { EmojiStyle, Theme, type EmojiClickData } from "emoji-picker-react";
import { useConfig } from "@/lib/store";
import { useTheme } from "@/lib/theme";
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

export function EmojiPicker() {
  const { config, set } = useConfig();
  const theme = useTheme((s) => s.theme);

  const handleClick = (data: EmojiClickData) => {
    set("emoji", data.emoji);
  };

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
          searchPlaceHolder="Поиск..."
          previewConfig={{ showPreview: false }}
        />
      </div>
    </div>
  );
}
