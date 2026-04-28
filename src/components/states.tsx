import { Card } from "@/components/ui/Card";

export function LoadingState({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="px-4 py-6">
      <Card className="p-4">
        <div className="text-sm text-zinc-600">{label}</div>
      </Card>
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <Card className="p-4">
      <div className="text-base font-semibold">{title}</div>
      {description ? <div className="mt-1 text-sm text-zinc-600">{description}</div> : null}
    </Card>
  );
}

