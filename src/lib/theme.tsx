"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark";

type ThemeStore = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
};

export const useTheme = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: "dark",
      setTheme: (t) => {
        set({ theme: t });
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute("data-theme", t);
        }
      },
      toggle: () => {
        get().setTheme(get().theme === "dark" ? "light" : "dark");
      },
    }),
    { name: "favimaker.theme.v1" },
  ),
);

/**
 * Инлайн-скрипт в <head>: ставит data-theme ДО первого рендера body —
 * избегаем FOUC (мигания светлой темы при загрузке с сохранённой тёмной).
 */
export function ThemeScript() {
  const code = `
(function(){
  try {
    var stored = JSON.parse(localStorage.getItem('favimaker.theme.v1') || 'null');
    var t = (stored && stored.state && stored.state.theme) || 'dark';
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`.trim();
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
