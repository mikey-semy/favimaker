"use client";

import * as React from "react";
import { Download, RotateCcw, Trash2 } from "lucide-react";
import { useConfig } from "@/lib/store";
import { useHistory, type HistoryEntry } from "@/lib/history";
import { buildFaviconZip, downloadBlob } from "@/lib/export";
import { useLocale, useT } from "@/lib/i18n";
import { Button } from "./inputs";

export function HistoryPanel() {
  const entries = useHistory((s) => s.entries);
  const hydrated = useHistory((s) => s.hydrated);
  const remove = useHistory((s) => s.remove);
  const clear = useHistory((s) => s.clear);
  const replace = useConfig((s) => s.replace);
  const locale = useLocale((s) => s.locale);
  const t = useT();

  const handleRestore = (entry: HistoryEntry) => {
    replace(entry.config);
  };

  const handleRedownload = async (entry: HistoryEntry) => {
    const blob = await buildFaviconZip(entry.config, entry.appName, locale);
    downloadBlob(blob, `favicon-${(entry.appName || "site").toLowerCase()}.zip`);
  };

  const handleClear = () => {
    if (window.confirm(t("history.confirmClear"))) {
      clear();
    }
  };

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
            onDelete={() => remove(entry.id)}
          />
        ))}
      </ul>

      <Button variant="ghost" size="sm" onClick={handleClear} className="w-full">
        <Trash2 className="size-3.5" />
        <span suppressHydrationWarning>{t("history.clearAll")}</span>
      </Button>
    </div>
  );
}

function HistoryRow({
  entry,
  onRestore,
  onDownload,
  onDelete,
}: {
  entry: HistoryEntry;
  onRestore: () => void;
  onDownload: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  return (
    <li className="group flex items-center gap-2 rounded-[var(--r-md)] border border-line bg-surface-2 p-1.5 hover:border-accent/40 transition-colors">
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
        <div className="text-xs font-medium text-ink truncate">{entry.appName}</div>
        <div className="text-[10px] text-muted font-mono tabular-nums" suppressHydrationWarning>
          {formatRelative(entry.createdAt, locale, t)}
        </div>
      </div>

      <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
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
  children,
}: {
  onClick: () => void;
  title: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={
        "flex items-center justify-center size-6 rounded-[var(--r-sm)] text-ink-2 transition-colors cursor-pointer " +
        (danger ? "hover:text-red-500 hover:bg-red-500/10" : "hover:text-ink hover:bg-line/60")
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
