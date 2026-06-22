import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getUserFromRequest, jsonError } from "@/lib/server-auth";

const adminReportUpdateSchema = z.object({
  status: z.enum(["pending", "reviewing", "resolved", "rejected"]),
  admin_note: z.string().max(2000).optional()
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await getUserFromRequest(request);
  if (!auth.user || !auth.supabase) return jsonError(auth.error ?? "Unauthorized.", 401);

  const parsed = adminReportUpdateSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Invalid report update payload.", 400);

  const isHandled = ["resolved", "rejected"].includes(parsed.data.status);
  const { data, error } = await auth.supabase
    .from("reports")
    .update({
      ...parsed.data,
      handled_by: isHandled ? auth.user.id : null,
      handled_at: isHandled ? new Date().toISOString() : null
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return jsonError(error.message, 403);

  return NextResponse.json({ data });
}
