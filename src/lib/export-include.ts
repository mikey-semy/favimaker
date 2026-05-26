"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_INCLUDE, type ExportInclude } from "./export";

type IncludeStore = {
  include: ExportInclude;
  set: <K extends keyof ExportInclude>(key: K, value: boolean) => void;
  reset: () => void;
  selectAll: () => void;
  selectNone: () => void;
};

export const useExportInclude = create<IncludeStore>()(
  persist(
    (set) => ({
      include: DEFAULT_INCLUDE,
      set: (key, value) => set((s) => ({ include: { ...s.include, [key]: value } })),
      reset: () => set({ include: DEFAULT_INCLUDE }),
      selectAll: () =>
        set({
          include: Object.fromEntries(
            Object.keys(DEFAULT_INCLUDE).map((k) => [k, true]),
          ) as ExportInclude,
        }),
      selectNone: () =>
        set({
          include: Object.fromEntries(
            Object.keys(DEFAULT_INCLUDE).map((k) => [k, false]),
          ) as ExportInclude,
        }),
    }),
    {
      name: "favimaker.export-include.v1",
      version: 3,
      // Защита от регрессий: всегда мержим DEFAULT_INCLUDE поверх сохранённого.
      // Это значит каждый новый ключ автоматически появится со значением true
      // у старых юзеров — независимо от того до какой версии они доехали.
      // Bump version нужен только чтобы persist понимал что schema поменялась.
      // v1 → v2: добавлен `svg`. v2 → v3: добавлен `safariPinnedTab`.
      migrate: (persisted: unknown) => {
        const state = persisted as { include?: Partial<ExportInclude> } | undefined;
        if (!state?.include) return { include: DEFAULT_INCLUDE };
        return { include: { ...DEFAULT_INCLUDE, ...state.include } };
      },
    },
  ),
);
