"use client";

import * as React from "react";
import * as Icons from "lucide-react";
import { ICON_LIBRARY } from "@/lib/icons";
import { useConfig } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { TextInput } from "./inputs";
import { Slider } from "./inputs";
import { Field, FieldRow } from "./Field";
import { ColorInput } from "./inputs";
import { cn } from "@/lib/cn";

type LucideIconRecord = Record<string, React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>>;

export function IconPicker() {
  const { config, set } = useConfig();
  const t = useT();
  const [search, setSearch] = React.useState("");

  const iconsRecord = Icons as unknown as LucideIconRecord;

  return (
    <div className="space-y-3">
      <FieldRow>
        <Field label={t("field.textColor")}>
          <ColorInput value={config.textColor} onChange={(v) => set("textColor", v)} />
        </Field>
        <Field label={t("field.strokeWidth")} hint={`${config.iconStrokeWidth}px`}>
          <Slider
            value={config.iconStrokeWidth}
            onChange={(v) => set("iconStrokeWidth", v)}
            min={1}
            max={4}
            step={0.5}
          />
        </Field>
      </FieldRow>

      <TextInput
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("fonts.search")}
      />

      <div className="max-h-72 overflow-y-auto space-y-3 -mx-1 px-1">
        {ICON_LIBRARY.map((group) => {
          const filtered = search.trim()
            ? group.names.filter((n) => n.toLowerCase().includes(search.trim().toLowerCase()))
            : group.names;
          if (filtered.length === 0) return null;
          return (
            <div key={group.category}>
              <p className="text-[10px] uppercase tracking-wider text-muted mb-1.5">
                {group.category}
              </p>
              <div className="grid grid-cols-6 gap-1">
                {filtered.map((name) => {
                  const Icon = iconsRecord[name];
                  if (!Icon) return null;
                  const selected = config.iconName === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => set("iconName", name)}
                      title={name}
                      className={cn(
                        "flex items-center justify-center aspect-square rounded-[var(--r-sm)] transition-colors text-ink-2 hover:bg-surface-2 hover:text-ink",
                        selected && "ring-2 ring-accent bg-surface-2 text-ink",
                      )}
                    >
                      <Icon size={20} strokeWidth={2} />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
