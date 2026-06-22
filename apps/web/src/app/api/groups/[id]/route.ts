import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { mockGroups } from "@/lib/mock";
import { getUserFromRequest, jsonError } from "@/lib/server-auth";
import { getSupabaseAnon, hasSupabaseEnv } from "@/lib/supabase";

const groupUpdateSchema = z.object({
  title: z.string().min(1).max(80).optional(),
  description: z.string().min(1).max(2000).optional(),
  source_platform: z.string().min(1).max(80).optional(),
  total_price: z.number().nonnegative().nullable().optional(),
  per_person_price: z.number().nonnegative().nullable().optional(),
  target_size: z.number().int().min(2).optional(),
  deadline_at: z.string().datetime().optional(),
  dormitory: z.string().nullable().optional(),
  college: z.string().nullable().optional(),
  handover_location: z.string().min(1).max(160).optional(),
  status: z.enum(["recruiting", "formed", "closed", "cancelled"]).optional()
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!hasSupabaseEnv()) {
    const group = mockGroups.find((entry) => entry.id === id) ?? mockGroups[0];
    return NextResponse.json({ data: group, mock: true });
  }

  const supabase = getSupabaseAnon();
  const { data, error } = await supabase
    .from("groups")
    .select("*")
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

  const parsed = groupUpdateSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Invalid group update payload.", 400);

  const updatePayload: Record<string, unknown> = { ...parsed.data };
  const now = new Date().toISOString();
  if (parsed.data.status === "closed") updatePayload.closed_at = now;
  if (parsed.data.status === "cancelled") updatePayload.cancelled_at = now;

  const { data, error } = await auth.supabase
    .from("groups")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return jsonError(error.message, 400);

  return NextResponse.json({ data });
}
