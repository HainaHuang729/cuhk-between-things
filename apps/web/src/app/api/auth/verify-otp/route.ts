import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { isCuhkEmail } from "@/lib/constants";
import { getSupabaseAnon, hasSupabaseEnv } from "@/lib/supabase";

const verifyOtpSchema = z.object({
  email: z.string().email(),
  token: z.string().min(4).max(12)
});

export async function POST(request: NextRequest) {
  const parsed = verifyOtpSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid verification payload." }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  if (!isCuhkEmail(email)) {
    return NextResponse.json(
      { error: "Only CUHK email addresses are allowed." },
      { status: 403 }
    );
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({
      ok: true,
      mock: true,
      session: { access_token: "mock-access-token" },
      user: { id: "mock-user", email }
    });
  }

  const supabase = getSupabaseAnon();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: parsed.data.token,
    type: "email"
  });

  if (error || !data.session || !data.user) {
    return NextResponse.json(
      { error: error?.message ?? "Unable to verify email." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    session: data.session,
    user: {
      id: data.user.id,
      email: data.user.email
    }
  });
}
