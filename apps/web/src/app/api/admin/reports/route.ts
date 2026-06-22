import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest, jsonError } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  const auth = await getUserFromRequest(request);
  if (!auth.user || !auth.supabase) return jsonError(auth.error ?? "Unauthorized.", 401);

  const { data, error } = await auth.supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return jsonError(error.message, 403);

  return NextResponse.json({ data });
}
