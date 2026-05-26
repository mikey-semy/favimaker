import { cn } from "@/lib/cn";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  /** Может быть строкой (раньше — счётчик типа «60%») или React-узлом (badge). */
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted">{label}</span>
        {hint !== undefined && hint !== null && hint !== "" && (
          typeof hint === "string" ? (
            <span className="text-[11px] text-muted font-mono tabular-nums">{hint}</span>
          ) : (
            hint
          )
        )}
      </div>
      {children}
    </label>
  );
}

export function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}
