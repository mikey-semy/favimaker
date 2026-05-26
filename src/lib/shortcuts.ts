"use client";

/**
 * Глобальные keyboard-shortcuts. Один источник правды о хоткеях + event-bus
 * для команд которые должны триггерить действия в произвольных компонентах
 * (например, Ctrl+S из header → Download в ExportPanel).
 *
 * Все хоткеи слушаются ОДНИМ <GlobalShortcuts /> компонентом — никакой
 * концепции «контекстных» bindings'ов. Иначе keyboard-listener'ы плодятся
 * и логика «кто что обрабатывает» размазана.
 */

export type ShortcutAction =
  | "undo"
  | "redo"
  | "download"
  | "help";

/** Описание для UI-модала «Shortcuts». labelKey — i18n-ключ. */
export type ShortcutDef = {
  action: ShortcutAction;
  /** Клавиша как строка для отображения, локально-независимо: `?`, `Z`. */
  key: string;
  /** Modifier'ы для отображения: `Ctrl`, `Shift`. На Mac `Ctrl` отрендерится как `⌘` через UI. */
  modifiers: ("cmd" | "shift")[];
  labelKey: ShortcutLabelKey;
};

export type ShortcutLabelKey =
  | "shortcut.undo"
  | "shortcut.redo"
  | "shortcut.download"
  | "shortcut.help";

export const SHORTCUTS: ShortcutDef[] = [
  { action: "undo", key: "Z", modifiers: ["cmd"], labelKey: "shortcut.undo" },
  { action: "redo", key: "Z", modifiers: ["cmd", "shift"], labelKey: "shortcut.redo" },
  { action: "download", key: "S", modifiers: ["cmd"], labelKey: "shortcut.download" },
  { action: "help", key: "?", modifiers: [], labelKey: "shortcut.help" },
];

/** EventTarget для cross-component триггеров (Ctrl+S → Download). */
const bus = typeof window !== "undefined" ? new EventTarget() : null;

export function emitShortcut(action: ShortcutAction): void {
  bus?.dispatchEvent(new CustomEvent(`fm:${action}`));
}

export function onShortcut(action: ShortcutAction, handler: () => void): () => void {
  if (!bus) return () => {};
  const wrapped = () => handler();
  bus.addEventListener(`fm:${action}`, wrapped);
  return () => bus.removeEventListener(`fm:${action}`, wrapped);
}

/** True если событие исходит из инпута — не перехватываем. */
export function isInputTarget(e: KeyboardEvent): boolean {
  const target = e.target as HTMLElement | null;
  return !!target?.closest("input, textarea, [contenteditable='true']");
}
