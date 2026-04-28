import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CleaningSessionClient } from "@/app/maid/cleaning/[id]/ui";

export const dynamic = "force-dynamic";

export default async function MaidCleaningPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("maid");
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: session } = await supabase
    .from("cleaning_sessions")
    .select("id, status, eva_note, maid_general_note, started_at, completed_at")
    .eq("id", id)
    .maybeSingle();

  if (!session) notFound();

  const { data: tasks } = await supabase
    .from("cleaning_session_tasks")
    .select("id, title, description, sort_order, is_important, is_completed, completed_at, issue_note")
    .eq("session_id", id)
    .order("sort_order", { ascending: true });

  return (
    <CleaningSessionClient
      session={{
        id: session.id,
        status: session.status as "in_progress" | "completed",
        eva_note: session.eva_note,
        maid_general_note: session.maid_general_note,
      }}
      tasks={(tasks ?? []).map((t) => ({
        id: t.id as string,
        title: t.title as string,
        description: (t.description ?? null) as string | null,
        is_important: Boolean(t.is_important),
        is_completed: Boolean(t.is_completed),
        issue_note: (t.issue_note ?? null) as string | null,
      }))}
    />
  );
}

