"use client";

import * as React from "react";
import { Pipette } from "lucide-react";
import { cn } from "@/lib/cn";
import { toast } from "@/lib/toast";
import { useT } from "@/lib/i18n";

export function TextInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-[var(--r-md)] bg-surface-2 border border-line px-3 py-2 text-sm text-ink",
        "outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20",
        "placeholder:text-muted disabled:opacity-50",
        className,
      )}
    />
  );
}

export function NumberInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="number"
      {...props}
      className={cn(
        "w-full rounded-[var(--r-md)] bg-surface-2 border border-line px-3 py-2 text-sm text-ink font-mono tabular-nums",
        "outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20",
        className,
      )}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-[var(--r-md)] bg-surface-2 border border-line px-3 py-2 text-sm text-ink",
        "outline-none focus-visible:border-accent appearance-none cursor-pointer",
        "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 12 12%22><path fill=%22%238a8a92%22 d=%22M3 5l3 3 3-3z%22/></svg>')] bg-no-repeat bg-[right_8px_center] pr-8",
        className,
      )}
    >
      {children}
    </select>
  );
}

/** Минимальный тип EyeDropper API (lib.dom его пока не покрывает). */
type EyeDropperInstance = { open: () => Promise<{ sRGBHex: string }> };
type EyeDropperCtor = new () => EyeDropperInstance;

// useSyncExternalStore-snapshots для feature detection (см. ColorInput).
// Объявлены модульно — стабильные ссылки между рендерами, иначе React
// будет считать что external source изменился каждый раз.
const EYEDROPPER_NOOP_SUBSCRIBE = () => () => {};
const eyedropperClientSnapshot = (): boolean =>
  typeof window !== "undefined" && "EyeDropper" in window;
const eyedropperServerSnapshot = (): boolean => false;

export function ColorInput({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const t = useT();
  // Feature-detect через useSyncExternalStore — официальный React-18+
  // паттерн для browser API без hydration mismatch. Server snapshot всегда
  // false, client snapshot — реальное наличие API. Subscribe пустой —
  // поддержка не меняется в рантайме.
  const eyedropperSupported = React.useSyncExternalStore(
    EYEDROPPER_NOOP_SUBSCRIBE,
    eyedropperClientSnapshot,
    eyedropperServerSnapshot,
  );

  const handleEyedropper = async () => {
    const Ctor = (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper;
    if (!Ctor) return;
    try {
      const result = await new Ctor().open();
      onChange(result.sRGBHex);
    } catch (err) {
      // Esc / отмена выбрасывает AbortError — это не ошибка, молчим.
      // Любая другая — показываем toast.
      const isAbort = err instanceof DOMException && err.name === "AbortError";
      if (!isAbort) toast.error(t("color.eyedropperFailed"));
    }
  };

  return (
    <div
      className={cn(
        "flex items-stretch gap-2 rounded-[var(--r-md)] bg-surface-2 border border-line p-1.5 transition-colors focus-within:border-accent",
        className,
      )}
    >
      {/* Большой кликабельный свотч — всё цветное поле открывает нативную
          палитру через скрытый <input type=color>. */}
      <label
        className="relative block h-8 w-10 shrink-0 cursor-pointer rounded-[var(--r-sm)] overflow-hidden ring-1 ring-line hover:ring-2 hover:ring-accent transition-all"
        style={{ background: value }}
        title="Открыть палитру"
      >
        <input
          type="color"
          value={normalizeHex(value)}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="flex-1 min-w-0 bg-transparent text-sm font-mono tabular-nums text-ink outline-none uppercase"
      />
      {/* Eyedropper — только в Chromium-браузерах. На Firefox/Safari
          API отсутствует → кнопка не рендерится. */}
      {eyedropperSupported && (
        <button
          type="button"
          onClick={handleEyedropper}
          title={t("color.eyedropper")}
          aria-label={t("color.eyedropper")}
          className="shrink-0 flex items-center justify-center w-8 rounded-[var(--r-sm)] text-ink-2 hover:text-ink hover:bg-line/60 transition-colors cursor-pointer"
        >
          <Pipette className="size-3.5" />
        </button>
      )}
    </div>
  );
}

/** Нативный <input type=color> принимает только 7-символьный #RRGGBB (без alpha,
 *  без коротких форматов). Нормализуем — иначе пикер не открывается. */
function normalizeHex(v: string): string {
  if (/^#[0-9a-f]{6}$/i.test(v)) return v;
  // короткий формат #abc → #aabbcc
  const short = v.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;
  // 8-символьный с alpha → отрезаем alpha
  if (/^#[0-9a-f]{8}$/i.test(v)) return v.slice(0, 7);
  return "#000000";
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn(
        "w-full appearance-none bg-transparent cursor-pointer",
        "[&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full",
        "[&::-webkit-slider-runnable-track]:bg-surface-2",
        "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-4",
        "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent",
        "[&::-webkit-slider-thumb]:-mt-1.25 [&::-webkit-slider-thumb]:transition-transform",
        "[&::-webkit-slider-thumb]:hover:scale-110",
        "[&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-surface-2",
        "[&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent",
        className,
      )}
    />
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: { value: T; label: string; icon?: React.ReactNode }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        // flex (не inline-flex) + min-w-0 на детях позволяет flex-1 действительно
        // делить ширину. Иначе на мобильном с 4 опциями элементы вылазили.
        "flex rounded-[var(--r-md)] bg-surface-2 border border-line p-1 gap-0.5",
        className,
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          title={opt.label}
          className={cn(
            "flex flex-1 min-w-0 items-center justify-center rounded-[var(--r-sm)] font-medium transition-colors",
            // Если есть иконка — стэк icon над label вертикально, помещается полный текст.
            // Без иконки — однострочный горизонтальный (для bg-mode например).
            opt.icon
              ? "flex-col gap-0.5 py-1.5 px-1 text-[10px]"
              : "gap-1.5 px-2 py-1.5 text-xs",
            value === opt.value
              ? "bg-accent text-[var(--accent-ink)]"
              : "text-ink-2 hover:text-ink hover:bg-line/60",
          )}
        >
          {opt.icon}
          <span className={cn("max-w-full", opt.icon ? "leading-none" : "truncate")}>
            {opt.label}
          </span>
        </button>
      ))}
    </div>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  meta,
  className,
  disabled,
  title,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <label
      title={title}
      className={cn(
        "flex items-center gap-2 text-xs py-1 group select-none",
        disabled
          ? "opacity-40 cursor-not-allowed text-muted"
          : "cursor-pointer text-ink-2 hover:text-ink",
        className,
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className={cn(
          "appearance-none size-3.5 shrink-0 rounded-[3px] border border-line bg-surface-2 transition-colors",
          disabled ? "cursor-not-allowed" : "cursor-pointer",
          "checked:bg-accent checked:border-accent",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
          "relative checked:after:content-[''] checked:after:absolute checked:after:left-[3px] checked:after:top-[0px]",
          "checked:after:w-[4px] checked:after:h-[8px] checked:after:border-[var(--accent-ink)]",
          "checked:after:border-r-2 checked:after:border-b-2 checked:after:rotate-45",
        )}
      />
      <span className="flex-1 min-w-0 truncate">{label}</span>
      {meta && <span className="text-[10px] text-muted font-mono tabular-nums">{meta}</span>}
    </label>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--r-md)] font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "primary" &&
          "bg-accent text-[var(--accent-ink)] hover:bg-[var(--accent-hover)]",
        variant === "secondary" && "bg-surface-2 text-ink border border-line hover:bg-line/60",
        variant === "ghost" && "text-ink-2 hover:text-ink hover:bg-surface-2",
        size === "sm" && "px-3 py-1.5 text-xs",
        size === "md" && "px-4 py-2 text-sm",
        size === "lg" && "px-5 py-2.5 text-sm",
        className,
      )}
    >
      {children}
    </button>
  );
}
