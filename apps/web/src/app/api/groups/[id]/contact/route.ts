import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest, jsonError } from "@/lib/server-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await getUserFromRequest(request);
  if (!auth.user || !auth.supabase) return jsonError(auth.error ?? "Unauthorized.", 401);

  const { data, error } = await auth.supabase.rpc("get_group_contact", {
    p_group_id: id
  });

  if (error) return jsonError(error.message, 400);

  return NextResponse.json({ data: data?.[0] ?? null });
}
