import { notFound } from "next/navigation";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { PublicCleaningSessionClient } from "./ui";

export const dynamic = "force-dynamic";

export default async function PublicCleaningSessionPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createSupabaseServiceClient();

  const { data: session } = await supabase
    .from("cleaning_sessions")
    .select("id, status, eva_note, maid_general_note")
    .eq("public_token", token)
    .maybeSingle();

  if (!session) notFound();

  const { data: tasks } = await supabase
    .from("cleaning_session_tasks")
    .select("id, title, description, sort_order, is_important, is_completed, issue_note")
    .eq("session_id", session.id)
    .order("sort_order", { ascending: true });

  return (
    <PublicCleaningSessionClient
      token={token}
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

