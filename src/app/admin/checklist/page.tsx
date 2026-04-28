import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ChecklistEditor, type ChecklistTask } from "./ui";

export const dynamic = "force-dynamic";

export default async function AdminChecklistPage() {
  const supabase = await createSupabaseServerClient();
  const { data: tasks } = await supabase
    .from("checklist_tasks")
    .select("id, title, description, sort_order, is_active, is_important")
    .order("sort_order", { ascending: true });

  return <ChecklistEditor initialTasks={(tasks ?? []) as ChecklistTask[]} />;
}

