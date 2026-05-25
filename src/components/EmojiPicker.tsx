"use client";

import * as React from "react";
import emojiData from "unicode-emoji-json";
import { useConfig } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { TextInput } from "./inputs";
import { cn } from "@/lib/cn";

type EmojiEntry = {
  emoji: string;
  name: string;
  group: string;
};

// Группируем эмодзи по категориям один раз при загрузке модуля
const ALL_EMOJIS: EmojiEntry[] = Object.entries(emojiData as Record<string, { name: string; group: string }>).map(
  ([emoji, meta]) => ({
    emoji,
    name: meta.name,
    group: meta.group,
  }),
);

const GROUPED: Map<string, EmojiEntry[]> = (() => {
  const map = new Map<string, EmojiEntry[]>();
  for (const e of ALL_EMOJIS) {
    const arr = map.get(e.group) ?? [];
    arr.push(e);
    map.set(e.group, arr);
  }
  return map;
})();

const GROUP_LABELS_RU: Record<string, string> = {
  "Smileys & Emotion": "Смайлы и эмоции",
  "People & Body": "Люди и тело",
  "Animals & Nature": "Животные и природа",
  "Food & Drink": "Еда и напитки",
  "Travel & Places": "Путешествия и места",
  Activities: "Активности",
  Objects: "Объекты",
  Symbols: "Символы",
  Flags: "Флаги",
  Component: "Компоненты",
};

export function EmojiPicker() {
  const { config, set } = useConfig();
  const t = useT();
  const [search, setSearch] = React.useState("");
  const [activeGroup, setActiveGroup] = React.useState<string>("Smileys & Emotion");

  const filtered = React.useMemo(() => {
    if (!search.trim()) return null;
    const q = search.trim().toLowerCase();
    return ALL_EMOJIS.filter(
      (e) => e.name.toLowerCase().includes(q) || e.emoji.includes(q),
    ).slice(0, 200);
  }, [search]);

  const visibleGroup = GROUPED.get(activeGroup) ?? [];

  return (
    <div className="space-y-3">
      <TextInput
        value={config.emoji}
        onChange={(e) => set("emoji", e.target.value)}
        placeholder="🦝"
        maxLength={8}
        className="text-2xl text-center"
      />

      <TextInput
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={`${t("fonts.search")} (${ALL_EMOJIS.length}+)`}
      />

      {/* Категории-таблы (показываются если нет активного поиска) */}
      {!filtered && (
        <div className="flex gap-1 overflow-x-auto -mx-1 px-1 pb-1">
          {Array.from(GROUPED.keys())
            .filter((g) => g !== "Component")
            .map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setActiveGroup(g)}
                className={cn(
                  "text-[10px] uppercase tracking-wider whitespace-nowrap px-2 py-1 rounded-full transition-colors",
                  activeGroup === g
                    ? "bg-accent text-[var(--accent-ink)]"
                    : "text-muted hover:text-ink-2",
                )}
              >
                {GROUP_LABELS_RU[g] ?? g}
              </button>
            ))}
        </div>
      )}

      <div className="max-h-72 overflow-y-auto">
        <div className="grid grid-cols-8 gap-0.5">
          {(filtered ?? visibleGroup).map((e) => (
            <button
              key={e.emoji}
              type="button"
              onClick={() => set("emoji", e.emoji)}
              title={e.name}
              className={cn(
                "flex items-center justify-center aspect-square rounded-[var(--r-sm)] text-xl transition-colors",
                "hover:bg-surface-2",
                config.emoji === e.emoji && "ring-2 ring-accent bg-surface-2",
              )}
            >
              {e.emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
