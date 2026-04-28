import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function requireAdmin(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return null;
  return user;
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const admin = await requireAdmin(supabase);
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });

  const body = (await req.json().catch(() => null)) as { id?: string | null; note?: string } | null;
  if (!body || body.note === undefined) return new NextResponse("Bad request", { status: 400 });

  if (body.id) {
    const { error } = await supabase.from("next_cleaning_note").update({ note: body.note }).eq("id", body.id);
    if (error) return new NextResponse(error.message, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase.from("next_cleaning_note").insert({ note: body.note });
  if (error) return new NextResponse(error.message, { status: 400 });
  return NextResponse.json({ ok: true });
}

