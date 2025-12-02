// FIXED: Proper payment API with error handling

import { createClient } from "@/lib/supabase/server"
import stripe from "@/lib/stripe"
import { type NextRequest, NextResponse } from "next/server"

interface PaymentRequest {
  evaluationId: string
  amount: number
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // FIXED: Proper validation
    let body: PaymentRequest
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { evaluationId, amount } = body

    // FIXED: Comprehensive validation
    if (!evaluationId) {
      return NextResponse.json({ error: "Evaluation ID is required" }, { status: 400 })
    }

    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 })
    }

    // FIXED: Verify evaluation exists and belongs to user
    const { data: evaluation, error: evalError } = await supabase
      .from("evaluations")
      .select("*")
      .eq("id", evaluationId)
      .eq("user_id", user.id)
      .single()

    if (evalError || !evaluation) {
      return NextResponse.json({ error: "Evaluation not found" }, { status: 404 })
    }

    if (evaluation.is_paid) {
      return NextResponse.json({ error: "Evaluation is already paid" }, { status: 400 })
    }

    // Check if user is premium
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("id", user.id)
      .single()

    if (profile?.is_premium) {
      // If premium, we should just mark this evaluation as paid if it isn't already
      // But ideally the frontend shouldn't have let us get here.
      // Let's return a specific error or handle it gracefully.
      return NextResponse.json({ error: "User is premium. Report should be unlocked." }, { status: 400 })
    }

    // FIXED: Check for existing pending payment to avoid duplicates
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("*")
      .eq("evaluation_id", evaluationId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (existingPayment) {
      try {
        // Verify if the payment intent is still valid in Stripe
        const existingIntent = await stripe.paymentIntents.retrieve(existingPayment.stripe_payment_intent_id)

        if (existingIntent.status !== "canceled" && existingIntent.status !== "succeeded") {
          console.log("Reusing existing payment intent:", existingIntent.id)
          return NextResponse.json({
            clientSecret: existingIntent.client_secret,
            success: true,
          })
        } else {
          // If cancelled or succeeded (but local status is pending), update local status
          await supabase
            .from("payments")
            .update({ status: existingIntent.status === "succeeded" ? "completed" : "cancelled" })
            .eq("id", existingPayment.id)
        }
      } catch (e) {
        console.error("Error checking existing payment intent:", e)
        // Continue to create new payment if check fails
      }
    }

    // FIXED: Proper error handling for Stripe
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "usd",
        metadata: {
          evaluationId,
          userId: user.id,
        },
        payment_method_types: ["card"],
      })

      // For embedded checkout, we don't need success/cancel URLs as the component handles it
      // But we can add them for future use with redirect-based checkout

      // FIXED: Verify payment record creation
      const { error: paymentError } = await supabase.from("payments").insert({
        user_id: user.id,
        evaluation_id: evaluationId,
        amount,
        currency: "usd",
        stripe_payment_intent_id: paymentIntent.id,
        status: "pending",
      })

      if (paymentError) {
        throw paymentError
      }

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        success: true,
      })
    } catch (stripeError) {
      console.error("Stripe error:", stripeError)
      return NextResponse.json({ error: "Payment processing failed" }, { status: 500 })
    }
  } catch (error) {
    console.error("Payment API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
