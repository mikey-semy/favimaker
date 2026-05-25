"use client";

import * as React from "react";
import {
  Type,
  Smile,
  ImageIcon,
  Square,
  Circle,
  Squircle,
  Paintbrush,
  RotateCcw,
  Share2,
} from "lucide-react";
import { useConfig } from "@/lib/store";
import {
  POPULAR_FONTS,
  fetchAllFonts,
  loadGoogleFont,
  type GoogleFont,
} from "@/lib/google-fonts";
import { Button, ColorInput, Select, Slider, SegmentedControl, TextInput } from "./inputs";
import { Field, FieldRow } from "./Field";
import { DEFAULT_CONFIG } from "@/lib/types";

export function Editor() {
  const { config, set, setGradient, reset } = useConfig();

  const onImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        set("imageDataUrl", reader.result);
        set("source", "image");
      }
    };
    reader.readAsDataURL(file);
  };

  const onShare = async () => {
    const json = JSON.stringify(config);
    const compressed = btoa(unescape(encodeURIComponent(json)));
    const url = `${window.location.origin}${window.location.pathname}#config=${compressed}`;
    try {
      await navigator.clipboard.writeText(url);
      alert("Ссылка скопирована в буфер обмена");
    } catch {
      prompt("Скопируйте ссылку вручную:", url);
    }
  };

  return (
    <div className="space-y-6">
      {/* SOURCE: text / emoji / image */}
      <section>
        <h3 className="text-[11px] uppercase tracking-wider text-muted mb-3">Источник</h3>
        <SegmentedControl
          value={config.source}
          onChange={(v) => set("source", v)}
          options={[
            { value: "text", label: "Текст", icon: <Type className="size-3.5" /> },
            { value: "emoji", label: "Эмодзи", icon: <Smile className="size-3.5" /> },
            { value: "image", label: "Картинка", icon: <ImageIcon className="size-3.5" /> },
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
                <Field label="Жирность" hint={`${config.fontWeight}`}>
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
                <Field label="Размер" hint={`${config.fontSizePct}%`}>
                  <Slider
                    value={config.fontSizePct}
                    onChange={(v) => set("fontSizePct", v)}
                    min={20}
                    max={120}
                  />
                </Field>
              </FieldRow>
              <FieldRow>
                <Field label="Цвет текста">
                  <ColorInput value={config.textColor} onChange={(v) => set("textColor", v)} />
                </Field>
                <Field
                  label="Letter-spacing"
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

          {config.source === "emoji" && (
            <TextInput
              value={config.emoji}
              onChange={(e) => set("emoji", e.target.value)}
              placeholder="🦝"
              maxLength={2}
              className="text-2xl text-center"
            />
          )}

          {config.source === "image" && (
            <div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={onImageUpload}
                className="block w-full text-sm text-ink-2 file:mr-3 file:rounded-[var(--r-md)] file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-medium file:text-[var(--accent-ink)] file:cursor-pointer"
              />
              {config.imageDataUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => set("imageDataUrl", null)}
                  className="mt-2"
                >
                  Убрать картинку
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* SHAPE */}
      <section>
        <h3 className="text-[11px] uppercase tracking-wider text-muted mb-3">Форма</h3>
        <SegmentedControl
          value={config.shape}
          onChange={(v) => set("shape", v)}
          options={[
            { value: "square", label: "Квадрат", icon: <Square className="size-3.5" /> },
            { value: "rounded", label: "Скруглённый", icon: <Squircle className="size-3.5" /> },
            { value: "circle", label: "Круг", icon: <Circle className="size-3.5" /> },
          ]}
          className="w-full"
        />
        {config.shape === "rounded" && (
          <div className="mt-3">
            <Field label="Скругление" hint={`${config.borderRadiusPct}%`}>
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
          <Field label="Внутренний отступ" hint={`${config.paddingPct}%`}>
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
        <h3 className="text-[11px] uppercase tracking-wider text-muted mb-3">Фон</h3>
        <SegmentedControl
          value={config.bgMode}
          onChange={(v) => set("bgMode", v)}
          options={[
            { value: "solid", label: "Сплошной" },
            { value: "gradient", label: "Градиент" },
            { value: "transparent", label: "Прозрачный" },
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
              <Field label="От">
                <ColorInput
                  value={config.bgGradient.from}
                  onChange={(v) => setGradient("from", v)}
                />
              </Field>
              <Field label="До">
                <ColorInput
                  value={config.bgGradient.to}
                  onChange={(v) => setGradient("to", v)}
                />
              </Field>
            </FieldRow>
            <Field label="Направление">
              <Select
                value={config.bgGradient.direction}
                onChange={(e) =>
                  setGradient(
                    "direction",
                    e.target.value as typeof config.bgGradient.direction,
                  )
                }
              >
                <option value="to-br">↘ к нижне-правому</option>
                <option value="to-r">→ вправо</option>
                <option value="to-b">↓ вниз</option>
                <option value="to-bl">↙ к нижне-левому</option>
                <option value="to-tr">↗ к верхне-правому</option>
                <option value="to-tl">↖ к верхне-левому</option>
                <option value="to-t">↑ вверх</option>
                <option value="to-l">← влево</option>
                <option value="radial">⊙ радиальный</option>
              </Select>
            </Field>
          </div>
        )}
      </section>

      {/* EFFECTS */}
      <section>
        <h3 className="text-[11px] uppercase tracking-wider text-muted mb-3">Эффекты</h3>
        <FieldRow>
          <Field label="Бордер" hint={`${config.borderWidth}%`}>
            <Slider
              value={config.borderWidth}
              onChange={(v) => set("borderWidth", v)}
              min={0}
              max={10}
            />
          </Field>
          {config.borderWidth > 0 && (
            <Field label="Цвет бордера">
              <ColorInput value={config.borderColor} onChange={(v) => set("borderColor", v)} />
            </Field>
          )}
        </FieldRow>
      </section>

      {/* ACTIONS */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-line">
        <Button variant="ghost" size="sm" onClick={reset}>
          <RotateCcw className="size-3.5" />
          Сброс
        </Button>
        <Button variant="ghost" size="sm" onClick={onShare}>
          <Share2 className="size-3.5" />
          Поделиться
        </Button>
      </div>
    </div>
  );
}

function FontPicker() {
  const { config, set } = useConfig();
  const [allFonts, setAllFonts] = React.useState<GoogleFont[] | null>(null);
  const [loadingAll, setLoadingAll] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [cyrillicOnly, setCyrillicOnly] = React.useState(false);

  // Подгружаем выбранный шрифт перед canvas-рендером
  React.useEffect(() => {
    const list = allFonts ?? POPULAR_FONTS;
    const font = list.find((f) => f.family === config.fontFamily);
    if (font) loadGoogleFont(config.fontFamily, font.weights);
  }, [config.fontFamily, allFonts]);

  const onLoadAll = async () => {
    setLoadingAll(true);
    try {
      const fonts = await fetchAllFonts();
      setAllFonts(fonts);
    } catch {
      // не удалось — остаёмся на курируемом списке
    } finally {
      setLoadingAll(false);
    }
  };

  const source = allFonts ?? POPULAR_FONTS;
  const filtered = React.useMemo(() => {
    let list = source;
    if (cyrillicOnly) list = list.filter((f) => f.cyrillic);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((f) => f.family.toLowerCase().includes(q));
    }
    // Сортируем по category → имени
    return [...list].sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.family.localeCompare(b.family);
    });
  }, [source, search, cyrillicOnly]);

  const grouped = React.useMemo(() => {
    const map = new Map<GoogleFont["category"], GoogleFont[]>();
    for (const f of filtered) {
      const arr = map.get(f.category) ?? [];
      arr.push(f);
      map.set(f.category, arr);
    }
    return map;
  }, [filtered]);

  const categoryLabel: Record<GoogleFont["category"], string> = {
    "sans-serif": "Sans-serif",
    display: "Display",
    serif: "Serif",
    monospace: "Monospace",
    handwriting: "Handwriting",
  };

  return (
    <div className="space-y-2">
      <Field
        label={`Шрифт (${filtered.length}${allFonts ? ` из ${allFonts.length}` : "+"})`}
      >
        <Select value={config.fontFamily} onChange={(e) => set("fontFamily", e.target.value)}>
          {Array.from(grouped.entries()).map(([cat, fonts]) => (
            <optgroup key={cat} label={categoryLabel[cat]}>
              {fonts.map((f) => (
                <option key={f.family} value={f.family}>
                  {f.family}
                  {f.cyrillic ? "" : " (latin)"}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
      </Field>

      <FieldRow>
        <TextInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск..."
        />
        <label className="flex items-center gap-2 px-3 text-xs text-ink-2 cursor-pointer">
          <input
            type="checkbox"
            checked={cyrillicOnly}
            onChange={(e) => setCyrillicOnly(e.target.checked)}
            className="accent-accent"
          />
          Только кириллица
        </label>
      </FieldRow>

      {!allFonts && (
        <Button variant="ghost" size="sm" onClick={onLoadAll} disabled={loadingAll} className="w-full">
          {loadingAll ? "Загружаю каталог..." : "Загрузить все ~1500 шрифтов из Google Fonts"}
        </Button>
      )}
    </div>
  );
}

// Заглушка — Paintbrush импортирован но не используется явно (для возможного добавления эффектов потом).
void Paintbrush;
void DEFAULT_CONFIG;
