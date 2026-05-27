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
 * Кастомный font-picker с виртуализированным списком (все 1968+ шрифтов
 * скроллятся / переключаются ↓↑ без лимита). Превью каждой опции — в
 * её собственном font-family. Lazy-load шрифтов только для visible range.
 *
 * Клавиатура:
 * - ↓/↑ при открытом dropdown: листать шрифты по всему filtered массиву,
 *   шрифт применяется сразу к иконке (live-preview).
 * - ↓/↑ при закрытом dropdown (фокус на trigger): циклит шрифт без
 *   открытия — для быстрого подбора без визуального шума.
 * - Enter/Space: открыть/закрыть dropdown.
 * - Esc: закрыть.
 * - Home/End: первый/последний шрифт.
 */

// Высота одной опции — фиксированная для виртуализации. py-2 (8+8) +
// text-base (24) ≈ 40px. Закреплено через inline height на кнопке.
const ITEM_HEIGHT = 40;
// Высота скролл-области (max-h-72 = 18rem = 288px).
const VIEWPORT_HEIGHT = 288;
// Overscan — рендерим N items выше/ниже viewport для smooth-скролла.
const OVERSCAN = 6;

export function FontPicker() {
  const { config, set } = useConfig();
  const t = useT();
  const [allFonts, setAllFonts] = React.useState<GoogleFont[] | null>(() => getCachedFonts());
  const [loadingAll, setLoadingAll] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [cyrillicOnly, setCyrillicOnly] = React.useState(false);
  const [scrollTop, setScrollTop] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

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

  // Виртуализация: вычисляем диапазон видимых индексов на базе scrollTop.
  const startIdx = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
  const visibleCount = Math.ceil(VIEWPORT_HEIGHT / ITEM_HEIGHT) + OVERSCAN * 2;
  const endIdx = Math.min(filtered.length, startIdx + visibleCount);
  const visibleSlice = filtered.slice(startIdx, endIdx);

  // Lazy-load @font-face только для текущего visible-окна. Каждый шрифт
  // в превью отображается в своём font-family — без подгрузки видны
  // в системном fallback.
  React.useEffect(() => {
    if (!open) return;
    for (const f of visibleSlice) {
      loadGoogleFont(f.family, [f.weights[0] ?? 400]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, startIdx, endIdx, filtered]);

  // Сброс скролла при изменении фильтров (search / cyrillic)
  const onSearchChange = (v: string) => {
    setSearch(v);
    setScrollTop(0);
    if (listRef.current) listRef.current.scrollTop = 0;
  };
  const onCyrillicChange = (v: boolean) => {
    setCyrillicOnly(v);
    setScrollTop(0);
    if (listRef.current) listRef.current.scrollTop = 0;
  };

  // Автоподгрузка каталога при первом открытии
  const triggerLoadIfNeeded = () => {
    if (allFonts || loadingAll) return;
    setLoadingAll(true);
    fetchAllFonts()
      .then(setAllFonts)
      .catch(() => {
        toast.error(t("fonts.loadFailed"));
      })
      .finally(() => setLoadingAll(false));
  };

  const handleToggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) triggerLoadIfNeeded();
  };

  // Ctrl/Cmd+K → toggle picker
  React.useEffect(() => {
    return onShortcut("fontPicker", () => {
      handleToggleOpen();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Текущий индекс выбранного шрифта в filtered (для ↓↑)
  const currentIdx = React.useMemo(
    () => filtered.findIndex((f) => f.family === config.fontFamily),
    [filtered, config.fontFamily],
  );

  // Скролл к индексу — для ↓↑ когда выбранный шрифт уезжает из viewport
  const scrollToIdx = React.useCallback((idx: number) => {
    if (!listRef.current) return;
    const top = idx * ITEM_HEIGHT;
    const bottom = top + ITEM_HEIGHT;
    const viewTop = listRef.current.scrollTop;
    const viewBottom = viewTop + listRef.current.clientHeight;
    if (top < viewTop) listRef.current.scrollTop = top;
    else if (bottom > viewBottom) listRef.current.scrollTop = bottom - listRef.current.clientHeight;
  }, []);

  // При открытии — скроллим к выбранному шрифту, чтобы он сразу был виден
  React.useEffect(() => {
    if (!open || currentIdx < 0 || !listRef.current) return;
    const top = currentIdx * ITEM_HEIGHT;
    // Центрируем выбранный шрифт по возможности
    const target = Math.max(0, top - VIEWPORT_HEIGHT / 2 + ITEM_HEIGHT / 2);
    listRef.current.scrollTop = target;
    setScrollTop(target);
  }, [open, currentIdx]);

  const applyIdx = React.useCallback(
    (idx: number, scrollToIt = true) => {
      const clamped = Math.max(0, Math.min(filtered.length - 1, idx));
      const f = filtered[clamped];
      if (!f) return;
      set("fontFamily", f.family);
      if (scrollToIt) scrollToIdx(clamped);
    },
    [filtered, set, scrollToIdx],
  );

  // Trigger keydown: ↓/↑ при закрытом dropdown циклит шрифт без открытия.
  // Enter/Space/F4 — открыть.
  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      applyIdx((currentIdx >= 0 ? currentIdx : -1) + 1, false);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      applyIdx((currentIdx >= 0 ? currentIdx : 0) - 1, false);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
      triggerLoadIfNeeded();
    }
  };

  // Глобальный keydown когда dropdown открыт — листание по filtered
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
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
        triggerRef.current?.focus();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        applyIdx((currentIdx >= 0 ? currentIdx : -1) + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        applyIdx((currentIdx >= 0 ? currentIdx : 0) - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        applyIdx(0);
      } else if (e.key === "End") {
        e.preventDefault();
        applyIdx(filtered.length - 1);
      } else if (e.key === "PageDown") {
        e.preventDefault();
        applyIdx((currentIdx >= 0 ? currentIdx : 0) + Math.floor(VIEWPORT_HEIGHT / ITEM_HEIGHT));
      } else if (e.key === "PageUp") {
        e.preventDefault();
        applyIdx((currentIdx >= 0 ? currentIdx : 0) - Math.floor(VIEWPORT_HEIGHT / ITEM_HEIGHT));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, currentIdx, filtered, applyIdx]);

  // Высота "холста" внутри scroll-контейнера = total items * item height —
  // даёт правильный scrollbar для всего списка несмотря на виртуальный рендер.
  const totalHeight = filtered.length * ITEM_HEIGHT;

  return (
    <div className="space-y-2">
      <Field label={`${t("fonts.fontLabel")} (${filtered.length}${allFonts ? ` / ${allFonts.length}` : "+"})`}>
        <div ref={containerRef} className="relative">
          <button
            ref={triggerRef}
            type="button"
            onClick={handleToggleOpen}
            onKeyDown={onTriggerKeyDown}
            className="flex w-full items-center justify-between gap-2 rounded-[var(--r-md)] bg-surface-2 border border-line px-3 py-2 text-sm text-ink outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20 cursor-pointer"
            aria-haspopup="listbox"
            aria-expanded={open}
            title={t("fonts.triggerHint")}
          >
            <span className="truncate" style={{ fontFamily: `"${config.fontFamily}", sans-serif` }}>
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
                onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
                className="overflow-y-auto"
                style={{ maxHeight: VIEWPORT_HEIGHT }}
              >
                {filtered.length === 0 ? (
                  <div className="p-3 text-xs text-muted text-center">{t("msg.nothingFound")}</div>
                ) : (
                  <div style={{ height: totalHeight, position: "relative" }}>
                    {visibleSlice.map((f, i) => {
                      const idx = startIdx + i;
                      const selected = f.family === config.fontFamily;
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
                            triggerRef.current?.focus();
                          }}
                          style={{
                            position: "absolute",
                            top: idx * ITEM_HEIGHT,
                            left: 0,
                            right: 0,
                            height: ITEM_HEIGHT,
                          }}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 px-3 text-left transition-colors hover:bg-surface-2",
                            selected && "bg-accent/15 text-ink",
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
                    })}
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
