"use client";

import { Check, Info, X, AlertCircle } from "lucide-react";
import { useToast, type Toast } from "@/lib/toast";
import { cn } from "@/lib/cn";

/** Контейнер для всплывающих сообщений. Кладётся в layout.tsx один раз. */
export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const Icon = toast.variant === "success" ? Check : toast.variant === "error" ? AlertCircle : Info;
  return (
    <div
      className={cn(
        "pointer-events-auto flex items-center gap-2 min-w-[200px] max-w-sm px-3 py-2.5 rounded-[var(--r-md)] shadow-xl border text-sm",
        "bg-surface border-line text-ink toast-anim",
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0",
          toast.variant === "success" && "text-green-500",
          toast.variant === "error" && "text-red-500",
          toast.variant === "info" && "text-accent",
        )}
      />
      <span className="flex-1">{toast.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="text-muted hover:text-ink transition-colors"
        aria-label="Закрыть"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
