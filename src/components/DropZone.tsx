"use client";

import * as React from "react";
import { ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useConfig } from "@/lib/store";
import { useT } from "@/lib/i18n";

/**
 * Drag-n-drop загрузка картинки. Использует нативные HTML5 DnD-эвенты —
 * @dnd-kit заточен под sortable-списки UI, для файлов не нужен.
 * Поддерживает: PNG, JPEG, SVG, WebP. Файл → dataURL → store.imageDataUrl.
 */
export function DropZone() {
  const { config, set } = useConfig();
  const t = useT();
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        set("imageDataUrl", reader.result);
        set("source", "image");
      }
    };
    reader.readAsDataURL(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
    if (item) {
      const file = item.getAsFile();
      if (file) handleFile(file);
    }
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onPaste={onPaste}
        onClick={() => inputRef.current?.click()}
        tabIndex={0}
        role="button"
        aria-label={t("btn.dropImage")}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-[var(--r-md)] border-2 border-dashed p-6 cursor-pointer transition-colors",
          dragging
            ? "border-accent bg-accent/5"
            : "border-line bg-surface-2 hover:border-muted",
        )}
      >
        <ImageIcon className="size-6 text-muted" />
        <p className="text-xs text-ink-2 text-center px-4">{t("btn.dropImage")}</p>
        <p className="text-[10px] text-muted">PNG · SVG · WebP · JPEG</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
          className="hidden"
        />
      </div>
      {config.imageDataUrl && (
        <button
          type="button"
          onClick={() => set("imageDataUrl", null)}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-ink-2 transition-colors"
        >
          <X className="size-3" />
          {t("btn.removeImage")}
        </button>
      )}
    </div>
  );
}
