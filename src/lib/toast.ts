"use client";

import { create } from "zustand";

export type Toast = {
  id: number;
  message: string;
  variant: "success" | "info" | "error";
};

type ToastStore = {
  toasts: Toast[];
  show: (message: string, variant?: Toast["variant"], timeoutMs?: number) => void;
  dismiss: (id: number) => void;
};

let counter = 0;

export const useToast = create<ToastStore>((set, get) => ({
  toasts: [],
  show: (message, variant = "info", timeoutMs = 2500) => {
    const id = ++counter;
    set((s) => ({ toasts: [...s.toasts, { id, message, variant }] }));
    setTimeout(() => {
      get().dismiss(id);
    }, timeoutMs);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Удобный хелпер чтобы не таскать useToast.getState() везде. */
export const toast = {
  success: (message: string) => useToast.getState().show(message, "success"),
  info: (message: string) => useToast.getState().show(message, "info"),
  error: (message: string) => useToast.getState().show(message, "error"),
};
