import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { mockItems } from "@/lib/mock";
import { getUserFromRequest, jsonError } from "@/lib/server-auth";
import { getSupabaseAnon, hasSupabaseEnv } from "@/lib/supabase";

const itemUpdateSchema = z.object({
  title: z.string().min(1).max(80).optional(),
  description: z.string().min(1).max(2000).optional(),
  price: z.number().nonnegative().optional(),
  category: z.string().optional(),
  condition: z.string().optional(),
  dormitory: z.string().nullable().optional(),
  college: z.string().nullable().optional(),
  handover_location: z.string().min(1).max(160).optional(),
  status: z.enum(["available", "reserved", "sold", "off_shelf"]).optional()
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!hasSupabaseEnv()) {
    const item = mockItems.find((entry) => entry.id === id) ?? mockItems[0];
    return NextResponse.json({ data: item, mock: true });
  }

  const supabase = getSupabaseAnon();
  const { data, error } = await supabase
    .from("items")
    .select("*,item_images(*)")
    .eq("id", id)
    .single();

  if (error) return jsonError(error.message, 404);

  return NextResponse.json({ data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await getUserFromRequest(request);
  if (!auth.user || !auth.supabase) return jsonError(auth.error ?? "Unauthorized.", 401);

  const parsed = itemUpdateSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Invalid item update payload.", 400);

  const updatePayload: Record<string, unknown> = { ...parsed.data };
  const now = new Date().toISOString();
  if (parsed.data.status === "sold") updatePayload.sold_at = now;
  if (parsed.data.status === "reserved") updatePayload.reserved_at = now;
  if (parsed.data.status === "off_shelf") updatePayload.off_shelf_at = now;

  const { data, error } = await auth.supabase
    .from("items")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return jsonError(error.message, 400);

  return NextResponse.json({ data });
}
