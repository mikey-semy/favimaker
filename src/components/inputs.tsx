"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

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

export function ColorInput({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-[var(--r-md)] bg-surface-2 border border-line p-1.5",
        className,
      )}
    >
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-9 cursor-pointer rounded-[var(--r-sm)] bg-transparent border-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-[var(--r-sm)] [&::-webkit-color-swatch]:border-0"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-sm font-mono tabular-nums text-ink outline-none uppercase"
      />
    </div>
  );
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
            "flex items-center justify-center gap-1.5 flex-1 min-w-0 px-2 py-1.5 rounded-[var(--r-sm)] text-xs font-medium transition-colors",
            value === opt.value
              ? "bg-accent text-[var(--accent-ink)]"
              : "text-ink-2 hover:text-ink hover:bg-line/60",
          )}
        >
          {opt.icon}
          <span className="truncate">{opt.label}</span>
        </button>
      ))}
    </div>
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
