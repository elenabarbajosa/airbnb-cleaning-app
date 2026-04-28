import { cn } from "@/lib/utils";

export type SessionStatus = "in_progress" | "completed";
export type SessionHealth = "green" | "amber" | "red";

export function StatusBadge({
  label,
  tone,
  className,
}: {
  label: string;
  tone: SessionHealth;
  className?: string;
}) {
  const tones: Record<SessionHealth, string> = {
    green: "bg-emerald-100 text-emerald-800 border-emerald-200",
    amber: "bg-amber-100 text-amber-800 border-amber-200",
    red: "bg-red-100 text-red-800 border-red-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}

