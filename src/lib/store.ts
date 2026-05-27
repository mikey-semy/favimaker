"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_CONFIG, type FaviconConfig } from "./types";

type ConfigStore = {
  config: FaviconConfig;
  set: <K extends keyof FaviconConfig>(key: K, value: FaviconConfig[K]) => void;
  setGradient: <K extends keyof FaviconConfig["bgGradient"]>(
    key: K,
    value: FaviconConfig["bgGradient"][K],
  ) => void;
  reset: () => void;
  replace: (next: FaviconConfig) => void;
};

export const useConfig = create<ConfigStore>()(
  persist(
    (set) => ({
      config: DEFAULT_CONFIG,
      set: (key, value) =>
        set((s) => ({ config: { ...s.config, [key]: value } })),
      setGradient: (key, value) =>
        set((s) => ({
          config: { ...s.config, bgGradient: { ...s.config.bgGradient, [key]: value } },
        })),
      reset: () => set({ config: DEFAULT_CONFIG }),
      replace: (next) => set({ config: next }),
    }),
    {
      name: "favimaker.config.v1",
      // Защита от регрессий: всегда мержим DEFAULT_CONFIG поверх persisted —
      // любой новый ключ (как darkVariantEnabled в VOID-14) автоматически
      // появится у старых юзеров со значением по умолчанию.
      merge: (persisted, current) => {
        const p = persisted as { config?: Partial<FaviconConfig> } | undefined;
        return {
          ...current,
          config: { ...DEFAULT_CONFIG, ...(p?.config ?? {}) },
        };
      },
    },
  ),
);
