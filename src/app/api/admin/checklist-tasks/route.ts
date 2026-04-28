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

  const body = (await req.json().catch(() => null)) as
    | { title: string; description?: string | null; sort_order?: number; is_active?: boolean; is_important?: boolean }
    | null;
  if (!body?.title) return new NextResponse("Bad request", { status: 400 });

  const { data, error } = await supabase
    .from("checklist_tasks")
    .insert({
      title: body.title,
      description: body.description ?? null,
      sort_order: body.sort_order ?? 0,
      is_active: body.is_active ?? true,
      is_important: body.is_important ?? false,
    })
    .select("id, title, description, sort_order, is_active, is_important")
    .single();

  if (error) return new NextResponse(error.message, { status: 400 });
  return NextResponse.json(data);
}

