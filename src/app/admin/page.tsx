import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = await createSupabaseServerClient();
  const { data: latest } = await supabase
    .from("cleaning_sessions")
    .select("id, status, started_at, completed_at")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="space-y-4">
      <div className="text-2xl font-semibold tracking-tight">Panel de control</div>
      <Card className="p-4">
        <div className="text-sm font-medium text-zinc-600">Última sesión</div>
        {latest ? (
          <div className="mt-2 flex items-center justify-between gap-3">
            <div>
              <div className="text-base font-semibold">
                {latest.status === "completed" ? "Completado" : "En curso"}
              </div>
              <div className="text-sm text-zinc-600">{new Date(latest.started_at).toLocaleString()}</div>
            </div>
            <Link className="text-sm font-semibold text-sky-700 underline decoration-sky-300" href={`/admin/history/${latest.id}`}>
              Ver
            </Link>
          </div>
        ) : (
          <div className="mt-2 text-sm text-zinc-600">Todavía no hay sesiones.</div>
        )}
      </Card>
    </div>
  );
}

