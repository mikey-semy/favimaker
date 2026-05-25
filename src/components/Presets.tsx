"use client";

import * as React from "react";
import { useConfig } from "@/lib/store";
import { useLocale } from "@/lib/i18n";
import { PRESETS } from "@/lib/presets";
import { renderToCanvas } from "@/lib/renderer";
import { loadGoogleFont, POPULAR_FONTS, waitForFont } from "@/lib/google-fonts";
import { cn } from "@/lib/cn";

const PRESET_SIZE = 64;

/** Маленькое канвас-превью пресета. */
function PresetThumbnail({ preset }: { preset: (typeof PRESETS)[number] }) {
  const ref = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let cancelled = false;
    (async () => {
      if (preset.config.source === "text") {
        const font = POPULAR_FONTS.find((f) => f.family === preset.config.fontFamily);
        if (font) {
          await loadGoogleFont(preset.config.fontFamily, font.weights);
          await waitForFont(
            preset.config.fontFamily,
            preset.config.fontWeight,
            preset.config.text,
          );
        }
      }
      if (cancelled) return;
      await renderToCanvas(canvas, preset.config);
    })();
    return () => {
      cancelled = true;
    };
  }, [preset]);

  return (
    <canvas
      ref={ref}
      width={PRESET_SIZE}
      height={PRESET_SIZE}
      style={{ width: PRESET_SIZE, height: PRESET_SIZE }}
      className="rounded-[var(--r-sm)]"
    />
  );
}

export function Presets() {
  const replace = useConfig((s) => s.replace);
  const locale = useLocale((s) => s.locale);

  return (
    <div className="grid grid-cols-2 gap-2">
      {PRESETS.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => replace(p.config)}
          className={cn(
            "group flex items-center gap-2.5 rounded-[var(--r-md)] border border-line bg-surface-2 p-2 transition-colors",
            "hover:border-accent/40 hover:bg-surface text-left min-w-0",
          )}
          title={p.name[locale]}
        >
          <span className="shrink-0">
            <PresetThumbnail preset={p} />
          </span>
          <span className="text-xs text-ink-2 group-hover:text-ink transition-colors leading-tight break-words min-w-0">
            {p.name[locale]}
          </span>
        </button>
      ))}
    </div>
  );
}
