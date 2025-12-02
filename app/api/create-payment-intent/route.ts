import { createClient } from "@/lib/supabase/server"
import stripe from "@/lib/stripe"
import { type NextRequest, NextResponse } from "next/server"

const UNLOCK_PRICE_CENTS = 999 // $9.99

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { evaluationId } = await request.json()

    if (!evaluationId) {
      return NextResponse.json({ error: "Evaluation ID required" }, { status: 400 })
    }

    // Get the evaluation
    const { data: evaluation, error: evalError } = await supabase
      .from("evaluations")
      .select("*")
      .eq("id", evaluationId)
      .eq("user_id", user.id)
      .single()

    if (evalError || !evaluation) {
      return NextResponse.json({ error: "Evaluation not found" }, { status: 404 })
    }

    // Check if already paid
    if (evaluation.is_paid) {
      return NextResponse.json({ error: "This evaluation has already been unlocked" }, { status: 400 })
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: UNLOCK_PRICE_CENTS,
      currency: "usd",
      metadata: {
        evaluationId,
        userId: user.id,
      },
    })

    // Save payment record
    await supabase.from("payments").insert({
      user_id: user.id,
      evaluation_id: evaluationId,
      amount: UNLOCK_PRICE_CENTS,
      currency: "usd",
      stripe_payment_intent_id: paymentIntent.id,
      status: "pending",
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    })
  } catch (error) {
    console.error("Payment intent error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Payment failed" }, { status: 500 })
  }
}
