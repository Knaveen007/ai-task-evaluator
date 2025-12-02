import { createClient } from "@/lib/supabase/server"
import stripe from "@/lib/stripe"
import { type NextRequest, NextResponse } from "next/server"

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ""

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 400 },
    )
  }

  const supabase = await createClient()

  // Log the event for debugging
  console.log(`Received Stripe webhook: ${event.type} for ${event.data.object.id}`)

  // Handle payment_intent.succeeded
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object

    const evaluationId = paymentIntent.metadata.evaluationId
    const userId = paymentIntent.metadata.userId

    if (!evaluationId || !userId) {
      console.error("Missing metadata in payment_intent.succeeded:", paymentIntent.metadata)
      return NextResponse.json({ error: "Missing payment metadata" }, { status: 400 })
    }

    // Check if payment is already completed (idempotency)
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("status")
      .eq("stripe_payment_intent_id", paymentIntent.id)
      .single()

    if (existingPayment?.status === "completed") {
      console.log(`Payment ${paymentIntent.id} already processed`)
      return NextResponse.json({ received: true })
    }

    // Update payment status
    const { error: paymentUpdateError } = await supabase
      .from("payments")
      .update({
        status: "completed",
      })
      .eq("stripe_payment_intent_id", paymentIntent.id)

    if (paymentUpdateError) {
      console.error("Failed to update payment status:", paymentUpdateError)
      return NextResponse.json({ error: "Failed to update payment status" }, { status: 500 })
    }

    // Check if evaluation is already paid
    const { data: existingEvaluation } = await supabase
      .from("evaluations")
      .select("is_paid")
      .eq("id", evaluationId)
      .eq("user_id", userId)
      .single()

    if (existingEvaluation?.is_paid) {
      console.log(`Evaluation ${evaluationId} already unlocked`)
      return NextResponse.json({ received: true })
    }

    // Update evaluation to mark as paid
    const { error: evaluationUpdateError } = await supabase
      .from("evaluations")
      .update({
        is_paid: true,
      })
      .eq("id", evaluationId)
      .eq("user_id", userId)

    if (evaluationUpdateError) {
      console.error("Failed to update evaluation:", evaluationUpdateError)
      return NextResponse.json({ error: "Failed to unlock evaluation" }, { status: 500 })
    }

    console.log(`Successfully processed payment for evaluation ${evaluationId}`)
  }

  // Handle payment_intent.payment_failed
  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object

    const { error: paymentUpdateError } = await supabase
      .from("payments")
      .update({
        status: "failed",
      })
      .eq("stripe_payment_intent_id", paymentIntent.id)

    if (paymentUpdateError) {
      console.error("Failed to update failed payment status:", paymentUpdateError)
    }

    console.log(`Payment failed for payment intent ${paymentIntent.id}`)
  }

  // Handle payment_intent.canceled
  if (event.type === "payment_intent.canceled") {
    const paymentIntent = event.data.object

    const { error: paymentUpdateError } = await supabase
      .from("payments")
      .update({
        status: "cancelled",
      })
      .eq("stripe_payment_intent_id", paymentIntent.id)

    if (paymentUpdateError) {
      console.error("Failed to update cancelled payment status:", paymentUpdateError)
    }

    console.log(`Payment cancelled for payment intent ${paymentIntent.id}`)
  }

  return NextResponse.json({ received: true })
}
