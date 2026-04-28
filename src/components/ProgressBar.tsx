import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
}: {
  value: number; // 0..1
  className?: string;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={cn("w-full", className)}>
      <div className="h-3 w-full rounded-full bg-zinc-200">
        <div className="h-3 rounded-full bg-zinc-900 transition-[width]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

