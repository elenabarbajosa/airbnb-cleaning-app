import { Card } from "@/components/ui/Card";

export function EvaNoteCard({ note, title = "Nota de Eva" }: { note: string | null; title?: string }) {
  if (!note) return null;
  return (
    <Card className="border-blue-200 bg-blue-50 p-4">
      <div className="text-sm font-semibold text-blue-900">{title}</div>
      <div className="mt-1 whitespace-pre-wrap text-sm text-blue-900/90">{note}</div>
    </Card>
  );
}

