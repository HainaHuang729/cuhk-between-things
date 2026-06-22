import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getUserFromRequest, jsonError } from "@/lib/server-auth";

const reportSchema = z.object({
  target_type: z.enum(["item", "group", "user"]),
  target_item_id: z.string().uuid().optional(),
  target_group_id: z.string().uuid().optional(),
  target_user_id: z.string().uuid().optional(),
  reason: z.enum(["scam", "fake_item", "harassment", "inappropriate", "other"]),
  description: z.string().max(2000).optional()
});

export async function POST(request: NextRequest) {
  const auth = await getUserFromRequest(request);
  if (!auth.user || !auth.supabase) return jsonError(auth.error ?? "Unauthorized.", 401);

  const parsed = reportSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Invalid report payload.", 400);

  const { data, error } = await auth.supabase
    .from("reports")
    .insert({
      ...parsed.data,
      reporter_id: auth.user.id
    })
    .select("*")
    .single();

  if (error) return jsonError(error.message, 400);

  return NextResponse.json({ data }, { status: 201 });
}
