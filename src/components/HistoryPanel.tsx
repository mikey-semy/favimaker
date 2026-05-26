"use client";

import * as React from "react";
import { Download, Pin, PinOff, RotateCcw, Trash2 } from "lucide-react";
import { useConfig } from "@/lib/store";
import { useHistory, type HistoryEntry } from "@/lib/history";
import { buildFaviconZip, downloadBlob } from "@/lib/export";
import { useExportInclude } from "@/lib/export-include";
import { useLocale, useT } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { Button } from "./inputs";

export function HistoryPanel() {
  const entries = useHistory((s) => s.entries);
  const hydrated = useHistory((s) => s.hydrated);
  const remove = useHistory((s) => s.remove);
  const togglePin = useHistory((s) => s.togglePin);
  const clear = useHistory((s) => s.clear);
  const replace = useConfig((s) => s.replace);
  const include = useExportInclude((s) => s.include);
  const locale = useLocale((s) => s.locale);
  const t = useT();
  // Two-step подтверждение: первый клик переводит кнопку в «armed»-состояние,
  // второй — подтверждает. Авто-сброс через 3с если юзер передумал. Это
  // заменяет нативный confirm — он блокирует UI и выглядит чужеродно.
  const [confirmArmed, setConfirmArmed] = React.useState(false);
  const armTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRestore = (entry: HistoryEntry) => {
    replace(entry.config);
  };

  const handleRedownload = async (entry: HistoryEntry) => {
    const blob = await buildFaviconZip(entry.config, entry.appName, locale, include);
    downloadBlob(blob, `favicon-${(entry.appName || "site").toLowerCase()}.zip`);
  };

  const handleClear = () => {
    if (!confirmArmed) {
      setConfirmArmed(true);
      if (armTimerRef.current) clearTimeout(armTimerRef.current);
      armTimerRef.current = setTimeout(() => setConfirmArmed(false), 3000);
      return;
    }
    if (armTimerRef.current) clearTimeout(armTimerRef.current);
    setConfirmArmed(false);
    clear();
    toast.success(t("history.clearedToast"));
  };

  React.useEffect(() => {
    return () => {
      if (armTimerRef.current) clearTimeout(armTimerRef.current);
    };
  }, []);

  if (!hydrated) {
    return (
      <div className="text-[11px] text-muted" suppressHydrationWarning>
        …
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="text-[11px] text-muted leading-relaxed" suppressHydrationWarning>
        {t("history.empty")}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1 -mr-1">
        {entries.map((entry) => (
          <HistoryRow
            key={entry.id}
            entry={entry}
            onRestore={() => handleRestore(entry)}
            onDownload={() => handleRedownload(entry)}
            onTogglePin={() => togglePin(entry.id)}
            onDelete={() => remove(entry.id)}
          />
        ))}
      </ul>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleClear}
        className={
          "w-full " +
          (confirmArmed ? "text-red-500 hover:text-red-500 hover:bg-red-500/10" : "")
        }
      >
        <Trash2 className="size-3.5" />
        <span suppressHydrationWarning>
          {confirmArmed ? t("history.confirmClear") : t("history.clearAll")}
        </span>
      </Button>
    </div>
  );
}

function HistoryRow({
  entry,
  onRestore,
  onDownload,
  onTogglePin,
  onDelete,
}: {
  entry: HistoryEntry;
  onRestore: () => void;
  onDownload: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  return (
    <li
      className={
        "group flex items-center gap-2 rounded-[var(--r-md)] border bg-surface-2 p-1.5 transition-colors " +
        (entry.pinned
          ? "border-accent/40 hover:border-accent/60"
          : "border-line hover:border-accent/40")
      }
    >
      {/* Миниатюра — клик восстанавливает конфиг */}
      <button
        type="button"
        onClick={onRestore}
        title={t("history.restore")}
        className="shrink-0 size-10 rounded-[var(--r-sm)] overflow-hidden ring-1 ring-line hover:ring-2 hover:ring-accent transition-all cursor-pointer"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={entry.thumbDataUrl}
          alt={entry.appName}
          width={40}
          height={40}
          className="block size-full object-cover"
        />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 text-xs font-medium text-ink truncate">
          {entry.pinned && (
            <Pin className="size-3 shrink-0 text-accent fill-accent" aria-hidden />
          )}
          <span className="truncate">{entry.appName}</span>
        </div>
        <div className="text-[10px] text-muted font-mono tabular-nums" suppressHydrationWarning>
          {formatRelative(entry.createdAt, locale, t)}
        </div>
      </div>

      <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
        <IconButton
          onClick={onTogglePin}
          title={entry.pinned ? t("history.unpin") : t("history.pin")}
          active={entry.pinned}
        >
          {entry.pinned ? (
            <PinOff className="size-3.5" />
          ) : (
            <Pin className="size-3.5" />
          )}
        </IconButton>
        <IconButton onClick={onRestore} title={t("history.restore")}>
          <RotateCcw className="size-3.5" />
        </IconButton>
        <IconButton onClick={onDownload} title={t("history.download")}>
          <Download className="size-3.5" />
        </IconButton>
        <IconButton onClick={onDelete} title={t("history.delete")} danger>
          <Trash2 className="size-3.5" />
        </IconButton>
      </div>
    </li>
  );
}

function IconButton({
  onClick,
  title,
  danger,
  active,
  children,
}: {
  onClick: () => void;
  title: string;
  danger?: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={
        "flex items-center justify-center size-6 rounded-[var(--r-sm)] transition-colors cursor-pointer " +
        (active
          ? "text-accent hover:bg-line/60"
          : danger
            ? "text-ink-2 hover:text-red-500 hover:bg-red-500/10"
            : "text-ink-2 hover:text-ink hover:bg-line/60")
      }
    >
      {children}
    </button>
  );
}

function formatRelative(
  ts: number,
  locale: "ru" | "en",
  t: (k: "history.justNow" | "history.minutesAgo" | "history.hoursAgo" | "history.daysAgo") => string,
): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return t("history.justNow");
  if (min < 60) return t("history.minutesAgo").replace("{n}", String(min));
  const h = Math.floor(min / 60);
  if (h < 24) return t("history.hoursAgo").replace("{n}", String(h));
  const d = Math.floor(h / 24);
  if (d < 7) return t("history.daysAgo").replace("{n}", String(d));
  return new Date(ts).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "short",
  });
}
