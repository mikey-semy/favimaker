"use client";

import * as React from "react";
import { useConfig } from "@/lib/store";
import { renderToCanvas } from "@/lib/renderer";
import { loadGoogleFont, waitForFont, POPULAR_FONTS } from "@/lib/google-fonts";
import { useT } from "@/lib/i18n";

const SIZE_LIST = [16, 32, 64] as const;

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

function PreviewCanvasResponsive({ maxPx = 200 }: { maxPx?: number }) {
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

  return (
    <canvas
      ref={ref}
      style={{ width: maxPx, height: maxPx, maxWidth: "100%" }}
      className="aspect-square rounded-[var(--r-md)]"
    />
  );
}

/**
 * Компактный preview-layout: большое превью + сетка размеров + темы в одной
 * строке. Помещается в ~500px высоты на десктопе — фитится в viewport без
 * вертикального скролла на большинстве экранов.
 */
export function Preview() {
  const t = useT();
  return (
    <div className="space-y-3">
      {/* Топ: большое превью + 3 размера + 2 темы */}
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-3">
        {/* Большое (200px) на checker — слева */}
        <div className="checker rounded-[var(--r-lg)] p-3 flex items-center justify-center">
          <div className="bg-surface rounded-[var(--r-md)] p-2">
            <PreviewCanvasResponsive maxPx={180} />
          </div>
        </div>

        {/* Правая часть: размеры + темы */}
        <div className="space-y-2 min-w-0">
          {/* Реальные размеры */}
          <div className="bg-surface rounded-[var(--r-lg)] p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted mb-2">
              {t("preview.realSizes")}
            </p>
            <div className="flex items-end justify-around gap-3 flex-wrap">
              {SIZE_LIST.map((s) => (
                <div key={s} className="flex flex-col items-center gap-1">
                  <PreviewCanvas size={s} />
                  <span className="text-[9px] font-mono text-muted">
                    {s}×{s}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* На светлом и тёмном фоне */}
          <div className="bg-surface rounded-[var(--r-lg)] p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted mb-2">
              {t("preview.onThemes")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-[var(--r-md)] border border-line p-2 flex items-center justify-center bg-white aspect-[2/1]">
                <PreviewCanvas size={48} />
              </div>
              <div className="rounded-[var(--r-md)] border border-line p-2 flex items-center justify-center bg-[#0a0a0f] aspect-[2/1]">
                <PreviewCanvas size={48} />
              </div>
            </div>
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
      <p className="text-[10px] uppercase tracking-wider text-muted mb-2">
        {t("preview.inBrowser")}
      </p>
      <div className="bg-surface rounded-[var(--r-lg)] border border-line p-2 flex items-center gap-2">
        <span className="size-2 rounded-full bg-[#ff5f57]" />
        <span className="size-2 rounded-full bg-[#febc2e]" />
        <span className="size-2 rounded-full bg-[#28c840]" />
        <div className="ml-2 flex items-center gap-2 bg-background rounded-[var(--r-md)] px-2 py-1 text-xs text-ink-2 max-w-[300px]">
          <PreviewCanvas size={16} />
          <span className="truncate">favimaker — Favicon generator</span>
        </div>
      </div>
    </div>
  );
}
