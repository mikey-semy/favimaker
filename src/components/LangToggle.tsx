"use client";

import { Languages } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export function LangToggle() {
  const { locale, setLocale } = useLocale();
  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "ru" ? "en" : "ru")}
      className="flex items-center gap-1.5 px-2 h-8 rounded-[var(--r-md)] text-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer text-xs font-semibold uppercase tracking-wider"
      aria-label={locale === "ru" ? "Switch to English" : "Переключить на русский"}
      title={locale === "ru" ? "EN" : "RU"}
      suppressHydrationWarning
    >
      <Languages className="size-3.5" />
      <span suppressHydrationWarning>{locale}</span>
    </button>
  );
}
