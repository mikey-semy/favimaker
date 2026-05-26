"use client";

import * as React from "react";
import { X } from "lucide-react";
import { useConfigHistory } from "@/lib/config-history";
import { emitShortcut, isInputTarget, SHORTCUTS } from "@/lib/shortcuts";
import { useT } from "@/lib/i18n";

/**
 * Единственный keydown-listener для всего приложения. Слушает все хоткеи
 * из SHORTCUTS и либо вызывает локальные actions (undo/redo через
 * useConfigHistory), либо эмитит cross-component события (download).
 * Также рендерит модал «Shortcuts» по ?.
 */
export function GlobalShortcuts() {
  const undo = useConfigHistory((s) => s.undo);
  const redo = useConfigHistory((s) => s.redo);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const t = useT();

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Esc — закрываем help-модал даже когда фокус в инпуте
      if (e.key === "Escape" && helpOpen) {
        e.preventDefault();
        setHelpOpen(false);
        return;
      }

      if (isInputTarget(e)) return;

      const cmd = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // ? — открыть help (без модификаторов, Shift+/ на US-keyboard)
      if (key === "?" || (e.shiftKey && key === "/")) {
        e.preventDefault();
        setHelpOpen((v) => !v);
        return;
      }

      if (!cmd) return;

      // Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z
      if (key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }

      // Ctrl/Cmd+S — Download (через event-bus → ExportPanel)
      if (key === "s") {
        e.preventDefault();
        emitShortcut("download");
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, helpOpen]);

  if (!helpOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={() => setHelpOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label={t("shortcut.helpTitle")}
    >
      <div
        className="bg-surface rounded-[var(--r-lg)] border border-line p-5 max-w-sm w-[90vw] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold" suppressHydrationWarning>
            {t("shortcut.helpTitle")}
          </h2>
          <button
            type="button"
            onClick={() => setHelpOpen(false)}
            className="text-muted hover:text-ink transition-colors cursor-pointer"
            aria-label={t("shortcut.helpClose")}
            title={t("shortcut.helpClose")}
          >
            <X className="size-4" />
          </button>
        </div>
        <ul className="space-y-1.5">
          {SHORTCUTS.map((sc) => (
            <li
              key={sc.action}
              className="flex items-center justify-between gap-3 text-xs"
            >
              <span className="text-ink-2" suppressHydrationWarning>
                {t(sc.labelKey)}
              </span>
              <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded-[var(--r-sm)] bg-surface-2 border border-line text-ink">
                {sc.modifiers.map((m) => (m === "cmd" ? "Ctrl/⌘" : "Shift")).join("+")}
                {sc.modifiers.length > 0 && "+"}
                {sc.key}
              </kbd>
            </li>
          ))}
        </ul>
        <p
          className="text-[10px] text-muted mt-3"
          suppressHydrationWarning
        >
          {t("shortcut.helpFooter")}
        </p>
      </div>
    </div>
  );
}
