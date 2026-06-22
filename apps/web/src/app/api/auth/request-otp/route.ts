import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { isCuhkEmail } from "@/lib/constants";
import { getSupabaseAnon, hasSupabaseEnv } from "@/lib/supabase";

const requestOtpSchema = z.object({
  email: z.string().email()
});

export async function POST(request: NextRequest) {
  const parsed = requestOtpSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  if (!isCuhkEmail(email)) {
    return NextResponse.json(
      { error: "Only CUHK email addresses are allowed." },
      { status: 403 }
    );
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({ ok: true, mock: true });
  }

  const supabase = getSupabaseAnon();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true
    }
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
