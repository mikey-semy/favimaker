"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Светлая тема" : "Тёмная тема"}
      title={isDark ? "Светлая тема" : "Тёмная тема"}
      className="flex items-center justify-center size-8 rounded-[var(--r-md)] text-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
      suppressHydrationWarning
    >
      <Icon className="size-4" suppressHydrationWarning />
    </button>
  );
}
