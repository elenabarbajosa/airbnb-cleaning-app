import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function AdminHistoryDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: session } = await supabase
    .from("cleaning_sessions")
    .select("id, status, eva_note, maid_general_note, started_at, completed_at, started_by")
    .eq("id", id)
    .maybeSingle();

  if (!session) notFound();

  const { data: tasks } = await supabase
    .from("cleaning_session_tasks")
    .select("id, title, description, sort_order, is_important, is_completed, completed_at, issue_note")
    .eq("session_id", id)
    .order("sort_order", { ascending: true });

  const total = tasks?.length ?? 0;
  const completed = (tasks ?? []).filter((t) => t.is_completed).length;
  const issues = (tasks ?? []).filter((t) => t.issue_note && String(t.issue_note).trim().length).length;

  const tone =
    session.status === "in_progress" ? "red" : completed === total && issues === 0 ? "green" : "amber";
  const label =
    session.status === "in_progress"
      ? "En curso"
      : tone === "green"
        ? "Completado"
        : issues
          ? "Incidencias"
          : "Incompleto";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-2xl font-semibold tracking-tight">Sesión de limpieza</div>
        <StatusBadge label={label} tone={tone} />
      </div>

      <Card className="p-4 space-y-1">
        <div className="text-sm text-zinc-600">Inicio</div>
        <div className="text-base font-semibold">{new Date(session.started_at).toLocaleString()}</div>
        {session.completed_at ? (
          <div className="text-sm text-zinc-600">Fin: {new Date(session.completed_at).toLocaleString()}</div>
        ) : null}
        <div className="mt-2 text-sm text-zinc-600">
          {completed}/{total} tareas · {issues} incidencia(s)
        </div>
      </Card>

      {session.eva_note ? (
        <Card className="border-sky-200 bg-sky-50 p-4">
          <div className="text-sm font-semibold text-sky-900">Nota de Eva</div>
          <div className="mt-1 whitespace-pre-wrap text-sm text-sky-900/90">{session.eva_note}</div>
        </Card>
      ) : null}

      {session.maid_general_note ? (
        <Card className="p-4">
          <div className="text-sm font-semibold text-zinc-900">Nota de la limpiadora</div>
          <div className="mt-1 whitespace-pre-wrap text-sm text-zinc-700">{session.maid_general_note}</div>
        </Card>
      ) : null}

      <div className="space-y-3">
        {(tasks ?? []).map((t) => (
          <Card key={t.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-base font-semibold">{t.title}</div>
                {t.description ? <div className="mt-1 text-sm text-zinc-600">{t.description}</div> : null}
                {t.issue_note && String(t.issue_note).trim().length ? (
                  <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    <div className="font-semibold">Incidencia</div>
                    <div className="mt-1 whitespace-pre-wrap">{t.issue_note}</div>
                  </div>
                ) : null}
              </div>
              <div className="shrink-0 text-right">
                <div className="text-sm font-semibold">{t.is_completed ? "Completado" : "Incompleto"}</div>
                {t.completed_at ? (
                  <div className="text-xs text-zinc-500">{new Date(t.completed_at).toLocaleTimeString()}</div>
                ) : null}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

