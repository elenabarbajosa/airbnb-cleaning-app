import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string; taskId: string }> },
) {
  const { sessionId, taskId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const body = (await _req.json().catch(() => null)) as
    | { is_completed?: boolean; issue_note?: string | null }
    | null;
  if (!body) return new NextResponse("Bad request", { status: 400 });

  const update: Record<string, unknown> = {};
  if (typeof body.is_completed === "boolean") {
    update.is_completed = body.is_completed;
    update.completed_at = body.is_completed ? new Date().toISOString() : null;
  }
  if (body.issue_note !== undefined) {
    update.issue_note = body.issue_note;
  }

  const { error } = await supabase
    .from("cleaning_session_tasks")
    .update(update)
    .eq("id", taskId)
    .eq("session_id", sessionId);

  if (error) return new NextResponse(error.message, { status: 400 });
  return NextResponse.json({ ok: true });
}

