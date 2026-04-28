import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MaidHome } from "./ui";

export const dynamic = "force-dynamic";

export default async function MaidPage() {
  await requireRole("maid");
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: active } = await supabase
    .from("cleaning_sessions")
    .select("id, started_at")
    .eq("started_by", user.id)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return <MaidHome activeSessionId={active?.id ?? null} />;
}

