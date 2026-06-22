import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getUserFromRequest, jsonError } from "@/lib/server-auth";

const imageSchema = z.object({
  storage_path: z.string().min(1),
  public_url: z.string().url().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  sort_order: z.number().int().min(1).max(9).default(1)
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await getUserFromRequest(request);
  if (!auth.user || !auth.supabase) return jsonError(auth.error ?? "Unauthorized.", 401);

  const parsed = imageSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Invalid image payload.", 400);

  const { data, error } = await auth.supabase
    .from("item_images")
    .insert({
      ...parsed.data,
      item_id: id
    })
    .select("*")
    .single();

  if (error) return jsonError(error.message, 400);

  return NextResponse.json({ data }, { status: 201 });
}
