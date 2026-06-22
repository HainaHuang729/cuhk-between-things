import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest, jsonError } from "@/lib/server-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await getUserFromRequest(request);
  if (!auth.user || !auth.supabase) return jsonError(auth.error ?? "Unauthorized.", 401);

  const { data, error } = await auth.supabase
    .from("group_participants")
    .update({
      status: "left",
      left_at: new Date().toISOString()
    })
    .eq("group_id", id)
    .eq("user_id", auth.user.id)
    .select("*")
    .single();

  if (error) return jsonError(error.message, 400);

  return NextResponse.json({ data });
}
