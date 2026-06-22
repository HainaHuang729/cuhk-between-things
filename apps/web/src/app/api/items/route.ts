import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { mockItems } from "@/lib/mock";
import { getUserFromRequest, jsonError } from "@/lib/server-auth";
import { getSupabaseAnon, hasSupabaseEnv } from "@/lib/supabase";

const itemCreateSchema = z.object({
  title: z.string().min(1).max(80),
  description: z.string().min(1).max(2000),
  price: z.number().nonnegative(),
  category: z.string(),
  condition: z.string(),
  dormitory: z.string().optional(),
  college: z.string().optional(),
  handover_location: z.string().min(1).max(160)
});

export async function GET(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ data: mockItems, next_cursor: null, mock: true });
  }

  const params = request.nextUrl.searchParams;
  const q = params.get("q");
  const limit = Math.min(Number(params.get("limit") ?? 30), 50);

  const supabase = getSupabaseAnon();
  let query = supabase
    .from("items")
    .select(
      "id,title,description,price,category,condition,dormitory,college,handover_location,status,created_at,item_images(public_url,sort_order)"
    )
    .in("status", ["available", "reserved", "sold"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (q) query = query.textSearch("search_vector", q, { type: "plain" });
  if (params.get("category")) query = query.eq("category", params.get("category"));
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

  const parsed = itemCreateSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Invalid item payload.", 400);

  const { data, error } = await auth.supabase
    .from("items")
    .insert({
      ...parsed.data,
      seller_id: auth.user.id
    })
    .select("*")
    .single();

  if (error) return jsonError(error.message, 400);

  return NextResponse.json({ data }, { status: 201 });
}
