import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function PATCH(_req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const body = (await _req.json().catch(() => null)) as { maid_general_note?: string | null } | null;
  if (!body) return new NextResponse("Bad request", { status: 400 });

  const { error } = await supabase
    .from("cleaning_sessions")
    .update({ maid_general_note: body.maid_general_note ?? "" })
    .eq("id", sessionId);

  if (error) return new NextResponse(error.message, { status: 400 });
  return NextResponse.json({ ok: true });
}

