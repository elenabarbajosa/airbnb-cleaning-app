import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
  trackClassName,
  barClassName,
}: {
  value: number; // 0..1
  className?: string;
  trackClassName?: string;
  barClassName?: string;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={cn("w-full", className)}>
      <div className={cn("h-3 w-full rounded-full bg-zinc-200", trackClassName)}>
        <div
          className={cn("h-3 rounded-full bg-zinc-900 transition-[width]", barClassName)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

