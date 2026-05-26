"use client";

import * as React from "react";
import { Redo2, Undo2 } from "lucide-react";
import { useConfigHistory } from "@/lib/config-history";
import { useT } from "@/lib/i18n";

/**
 * Кнопки undo/redo. Keyboard-хоткеи (Ctrl/Cmd+Z, +Shift) обрабатываются
 * глобально в <GlobalShortcuts /> — здесь только UI.
 */
export function UndoRedo() {
  const past = useConfigHistory((s) => s.past);
  const future = useConfigHistory((s) => s.future);
  const undo = useConfigHistory((s) => s.undo);
  const redo = useConfigHistory((s) => s.redo);
  const t = useT();

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  return (
    <div className="flex items-center gap-0.5">
      <IconButton
        onClick={undo}
        disabled={!canUndo}
        title={t("btn.undo")}
        aria={t("btn.undo")}
      >
        <Undo2 className="size-4" />
      </IconButton>
      <IconButton
        onClick={redo}
        disabled={!canRedo}
        title={t("btn.redo")}
        aria={t("btn.redo")}
      >
        <Redo2 className="size-4" />
      </IconButton>
    </div>
  );
}

function IconButton({
  onClick,
  disabled,
  title,
  aria,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  title: string;
  aria: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={aria}
      className={
        "flex items-center justify-center size-8 rounded-[var(--r-md)] transition-colors " +
        (disabled
          ? "text-muted/40 cursor-not-allowed"
          : "text-muted hover:text-ink hover:bg-surface-2 cursor-pointer")
      }
    >
      {children}
    </button>
  );
}
