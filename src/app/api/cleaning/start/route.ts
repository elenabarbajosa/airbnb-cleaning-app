import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = createSupabaseServiceClient();

  const { data: noteRow } = await supabase.from("next_cleaning_note").select("note").limit(1).maybeSingle();
  const evaNote = noteRow?.note ?? "";

  // Public flow: create a new session each time. (No user auth.)
  const { data: session, error: sessionError } = await supabase
    .from("cleaning_sessions")
    .insert({
      status: "in_progress",
      eva_note: evaNote,
      started_at: new Date().toISOString(),
    })
    .select("id, public_token")
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

  return NextResponse.json({ token: session.public_token });
}

