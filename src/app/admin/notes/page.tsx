import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextNoteEditor } from "./ui";

export const dynamic = "force-dynamic";

export default async function AdminNotesPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("next_cleaning_note").select("id, note").order("id", { ascending: true }).limit(1).maybeSingle();

  return <NextNoteEditor noteId={data?.id ?? null} initialNote={data?.note ?? ""} />;
}

