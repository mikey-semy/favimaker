"use client";

import * as React from "react";
import { useConfig } from "@/lib/store";
import { renderToCanvas } from "@/lib/renderer";
import { loadGoogleFont, waitForFont, POPULAR_FONTS } from "@/lib/google-fonts";
import { useT } from "@/lib/i18n";

const PREVIEW_SIZES = [16, 32, 64, 180] as const;

/** Один canvas на конкретном размере. */
function PreviewCanvas({ size }: { size: number }) {
  const config = useConfig((s) => s.config);
  const ref = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width = size;
    canvas.height = size;
    let cancelled = false;
    (async () => {
      if (config.source === "text") {
        const font = POPULAR_FONTS.find((f) => f.family === config.fontFamily);
        if (font) {
          await loadGoogleFont(config.fontFamily, font.weights);
          await waitForFont(config.fontFamily, config.fontWeight, config.text);
        }
      }
      if (cancelled) return;
      await renderToCanvas(canvas, config);
    })();
    return () => {
      cancelled = true;
    };
  }, [config, size]);

  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="rounded-[var(--r-sm)]"
    />
  );
}

function PreviewCanvasLarge() {
  const config = useConfig((s) => s.config);
  const ref = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width = 256;
    canvas.height = 256;
    let cancelled = false;
    (async () => {
      if (config.source === "text") {
        const font = POPULAR_FONTS.find((f) => f.family === config.fontFamily);
        if (font) {
          await loadGoogleFont(config.fontFamily, font.weights);
          await waitForFont(config.fontFamily, config.fontWeight, config.text);
        }
      }
      if (cancelled) return;
      await renderToCanvas(canvas, config);
    })();
    return () => {
      cancelled = true;
    };
  }, [config]);

  return <canvas ref={ref} className="size-64 rounded-[var(--r-md)]" />;
}

export function Preview() {
  const t = useT();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted mb-3">{t("preview.title")}</p>
        <div className="checker rounded-[var(--r-lg)] p-8 flex items-center justify-center">
          <div className="bg-surface rounded-[var(--r-lg)] p-6">
            <PreviewCanvasLarge />
          </div>
        </div>
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted mb-3">
          {t("preview.realSizes")}
        </p>
        <div className="flex items-end justify-around gap-4 bg-surface rounded-[var(--r-lg)] p-6">
          {PREVIEW_SIZES.map((s) => (
            <div key={s} className="flex flex-col items-center gap-2">
              <PreviewCanvas size={s} />
              <span className="text-[10px] font-mono text-muted">
                {s}×{s}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* На светлом и тёмном фоне — чтобы видеть как иконка читается в обоих контекстах */}
      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted mb-3">
          {t("preview.onThemes")}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[var(--r-lg)] border border-line p-4 flex items-center justify-center bg-white">
            <PreviewCanvas size={64} />
          </div>
          <div className="rounded-[var(--r-lg)] border border-line p-4 flex items-center justify-center bg-[#0a0a0f]">
            <PreviewCanvas size={64} />
          </div>
        </div>
      </div>

      <BrowserTabPreview />
    </div>
  );
}

function BrowserTabPreview() {
  const t = useT();
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted mb-3">
        {t("preview.inBrowser")}
      </p>
      <div className="bg-surface rounded-t-[var(--r-lg)] border border-line border-b-0 p-3 flex items-center gap-1.5">
        <span className="size-3 rounded-full bg-[#ff5f57]" />
        <span className="size-3 rounded-full bg-[#febc2e]" />
        <span className="size-3 rounded-full bg-[#28c840]" />
        <div className="ml-3 flex items-center gap-2 bg-background rounded-[var(--r-md)] px-3 py-1.5 text-xs text-ink-2 max-w-[300px]">
          <PreviewCanvas size={16} />
          <span className="truncate">favimaker — Favicon generator</span>
        </div>
      </div>
      <div className="bg-background rounded-b-[var(--r-lg)] border border-line h-16" />
    </div>
  );
}
