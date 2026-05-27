"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { useConfig } from "@/lib/store";
import { useT } from "@/lib/i18n";
import {
  POPULAR_FONTS,
  fetchAllFonts,
  getCachedFonts,
  loadGoogleFont,
  type GoogleFont,
} from "@/lib/google-fonts";
import { toast } from "@/lib/toast";
import { onShortcut } from "@/lib/shortcuts";
import { TextInput } from "./inputs";
import { Field } from "./Field";
import { cn } from "@/lib/cn";

/**
 * Кастомный font-picker:
 * - каждая опция рендерится в своём font-family (превью прямо в списке)
 * - keyboard: ↑/↓ для перебора, Enter — выбор, Esc — закрыть, type-to-filter
 * - opt-in загрузка полного каталога (~1500 шрифтов через Fontsource API)
 * - cyrillic-фильтр
 */
export function FontPicker() {
  const { config, set } = useConfig();
  const t = useT();
  // Init из module-level cache — переживает unmount при смене вкладки Editor
  const [allFonts, setAllFonts] = React.useState<GoogleFont[] | null>(() => getCachedFonts());
  const [loadingAll, setLoadingAll] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [cyrillicOnly, setCyrillicOnly] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Загрузка выбранного шрифта в DOM (для рендера на canvas)
  React.useEffect(() => {
    const list = allFonts ?? POPULAR_FONTS;
    const font = list.find((f) => f.family === config.fontFamily);
    if (font) loadGoogleFont(config.fontFamily, font.weights);
  }, [config.fontFamily, allFonts]);

  // Закрытие по клику вне
  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const source = allFonts ?? POPULAR_FONTS;
  const filtered = React.useMemo(() => {
    let list = source;
    if (cyrillicOnly) list = list.filter((f) => f.cyrillic);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((f) => f.family.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => a.family.localeCompare(b.family));
  }, [source, search, cyrillicOnly]);

  // Подгружаем шрифты для видимых опций партиями — чтобы превью отображалось
  // в своём font-family. Слишком много одновременных запросов = лаги.
  const VISIBLE_LIMIT = 80;
  const visibleFonts = filtered.slice(0, VISIBLE_LIMIT);
  React.useEffect(() => {
    if (!open) return;
    for (const f of visibleFonts) {
      loadGoogleFont(f.family, [f.weights[0] ?? 400]);
    }
  }, [open, visibleFonts]);

  // Сброс активного индекса при изменении списка
  const onSearchChange = (v: string) => {
    setSearch(v);
    setActiveIndex(0);
  };
  const onCyrillicChange = (v: boolean) => {
    setCyrillicOnly(v);
    setActiveIndex(0);
  };

  // Автоподгрузка каталога — фоновый fetch при первом открытии (в обработчике,
  // не useEffect, чтобы не нарушать react-hooks/set-state-in-effect).
  // Курируемый список доступен сразу, через ~1-2с расширяется до ~1500.
  // Module-level кэш + shared promise дедуплицируют повторные запросы.
  const triggerLoadIfNeeded = () => {
    if (allFonts || loadingAll) return;
    setLoadingAll(true);
    fetchAllFonts()
      .then(setAllFonts)
      .catch(() => {
        // Bundled и Fontsource оба упали. Редко (bundled — same-origin
        // statics), но если — юзер должен знать почему всё ещё ~90.
        toast.error(t("fonts.loadFailed"));
      })
      .finally(() => setLoadingAll(false));
  };

  const handleToggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) triggerLoadIfNeeded();
  };

  // Ctrl/Cmd+K из GlobalShortcuts → toggle picker.
  React.useEffect(() => {
    return onShortcut("fontPicker", () => {
      handleToggleOpen();
    });
    // handleToggleOpen зависит от `open` который меняется — рекурсивно
    // переподписываемся. Это OK: onShortcut.unsubscribe дёшев.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Скролл к выбранной/активной опции при ↑↓
  React.useEffect(() => {
    if (!open || !listRef.current) return;
    const targetIdx =
      visibleFonts.findIndex((f) => f.family === config.fontFamily) >= 0
        ? visibleFonts.findIndex((f) => f.family === config.fontFamily)
        : activeIndex;
    const item = listRef.current.querySelector<HTMLElement>(`[data-idx="${targetIdx}"]`);
    item?.scrollIntoView({ block: "nearest" });
  }, [config.fontFamily, activeIndex, open, visibleFonts]);

  // Найти текущий индекс шрифта в видимом списке для арифметики ↑↓
  const currentIdx = visibleFonts.findIndex((f) => f.family === config.fontFamily);

  const applyIdx = (idx: number) => {
    const clamped = Math.max(0, Math.min(visibleFonts.length - 1, idx));
    const f = visibleFonts[clamped];
    if (f) {
      set("fontFamily", f.family);
      setActiveIndex(clamped);
    }
  };

  // Локальный обработчик для кнопки-триггера (открытие по Enter/Space/↓)
  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ")) {
      e.preventDefault();
      setOpen(true);
      triggerLoadIfNeeded();
    }
  };

  // Глобальный keydown когда dropdown открыт — стрелки/Home/End/Esc срабатывают
  // независимо от того где фокус (input/опции/где-то ещё). Это и есть «удобный
  // перебор» — нажал ↓ и шрифт сменился.
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      // Не перехватываем стандартное редактирование в search-input
      const target = e.target as HTMLElement | null;
      const isTypingInInput =
        target?.tagName === "INPUT" &&
        (target as HTMLInputElement).type === "text" &&
        e.key !== "ArrowDown" &&
        e.key !== "ArrowUp" &&
        e.key !== "Enter" &&
        e.key !== "Escape" &&
        e.key !== "Home" &&
        e.key !== "End";
      if (isTypingInInput) return;

      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        applyIdx((currentIdx >= 0 ? currentIdx : activeIndex) + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        applyIdx((currentIdx >= 0 ? currentIdx : activeIndex) - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        applyIdx(0);
      } else if (e.key === "End") {
        e.preventDefault();
        applyIdx(visibleFonts.length - 1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentIdx, activeIndex, visibleFonts]);

  return (
    <div className="space-y-2">
      <Field label={`${t("fonts.fontLabel")} (${filtered.length}${allFonts ? ` / ${allFonts.length}` : "+"})`}>
        <div ref={containerRef} className="relative">
          <button
            type="button"
            onClick={handleToggleOpen}
            onKeyDown={onTriggerKeyDown}
            className="flex w-full items-center justify-between gap-2 rounded-[var(--r-md)] bg-surface-2 border border-line px-3 py-2 text-sm text-ink outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20 cursor-pointer"
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            <span style={{ fontFamily: `"${config.fontFamily}", sans-serif` }}>
              {config.fontFamily}
            </span>
            <ChevronDown className="size-4 text-muted shrink-0" />
          </button>

          {open && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface border border-line rounded-[var(--r-md)] shadow-xl overflow-hidden">
              <div className="p-2 border-b border-line">
                <TextInput
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={t("fonts.search")}
                  autoFocus
                />
              </div>
              <div
                ref={listRef}
                role="listbox"
                tabIndex={-1}
                className="max-h-72 overflow-y-auto"
              >
                {visibleFonts.length === 0 ? (
                  <div className="p-3 text-xs text-muted text-center">{t("msg.nothingFound")}</div>
                ) : (
                  visibleFonts.map((f, idx) => {
                    const selected = f.family === config.fontFamily;
                    const active = idx === activeIndex;
                    return (
                      <button
                        key={f.family}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        data-idx={idx}
                        onClick={() => {
                          set("fontFamily", f.family);
                          setOpen(false);
                        }}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors",
                          selected
                            ? "bg-accent/15 text-ink"
                            : active
                              ? "bg-surface-2"
                              : "",
                        )}
                      >
                        <span
                          className="text-base truncate"
                          style={{ fontFamily: `"${f.family}", sans-serif` }}
                        >
                          {f.family}
                        </span>
                        {selected && <Check className="size-3.5 text-accent shrink-0" />}
                      </button>
                    );
                  })
                )}
                {filtered.length > VISIBLE_LIMIT && (
                  <div className="p-2 text-[10px] text-muted text-center border-t border-line">
                    {t("msg.fontsLimit")
                      .replace("{visible}", String(VISIBLE_LIMIT))
                      .replace("{total}", String(filtered.length))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Field>

      <div className="flex items-center justify-between gap-2 px-1">
        <label className="flex items-center gap-2 text-xs text-ink-2 cursor-pointer">
          <input
            type="checkbox"
            checked={cyrillicOnly}
            onChange={(e) => onCyrillicChange(e.target.checked)}
            className="accent-accent"
          />
          {t("fonts.cyrillicOnly")}
        </label>
        {loadingAll && (
          <span className="text-[10px] text-muted">
            {t("btn.loadingFonts")}
          </span>
        )}
      </div>
    </div>
  );
}
