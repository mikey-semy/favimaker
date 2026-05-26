"use client";

import * as React from "react";
import { classifyContrast, effectiveContrast, type ContrastLevel } from "@/lib/contrast";
import { useConfig } from "@/lib/store";
import { useT } from "@/lib/i18n";

/**
 * WCAG-индикатор: показывает контраст текста к эффективному фону.
 * Скрывается когда контраст невычислим (transparent bg, image source).
 *
 * Зачем: юзер ставит светло-серый текст на белом фоне — иконка
 * нечитаема на вкладке. Бэйдж сразу подсвечивает проблему.
 */
const COLORS: Record<ContrastLevel, string> = {
  AAA: "text-green-500",
  AA: "text-green-500",
  "AA-large": "text-yellow-500",
  fail: "text-red-500",
};

export function ContrastBadge() {
  const config = useConfig((s) => s.config);
  const t = useT();
  const ratio = effectiveContrast(config);
  if (ratio === null) return null;

  const level = classifyContrast(ratio);
  const label =
    level === "AAA"
      ? t("contrast.aaa")
      : level === "AA"
        ? t("contrast.aa")
        : level === "AA-large"
          ? t("contrast.aaLarge")
          : t("contrast.fail");

  return (
    <span
      title={label.replace("{ratio}", ratio.toFixed(2))}
      className={
        "inline-flex items-center gap-1 text-[11px] font-mono tabular-nums " + COLORS[level]
      }
    >
      <span
        aria-hidden
        className={"size-1.5 rounded-full bg-current"}
      />
      {ratio.toFixed(2)}:1
    </span>
  );
}
