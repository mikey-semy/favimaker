"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FaviconConfig } from "./types";

export type HistoryEntry = {
  id: string;
  createdAt: number;
  appName: string;
  config: FaviconConfig;
  /** PNG dataURL миниатюры (64×64) — для визуального превью в списке. */
  thumbDataUrl: string;
  /** Закреплённая запись не вытесняется FIFO-лимитом. Не сериализуется
   *  в старых записях (undefined ≈ false). */
  pinned?: boolean;
};

const MAX_UNPINNED = 20;

/**
 * FIFO-урезка: сохраняем ВСЕ pinned + последние MAX_UNPINNED unpinned
 * (по порядку — самые свежие сверху). Порядок исходного массива сохраняется,
 * поэтому pinned остаются на своих местах по времени, а не «всплывают».
 */
function trimEntries(list: HistoryEntry[]): HistoryEntry[] {
  let unpinnedSeen = 0;
  return list.filter((e) => {
    if (e.pinned) return true;
    unpinnedSeen++;
    return unpinnedSeen <= MAX_UNPINNED;
  });
}

type HistoryStore = {
  entries: HistoryEntry[];
  /** True после того как persist-middleware прочитал localStorage.
   *  До этого `entries` всегда пуст и UI не должен флешить «empty». */
  hydrated: boolean;
  setHydrated: () => void;
  add: (entry: Omit<HistoryEntry, "id" | "createdAt">) => void;
  remove: (id: string) => void;
  togglePin: (id: string) => void;
  clear: () => void;
};

export const useHistory = create<HistoryStore>()(
  persist(
    (set) => ({
      entries: [],
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      add: (entry) =>
        set((s) => {
          // де-дуп: если предыдущая запись по конфигу и имени идентична —
          // не плодим копии (пользователь дважды нажал «скачать»)
          const last = s.entries[0];
          if (
            last &&
            last.appName === entry.appName &&
            JSON.stringify(last.config) === JSON.stringify(entry.config)
          ) {
            return s;
          }
          const next: HistoryEntry = {
            ...entry,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            createdAt: Date.now(),
            pinned: false,
          };
          return { entries: trimEntries([next, ...s.entries]) };
        }),
      remove: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
      togglePin: (id) =>
        set((s) => {
          // После unpin'а уже хранящейся записи общее число unpinned может
          // превысить MAX_UNPINNED — нужен повторный trim. Pin никогда лимит
          // не нарушает, но дешевле пройти trim единообразно в обоих случаях.
          const next = s.entries.map((e) =>
            e.id === id ? { ...e, pinned: !e.pinned } : e,
          );
          return { entries: trimEntries(next) };
        }),
      // clear оставляем как «снести всё, включая pinned» — соответствует тексту
      // кнопки «Очистить всю историю». Если юзер хочет сохранить pinned —
      // можно открепить вручную.
      clear: () => set({ entries: [] }),
    }),
    {
      name: "favimaker.history.v1",
      // Сохраняем только entries: hydrated должен начинаться с false
      // на каждой загрузке и переключаться через onRehydrateStorage.
      partialize: (s) => ({ entries: s.entries }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

/** Сгенерировать PNG-dataURL миниатюру 64×64 для записи истории. */
export async function buildThumb(config: FaviconConfig): Promise<string> {
  const { renderToCanvas } = await import("./renderer");
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  await renderToCanvas(canvas, config);
  return canvas.toDataURL("image/png");
}
