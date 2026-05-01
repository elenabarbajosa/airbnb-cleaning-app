import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ token: string; taskId: string }> }) {
  const { token, taskId } = await params;
  const body = (await req.json().catch(() => null)) as { is_completed?: boolean; issue_note?: string | null } | null;
  if (!body) return new NextResponse("Bad request", { status: 400 });

  const supabase = createSupabaseServiceClient();

  const { data: session } = await supabase.from("cleaning_sessions").select("id").eq("public_token", token).maybeSingle();
  if (!session) return new NextResponse("Not found", { status: 404 });

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
    .eq("session_id", session.id);

  if (error) return new NextResponse(error.message, { status: 400 });
  return NextResponse.json({ ok: true });
}

