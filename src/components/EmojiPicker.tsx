"use client";

import * as React from "react";
import { EMOJI_LIBRARY } from "@/lib/emojis";
import { useConfig } from "@/lib/store";
import { TextInput } from "./inputs";
import { cn } from "@/lib/cn";

export function EmojiPicker() {
  const { config, set } = useConfig();
  return (
    <div className="space-y-3">
      <TextInput
        value={config.emoji}
        onChange={(e) => set("emoji", e.target.value)}
        placeholder="🦝"
        maxLength={4}
        className="text-2xl text-center"
      />
      <div className="max-h-60 overflow-y-auto space-y-3 -mx-1 px-1">
        {EMOJI_LIBRARY.map((group) => (
          <div key={group.category}>
            <p className="text-[10px] uppercase tracking-wider text-muted mb-1.5">
              {group.category}
            </p>
            <div className="grid grid-cols-8 gap-1">
              {group.emojis.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => set("emoji", e)}
                  className={cn(
                    "flex items-center justify-center aspect-square rounded-[var(--r-sm)] text-xl transition-colors",
                    "hover:bg-surface-2",
                    config.emoji === e && "ring-2 ring-accent bg-surface-2",
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
