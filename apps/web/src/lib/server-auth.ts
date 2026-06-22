import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSupabaseForToken, hasSupabaseEnv } from "@/lib/supabase";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function getBearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

export async function getUserFromRequest(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    return { user: null, error: "Supabase environment is not configured." };
  }

  const token = getBearerToken(request);
  if (!token) {
    return { user: null, error: "Missing bearer token." };
  }

  const supabase = getSupabaseForToken(token);
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return { user: null, error: "Invalid session." };
  }

  return { user: data.user, error: null, supabase };
}
