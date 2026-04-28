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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const admin = await requireAdmin(supabase);
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });

  const body = (await req.json().catch(() => null)) as
    | {
        title?: string;
        description?: string | null;
        sort_order?: number;
        is_active?: boolean;
        is_important?: boolean;
      }
    | null;
  if (!body) return new NextResponse("Bad request", { status: 400 });

  const { error } = await supabase
    .from("checklist_tasks")
    .update({
      title: body.title,
      description: body.description,
      sort_order: body.sort_order,
      is_active: body.is_active,
      is_important: body.is_important,
    })
    .eq("id", id);

  if (error) return new NextResponse(error.message, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const admin = await requireAdmin(supabase);
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });

  const { error } = await supabase.from("checklist_tasks").delete().eq("id", id);
  if (error) return new NextResponse(error.message, { status: 400 });
  return NextResponse.json({ ok: true });
}

