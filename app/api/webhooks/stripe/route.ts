import { createClient } from "@/lib/supabase/server"
import Stripe from "stripe"
import { NextRequest, NextResponse } from "next/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder")

// Store processed webhook IDs for idempotency (in production, use a database)
const processedEvents = new Set<string>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const sig = request.headers.get("stripe-signature")

    if (!sig) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 })
    }

    // Verify webhook signature
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err) {
      console.error("Webhook signature verification failed:", err)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    // Check idempotency - skip if already processed
    if (processedEvents.has(event.id)) {
      return NextResponse.json({ received: true })
    }

    processedEvents.add(event.id)

    const supabase = await createClient()

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id
        const tier = session.metadata?.tier || "plus"
        const stripeCustomerId = session.customer as string

        if (userId) {
          // Update user profile with tier and subscription info
          const { error } = await supabase
            .from("user_profiles")
            .update({
              tier: tier as "plus" | "pro",
              stripe_customer_id: stripeCustomerId,
              stripe_subscription_id: session.subscription as string
            })
            .eq("id", userId)

          if (error) {
            console.error("Failed to update user profile:", error)
            return NextResponse.json(
              { error: "Failed to update profile" },
              { status: 500 }
            )
          }
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Find user by stripe_customer_id
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single()

        if (profile) {
          // Determine tier from subscription items
          let tier = "free"
          for (const item of subscription.items.data) {
            const priceId = item.price.id
            if (priceId === process.env.STRIPE_PRICE_ID_PLUS) {
              tier = "plus"
            } else if (priceId === process.env.STRIPE_PRICE_ID_PRO) {
              tier = "pro"
            }
          }

          await supabase
            .from("user_profiles")
            .update({
              tier: tier as "free" | "plus" | "pro",
              stripe_subscription_id: subscription.id
            })
            .eq("id", profile.id)
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Find user and downgrade to free
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single()

        if (profile) {
          await supabase
            .from("user_profiles")
            .update({
              tier: "free",
              stripe_subscription_id: null
            })
            .eq("id", profile.id)
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        // Find user and mark status as past_due
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single()

        if (profile) {
          // You might want to store a status field in user_profiles for this
          console.log(`Payment failed for user ${profile.id}`)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook error" }, { status: 500 })
  }
}
