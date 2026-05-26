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
};

const MAX_ENTRIES = 20;

type HistoryStore = {
  entries: HistoryEntry[];
  /** True после того как persist-middleware прочитал localStorage.
   *  До этого `entries` всегда пуст и UI не должен флешить «empty». */
  hydrated: boolean;
  setHydrated: () => void;
  add: (entry: Omit<HistoryEntry, "id" | "createdAt">) => void;
  remove: (id: string) => void;
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
          };
          return { entries: [next, ...s.entries].slice(0, MAX_ENTRIES) };
        }),
      remove: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
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
