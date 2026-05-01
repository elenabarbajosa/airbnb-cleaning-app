import Link from "next/link";
import { startOfMonth, endOfMonth, format, parse } from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CleaningCalendar, type CalendarDayInfo } from "@/components/CleaningCalendar";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

type SessionRow = {
  id: string;
  status: "in_progress" | "completed";
  started_at: string;
  completed_at: string | null;
};

type SessionTaskRow = {
  session_id: string;
  is_completed: boolean;
  issue_note: string | null;
};

function getHealth(args: {
  status: SessionRow["status"];
  total: number;
  completed: number;
  issues: number;
}): CalendarDayInfo["tone"] {
  if (args.status === "in_progress") return "red";
  if (args.total === 0) return "green";
  const allDone = args.completed === args.total;
  const hasIssues = args.issues > 0;
  return allDone && !hasIssues ? "green" : "amber";
}

export default async function AdminHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const monthDate = month ? parse(month, "yyyy-MM", new Date()) : new Date();
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);

  const supabase = await createSupabaseServerClient();
  const { data: sessionsRaw } = await supabase
    .from("cleaning_sessions")
    .select("id, status, started_at, completed_at")
    .gte("started_at", start.toISOString())
    .lte("started_at", end.toISOString())
    .order("started_at", { ascending: false });

  const sessions = (sessionsRaw ?? []) as unknown as SessionRow[];
  const ids = sessions.map((s) => s.id);

  const { data: tasksRaw } = ids.length
    ? await supabase
        .from("cleaning_session_tasks")
        .select("session_id, is_completed, issue_note")
        .in("session_id", ids)
    : ({ data: [] as SessionTaskRow[] } as { data: SessionTaskRow[] });

  const stats = new Map<string, { total: number; completed: number; issues: number }>();
  for (const s of sessions) stats.set(s.id, { total: 0, completed: 0, issues: 0 });
  for (const t of (tasksRaw ?? []) as SessionTaskRow[]) {
    const st = stats.get(t.session_id);
    if (!st) continue;
    st.total += 1;
    if (t.is_completed) st.completed += 1;
    if (t.issue_note && String(t.issue_note).trim().length) st.issues += 1;
  }

  const days: Record<string, CalendarDayInfo> = {};
  for (const s of sessions) {
    const dayKey = format(new Date(s.started_at), "yyyy-MM-dd");
    if (days[dayKey]) continue; // keep latest per day (sessions are desc)
    const st = stats.get(s.id) ?? { total: 0, completed: 0, issues: 0 };
    days[dayKey] = { sessionId: s.id, tone: getHealth({ status: s.status, ...st }) };
  }

  return (
    <div className="space-y-4">
      <div className="text-2xl font-semibold tracking-tight">Historial</div>

      <Card className="p-4">
        <CleaningCalendar month={monthDate} days={days} />
      </Card>

      <div className="space-y-3">
        {sessions.map((s) => {
          const st = stats.get(s.id) ?? { total: 0, completed: 0, issues: 0 };
          const tone = getHealth({ status: s.status, ...st });
          const label =
            s.status === "in_progress"
              ? "En curso"
              : tone === "green"
                ? "Completado"
                : st.issues
                  ? "Incidencias"
                  : "Incompleto";

          return (
            <Card key={s.id} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-base font-semibold">{new Date(s.started_at).toLocaleString()}</div>
                  <div className="text-sm text-zinc-600">
                    {st.completed}/{st.total} tareas
                    {st.issues ? ` · ${st.issues} incidencia(s)` : ""}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge label={label} tone={tone} />
                  <Link
                    className="text-sm font-semibold text-sky-700 underline decoration-sky-300"
                    href={`/admin/history/${s.id}`}
                  >
                    Ver
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
        {!sessions.length ? <div className="text-sm text-zinc-600">Sin datos este mes.</div> : null}
      </div>
    </div>
  );
}

