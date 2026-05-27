"use client";

import * as React from "react";
import {
  Type,
  Smile,
  ImageIcon,
  Sparkles,
  Square,
  Circle,
  Squircle,
  RotateCcw,
  Share2,
  Palette,
  Layers,
  Wand2,
  PaintBucket,
} from "lucide-react";
import { useConfig } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { Button, ColorInput, Select, Slider, SegmentedControl, TextInput } from "./inputs";
import { Field, FieldRow } from "./Field";
import { ContrastBadge } from "./ContrastBadge";
import { DropZone } from "./DropZone";
import { Presets } from "./Presets";
import { EmojiPicker } from "./EmojiPicker";
import { IconPicker } from "./IconPicker";
import { FontPicker } from "./FontPicker";
import { cn } from "@/lib/cn";
import { toast } from "@/lib/toast";

type Tab = "presets" | "source" | "shape" | "bg" | "fx";

const TABS: { id: Tab; icon: React.ComponentType<{ className?: string }>; labelKey: string }[] = [
  { id: "presets", icon: Palette, labelKey: "section.presets" },
  { id: "source", icon: Type, labelKey: "section.source" },
  { id: "shape", icon: Layers, labelKey: "section.shape" },
  { id: "bg", icon: PaintBucket, labelKey: "section.background" },
  { id: "fx", icon: Wand2, labelKey: "section.effects" },
];

export function Editor() {
  const { config, reset } = useConfig();
  const t = useT();
  const [tab, setTab] = React.useState<Tab>("source");

  const onShare = async () => {
    const json = JSON.stringify(config);
    const compressed = btoa(unescape(encodeURIComponent(json)));
    const url = `${window.location.origin}${window.location.pathname}#config=${compressed}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("msg.shareCopied"));
    } catch {
      // Старые браузеры без navigator.clipboard
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        toast.success(t("msg.shareCopied"));
      } catch {
        toast.error(t("msg.shareFallback"));
      }
      document.body.removeChild(ta);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar — icon + label stacked vertically, помещается 5 табов */}
      <div className="flex gap-0.5 mb-3 bg-surface-2 rounded-[var(--r-md)] p-1 border border-line">
        {TABS.map((tDef) => {
          const Icon = tDef.icon;
          const active = tab === tDef.id;
          const label = t(tDef.labelKey as Parameters<typeof t>[0]);
          return (
            <button
              key={tDef.id}
              type="button"
              onClick={() => setTab(tDef.id)}
              title={label}
              className={cn(
                "flex flex-col flex-1 items-center justify-center gap-0.5 min-w-0 py-1.5 rounded-[var(--r-sm)] transition-colors cursor-pointer",
                active
                  ? "bg-accent text-[var(--accent-ink)]"
                  : "text-ink-2 hover:text-ink hover:bg-line/60",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="text-[9px] font-medium truncate max-w-full leading-none">
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab content. key={tab} перезапускает CSS-анимацию tab-content
          при смене таба — мягкий fade-in вместо резкого «прыжка». */}
      <div key={tab} className="flex-1 min-h-0 tab-content">
        {tab === "presets" && <Presets />}
        {tab === "source" && <SourceTab />}
        {tab === "shape" && <ShapeTab />}
        {tab === "bg" && <BackgroundTab />}
        {tab === "fx" && <EffectsTab />}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-line">
        <Button variant="ghost" size="sm" onClick={reset}>
          <RotateCcw className="size-3.5" />
          {t("btn.reset")}
        </Button>
        <Button variant="ghost" size="sm" onClick={onShare}>
          <Share2 className="size-3.5" />
          {t("btn.share")}
        </Button>
      </div>
    </div>
  );
}

function SourceTab() {
  const { config, set } = useConfig();
  const t = useT();
  return (
    <div className="space-y-3">
      <SegmentedControl
        value={config.source}
        onChange={(v) => set("source", v)}
        options={[
          { value: "text", label: t("source.text"), icon: <Type className="size-3.5" /> },
          { value: "emoji", label: t("source.emoji"), icon: <Smile className="size-3.5" /> },
          { value: "icon", label: t("source.icon"), icon: <Sparkles className="size-3.5" /> },
          { value: "image", label: t("source.image"), icon: <ImageIcon className="size-3.5" /> },
        ]}
        className="w-full"
      />

      {config.source === "text" && (
        <>
          <TextInput
            value={config.text}
            onChange={(e) => set("text", e.target.value)}
            placeholder="F"
            maxLength={6}
          />
          {/* Опциональная вторая строка (monogram). Когда непустая, обе
              линии рендерятся стэком с уменьшенным кеглем. Подсказка для
              юзера через placeholder. */}
          <TextInput
            value={config.text2}
            onChange={(e) => set("text2", e.target.value)}
            placeholder={t("field.text2Placeholder")}
            maxLength={6}
          />
          <FontPicker />
          <FieldRow>
            <Field label={t("field.fontWeight")} hint={`${config.fontWeight}`}>
              <Select
                value={config.fontWeight}
                onChange={(e) => set("fontWeight", Number(e.target.value))}
              >
                {[400, 500, 700, 900].map((w) => (
                  <option key={w} value={w}>
                    {w === 400 ? "Regular" : w === 500 ? "Medium" : w === 700 ? "Bold" : "Black"}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("field.fontSize")} hint={`${config.fontSizePct}%`}>
              <Slider
                value={config.fontSizePct}
                onChange={(v) => set("fontSizePct", v)}
                min={20}
                max={120}
              />
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label={t("field.textColor")} hint={<ContrastBadge />}>
              <ColorInput value={config.textColor} onChange={(v) => set("textColor", v)} />
            </Field>
            <Field label={t("field.letterSpacing")} hint={`${config.letterSpacing.toFixed(2)}em`}>
              <Slider
                value={config.letterSpacing * 100}
                onChange={(v) => set("letterSpacing", v / 100)}
                min={-20}
                max={40}
              />
            </Field>
          </FieldRow>
          {/* Embed font as path в SVG favicon — гарантирует правильный шрифт
              в standalone-контексте без CSS сайта. Стоит ~300КБ lazy
              opentype.js + ~1-2с на fetch ttf при экспорте. */}
          <label className="flex items-center gap-2 cursor-pointer text-xs text-ink-2 hover:text-ink py-1">
            <input
              type="checkbox"
              checked={config.embedFontInSvg}
              onChange={(e) => set("embedFontInSvg", e.target.checked)}
              className="accent-accent"
            />
            <span suppressHydrationWarning>{t("field.embedFontInSvg")}</span>
          </label>
        </>
      )}

      {config.source === "emoji" && <EmojiPicker />}
      {config.source === "icon" && <IconPicker />}
      {config.source === "image" && <DropZone />}
    </div>
  );
}

function ShapeTab() {
  const { config, set } = useConfig();
  const t = useT();
  return (
    <div className="space-y-3">
      <SegmentedControl
        value={config.shape}
        onChange={(v) => set("shape", v)}
        options={[
          { value: "square", label: t("field.shapeSquare"), icon: <Square className="size-3.5" /> },
          {
            value: "rounded",
            label: t("field.shapeRounded"),
            icon: <Squircle className="size-3.5" />,
          },
          { value: "circle", label: t("field.shapeCircle"), icon: <Circle className="size-3.5" /> },
        ]}
        className="w-full"
      />
      {config.shape === "rounded" && (
        <Field label={t("field.borderRadius")} hint={`${config.borderRadiusPct}%`}>
          <Slider
            value={config.borderRadiusPct}
            onChange={(v) => set("borderRadiusPct", v)}
            min={0}
            max={50}
          />
        </Field>
      )}
      <Field label={t("field.padding")} hint={`${config.paddingPct}%`}>
        <Slider
          value={config.paddingPct}
          onChange={(v) => set("paddingPct", v)}
          min={0}
          max={30}
        />
      </Field>
    </div>
  );
}

function BackgroundTab() {
  const { config, set, setGradient } = useConfig();
  const t = useT();
  return (
    <div className="space-y-3">
      <SegmentedControl
        value={config.bgMode}
        onChange={(v) => set("bgMode", v)}
        options={[
          { value: "solid", label: t("field.bgSolid") },
          { value: "gradient", label: t("field.bgGradient") },
          { value: "transparent", label: t("field.bgTransparent") },
        ]}
        className="w-full"
      />
      {config.bgMode === "solid" && (
        <ColorInput value={config.bgColor} onChange={(v) => set("bgColor", v)} />
      )}
      {config.bgMode === "gradient" && (
        <>
          <FieldRow>
            <Field label={t("field.gradientFrom")}>
              <ColorInput value={config.bgGradient.from} onChange={(v) => setGradient("from", v)} />
            </Field>
            <Field label={t("field.gradientTo")}>
              <ColorInput value={config.bgGradient.to} onChange={(v) => setGradient("to", v)} />
            </Field>
          </FieldRow>
          <Field label={t("field.gradientDirection")}>
            <Select
              value={config.bgGradient.direction}
              onChange={(e) =>
                setGradient("direction", e.target.value as typeof config.bgGradient.direction)
              }
            >
              <option value="to-br">{t("grad.br")}</option>
              <option value="to-r">{t("grad.r")}</option>
              <option value="to-b">{t("grad.b")}</option>
              <option value="to-bl">{t("grad.bl")}</option>
              <option value="to-tr">{t("grad.tr")}</option>
              <option value="to-tl">{t("grad.tl")}</option>
              <option value="to-t">{t("grad.t")}</option>
              <option value="to-l">{t("grad.l")}</option>
              <option value="radial">{t("grad.radial")}</option>
            </Select>
          </Field>
        </>
      )}

      {/* Dark-mode вариант: парная иконка для prefers-color-scheme: dark.
          Когда включено — генерится favicon-dark.svg, в HTML-сниппет
          добавляются парные SVG-link'и с media-query. */}
      <div className="pt-3 mt-1 border-t border-line space-y-2">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-ink-2 hover:text-ink">
          <input
            type="checkbox"
            checked={config.darkVariantEnabled}
            onChange={(e) => set("darkVariantEnabled", e.target.checked)}
            className="accent-accent"
          />
          {t("field.darkVariant")}
        </label>
        {config.darkVariantEnabled && (
          <FieldRow>
            <Field label={t("field.darkTextColor")}>
              <ColorInput
                value={config.darkTextColor}
                onChange={(v) => set("darkTextColor", v)}
              />
            </Field>
            <Field label={t("field.darkBgColor")}>
              <ColorInput
                value={config.darkBgColor}
                onChange={(v) => set("darkBgColor", v)}
              />
            </Field>
          </FieldRow>
        )}
      </div>
    </div>
  );
}

function EffectsTab() {
  const { config, set } = useConfig();
  const t = useT();
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 cursor-pointer text-sm text-ink-2 hover:text-ink">
        <input
          type="checkbox"
          checked={config.shadow}
          onChange={(e) => set("shadow", e.target.checked)}
          className="accent-accent"
        />
        {t("field.shadow")}
      </label>
      {config.shadow && (
        <div className="space-y-3 pl-5 border-l border-line">
          <Field label={t("field.shadowColor")}>
            <ColorInput value={config.shadowColor} onChange={(v) => set("shadowColor", v)} />
          </Field>
          <FieldRow>
            <Field label={t("field.shadowBlur")} hint={`${config.shadowBlur}%`}>
              <Slider
                value={config.shadowBlur}
                onChange={(v) => set("shadowBlur", v)}
                min={0}
                max={30}
              />
            </Field>
            <Field label={t("field.shadowOffsetY")} hint={`${config.shadowOffsetY}%`}>
              <Slider
                value={config.shadowOffsetY}
                onChange={(v) => set("shadowOffsetY", v)}
                min={-20}
                max={20}
              />
            </Field>
          </FieldRow>
        </div>
      )}

      {config.source === "text" && (
        <>
          <Field label={t("field.textStroke")} hint={`${config.textStrokeWidth}%`}>
            <Slider
              value={config.textStrokeWidth}
              onChange={(v) => set("textStrokeWidth", v)}
              min={0}
              max={10}
            />
          </Field>
          {config.textStrokeWidth > 0 && (
            <Field label={t("field.strokeColor")}>
              <ColorInput
                value={config.textStrokeColor ?? "#000000"}
                onChange={(v) => set("textStrokeColor", v)}
              />
            </Field>
          )}
        </>
      )}

      <FieldRow>
        <Field label={t("field.border")} hint={`${config.borderWidth}%`}>
          <Slider
            value={config.borderWidth}
            onChange={(v) => set("borderWidth", v)}
            min={0}
            max={10}
          />
        </Field>
        {config.borderWidth > 0 && (
          <Field label={t("field.borderColor")}>
            <ColorInput value={config.borderColor} onChange={(v) => set("borderColor", v)} />
          </Field>
        )}
      </FieldRow>
    </div>
  );
}
