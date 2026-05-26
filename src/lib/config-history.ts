"use client";

/**
 * Undo/redo для конфига иконки. Подписываемся на useConfig и сохраняем
 * снапшоты в past[]. При undo/redo восстанавливаем через useConfig.replace().
 *
 * Дебаунс 300мс: слайдеры/colorpickers генерят десятки апдейтов в секунду,
 * каждый — не отдельный шаг. Коалесцируем в один.
 *
 * Cycle-guard: при undo/redo мы сами зовём replace, который триггерит
 * subscriber → попадаем в бесконечную push-undo петлю. Флаг `isApplying`
 * пропускает один цикл.
 *
 * История НЕ персистится — это in-session фича, не должна жить между
 * перезагрузками страницы.
 */
import { create } from "zustand";
import type { FaviconConfig } from "./types";
import { useConfig } from "./store";

const MAX_HISTORY = 50;
const DEBOUNCE_MS = 300;

type HistoryStore = {
  past: FaviconConfig[];
  future: FaviconConfig[];
  isApplying: boolean;
  pushSnapshot: (snapshot: FaviconConfig) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
};

export const useConfigHistory = create<HistoryStore>((set, get) => ({
  past: [],
  future: [],
  isApplying: false,

  pushSnapshot: (snapshot) => {
    if (get().isApplying) return;
    set((s) => ({
      past: [...s.past, snapshot].slice(-MAX_HISTORY),
      // Новая правка после undo сбрасывает forward-историю — стандартное
      // поведение Cmd+Z в редакторах.
      future: [],
    }));
  },

  undo: () => {
    const { past, future } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const current = useConfig.getState().config;
    set({
      past: past.slice(0, -1),
      future: [current, ...future],
      isApplying: true,
    });
    useConfig.getState().replace(previous);
    // Reset flag в следующем тике — subscriber успеет проигнорировать
    queueMicrotask(() => set({ isApplying: false }));
  },

  redo: () => {
    const { past, future } = get();
    if (future.length === 0) return;
    const next = future[0];
    const current = useConfig.getState().config;
    set({
      past: [...past, current].slice(-MAX_HISTORY),
      future: future.slice(1),
      isApplying: true,
    });
    useConfig.getState().replace(next);
    queueMicrotask(() => set({ isApplying: false }));
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
}));

// ── Subscribe-once side-effect ────────────────────────────────────────────
// "use client" гарантирует что код выполняется только в браузере. Модуль
// импортируется page.tsx один раз, подписка живёт до перезагрузки.
let burstStart: FaviconConfig | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

useConfig.subscribe((state, prevState) => {
  if (state.config === prevState.config) return;
  if (useConfigHistory.getState().isApplying) return;

  // Начало нового "всплеска" правок — запоминаем снапшот ДО первой правки.
  // Это то что юзер увидит при первом undo.
  if (debounceTimer === null) {
    burstStart = prevState.config;
  }
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    if (burstStart) useConfigHistory.getState().pushSnapshot(burstStart);
    burstStart = null;
    debounceTimer = null;
  }, DEBOUNCE_MS);
});
