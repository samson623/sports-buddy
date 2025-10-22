import Stripe from "stripe"
import { NextRequest, NextResponse } from "next/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder")

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (!session || session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 })
    }

    // Extract tier from metadata
    const tier = session.metadata?.tier || "plus"

    return NextResponse.json({ tier })
  } catch (error) {
    console.error("Verify session error:", error)
    return NextResponse.json(
      { error: "Failed to verify session" },
      { status: 500 }
    )
  }
}
