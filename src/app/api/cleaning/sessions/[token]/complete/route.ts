import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createSupabaseServiceClient();

  const { data: session } = await supabase.from("cleaning_sessions").select("id").eq("public_token", token).maybeSingle();
  if (!session) return new NextResponse("Not found", { status: 404 });

  const { error } = await supabase
    .from("cleaning_sessions")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", session.id);

  if (error) return new NextResponse(error.message, { status: 400 });
  return NextResponse.json({ ok: true });
}

