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
} from "lucide-react";
import { useConfig } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { Button, ColorInput, Select, Slider, SegmentedControl, TextInput } from "./inputs";
import { Field, FieldRow } from "./Field";
import { DropZone } from "./DropZone";
import { Presets } from "./Presets";
import { EmojiPicker } from "./EmojiPicker";
import { IconPicker } from "./IconPicker";
import { FontPicker } from "./FontPicker";

export function Editor() {
  const { config, set, setGradient, reset } = useConfig();
  const t = useT();

  const onShare = async () => {
    const json = JSON.stringify(config);
    const compressed = btoa(unescape(encodeURIComponent(json)));
    const url = `${window.location.origin}${window.location.pathname}#config=${compressed}`;
    try {
      await navigator.clipboard.writeText(url);
      alert(t("msg.shareCopied"));
    } catch {
      prompt(t("msg.shareFallback"), url);
    }
  };

  return (
    <div className="space-y-6">
      {/* PRESETS */}
      <section>
        <h3 className="text-[11px] uppercase tracking-wider text-muted mb-3">
          {t("section.presets")}
        </h3>
        <Presets />
      </section>

      {/* SOURCE */}
      <section>
        <h3 className="text-[11px] uppercase tracking-wider text-muted mb-3">
          {t("section.source")}
        </h3>
        <SegmentedControl
          value={config.source}
          onChange={(v) => set("source", v)}
          options={[
            { value: "text", label: t("source.text"), icon: <Type className="size-3.5" /> },
            { value: "emoji", label: t("source.emoji"), icon: <Smile className="size-3.5" /> },
            { value: "icon", label: t("source.icon"), icon: <Sparkles className="size-3.5" /> },
            {
              value: "image",
              label: t("source.image"),
              icon: <ImageIcon className="size-3.5" />,
            },
          ]}
          className="w-full"
        />

        <div className="mt-3 space-y-3">
          {config.source === "text" && (
            <>
              <TextInput
                value={config.text}
                onChange={(e) => set("text", e.target.value)}
                placeholder="F"
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
                <Field label={t("field.textColor")}>
                  <ColorInput value={config.textColor} onChange={(v) => set("textColor", v)} />
                </Field>
                <Field
                  label={t("field.letterSpacing")}
                  hint={`${config.letterSpacing.toFixed(2)}em`}
                >
                  <Slider
                    value={config.letterSpacing * 100}
                    onChange={(v) => set("letterSpacing", v / 100)}
                    min={-20}
                    max={40}
                  />
                </Field>
              </FieldRow>
            </>
          )}

          {config.source === "emoji" && <EmojiPicker />}

          {config.source === "icon" && <IconPicker />}

          {config.source === "image" && <DropZone />}
        </div>
      </section>

      {/* SHAPE */}
      <section>
        <h3 className="text-[11px] uppercase tracking-wider text-muted mb-3">
          {t("section.shape")}
        </h3>
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
          <div className="mt-3">
            <Field label={t("field.borderRadius")} hint={`${config.borderRadiusPct}%`}>
              <Slider
                value={config.borderRadiusPct}
                onChange={(v) => set("borderRadiusPct", v)}
                min={0}
                max={50}
              />
            </Field>
          </div>
        )}
        <div className="mt-3">
          <Field label={t("field.padding")} hint={`${config.paddingPct}%`}>
            <Slider
              value={config.paddingPct}
              onChange={(v) => set("paddingPct", v)}
              min={0}
              max={30}
            />
          </Field>
        </div>
      </section>

      {/* BACKGROUND */}
      <section>
        <h3 className="text-[11px] uppercase tracking-wider text-muted mb-3">
          {t("section.background")}
        </h3>
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
          <div className="mt-3">
            <ColorInput value={config.bgColor} onChange={(v) => set("bgColor", v)} />
          </div>
        )}
        {config.bgMode === "gradient" && (
          <div className="mt-3 space-y-3">
            <FieldRow>
              <Field label={t("field.gradientFrom")}>
                <ColorInput
                  value={config.bgGradient.from}
                  onChange={(v) => setGradient("from", v)}
                />
              </Field>
              <Field label={t("field.gradientTo")}>
                <ColorInput
                  value={config.bgGradient.to}
                  onChange={(v) => setGradient("to", v)}
                />
              </Field>
            </FieldRow>
            <Field label={t("field.gradientDirection")}>
              <Select
                value={config.bgGradient.direction}
                onChange={(e) =>
                  setGradient(
                    "direction",
                    e.target.value as typeof config.bgGradient.direction,
                  )
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
          </div>
        )}
      </section>

      {/* EFFECTS */}
      <section>
        <h3 className="text-[11px] uppercase tracking-wider text-muted mb-3">
          {t("section.effects")}
        </h3>
        <div className="space-y-3">
          {/* Тень */}
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

          {/* Обводка текста (только если source=text) */}
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

          {/* Бордер */}
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
      </section>

      {/* ACTIONS */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-line">
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

// FontPicker вынесен в components/FontPicker.tsx (с keyboard-nav и
// превью каждого шрифта в его собственном font-family)
