import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { mockGroups } from "@/lib/mock";
import { getUserFromRequest, jsonError } from "@/lib/server-auth";
import { getSupabaseAnon, hasSupabaseEnv } from "@/lib/supabase";

const groupCreateSchema = z.object({
  title: z.string().min(1).max(80),
  description: z.string().min(1).max(2000),
  source_platform: z.string().min(1).max(80),
  total_price: z.number().nonnegative().optional(),
  per_person_price: z.number().nonnegative().optional(),
  target_size: z.number().int().min(2),
  deadline_at: z.string().datetime(),
  dormitory: z.string().optional(),
  college: z.string().optional(),
  handover_location: z.string().min(1).max(160)
});

export async function GET(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ data: mockGroups, next_cursor: null, mock: true });
  }

  const params = request.nextUrl.searchParams;
  const limit = Math.min(Number(params.get("limit") ?? 30), 50);
  const supabase = getSupabaseAnon();

  let query = supabase
    .from("groups")
    .select("*")
    .in("status", ["recruiting", "formed", "closed"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (params.get("source_platform")) {
    query = query.ilike("source_platform", `%${params.get("source_platform")}%`);
  }
  if (params.get("dormitory")) query = query.eq("dormitory", params.get("dormitory"));
  if (params.get("college")) query = query.eq("college", params.get("college"));
  if (params.get("status")) query = query.eq("status", params.get("status"));

  const { data, error } = await query;
  if (error) return jsonError(error.message, 400);

  return NextResponse.json({ data, next_cursor: null });
}

export async function POST(request: NextRequest) {
  const auth = await getUserFromRequest(request);
  if (!auth.user || !auth.supabase) return jsonError(auth.error ?? "Unauthorized.", 401);

  const parsed = groupCreateSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Invalid group payload.", 400);

  const { data, error } = await auth.supabase
    .from("groups")
    .insert({
      ...parsed.data,
      leader_id: auth.user.id
    })
    .select("*")
    .single();

  if (error) return jsonError(error.message, 400);

  return NextResponse.json({ data }, { status: 201 });
}
