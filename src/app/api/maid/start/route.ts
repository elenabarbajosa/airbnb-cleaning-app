import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  // Prevent multiple in-progress sessions for the same maid.
  const { data: existing } = await supabase
    .from("cleaning_sessions")
    .select("id")
    .eq("started_by", user.id)
    .eq("status", "in_progress")
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    return NextResponse.json({ sessionId: existing.id });
  }

  const { data: noteRow } = await supabase.from("next_cleaning_note").select("note").limit(1).maybeSingle();
  const evaNote = noteRow?.note ?? "";

  const { data: session, error: sessionError } = await supabase
    .from("cleaning_sessions")
    .insert({
      started_by: user.id,
      status: "in_progress",
      eva_note: evaNote,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    return new NextResponse(sessionError?.message ?? "No se pudo crear la sesión", { status: 400 });
  }

  const { data: templateTasks, error: tasksError } = await supabase
    .from("checklist_tasks")
    .select("id, title, description, sort_order, is_important")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (tasksError) {
    return new NextResponse(tasksError.message, { status: 400 });
  }

  if (templateTasks?.length) {
    const rows = templateTasks.map((t) => ({
      session_id: session.id,
      template_task_id: t.id,
      title: t.title,
      description: t.description,
      sort_order: t.sort_order,
      is_important: t.is_important,
      is_completed: false,
    }));

    const { error: insertError } = await supabase.from("cleaning_session_tasks").insert(rows);
    if (insertError) {
      return new NextResponse(insertError.message, { status: 400 });
    }
  }

  return NextResponse.json({ sessionId: session.id });
}

