import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Dev-only endpoint to elevate the current authenticated user to pro tier.
// Visit: GET /api/dev/elevate-pro while logged in (development environment only).

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Forbidden outside development" }, { status: 403 })
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser()

  if (userErr) {
    return NextResponse.json({ error: userErr.message }, { status: 400 })
  }
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { error } = await supabase
    .from("user_profiles")
    .update({ tier: "pro" })
    .eq("id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true, tier: "pro", userId: user.id })
}
