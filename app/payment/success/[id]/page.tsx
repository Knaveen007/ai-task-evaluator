import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import stripe from "@/lib/stripe"

export default async function PaymentSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const evaluationId = resolvedParams.id
  const paymentIntentId = typeof resolvedSearchParams.payment_intent === 'string' ? resolvedSearchParams.payment_intent : undefined

  // 1. Get current evaluation status
  const { data: evaluation } = await supabase
    .from("evaluations")
    .select("*")
    .eq("id", evaluationId)
    .eq("user_id", user.id)
    .single()

  if (!evaluation) {
    redirect("/dashboard")
  }

  // 2. If not paid, try to verify with Stripe directly (fallback for webhook)
  if (!evaluation.is_paid && paymentIntentId) {
    try {
      console.log(`Verifying payment ${paymentIntentId} for evaluation ${evaluationId}...`)
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

      if (paymentIntent.status === "succeeded" && paymentIntent.metadata.evaluationId === evaluationId) {
        console.log("Payment verified successfully via Stripe API")

        // Update payment record
        await supabase
          .from("payments")
          .update({ status: "completed" })
          .eq("stripe_payment_intent_id", paymentIntentId)

        // Update evaluation status
        const { error: updateError } = await supabase
          .from("evaluations")
          .update({ is_paid: true })
          .eq("id", evaluationId)

        if (!updateError) {
          // Refresh evaluation data to show correct status in UI
          evaluation.is_paid = true

          // Upgrade user to premium
          const { error: profileError, count } = await supabase
            .from("profiles")
            .update({ is_premium: true })
            .eq("id", user.id)
            .select() // Needed to get count/data back

          if (profileError) {
            console.error("Failed to update profile premium status:", profileError)
          } else {
            console.log("Profile updated to premium. Rows affected:", count)
          }
        } else {
          console.error("Failed to update evaluation status:", updateError)
        }
      }
    } catch (error) {
      console.error("Error verifying payment:", error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-card/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-primary">TaskEval</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <Card className="border-border/40 bg-green-500/10 border-green-500/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <CardTitle className="text-green-500">Payment Successful!</CardTitle>
            <CardDescription>Your full evaluation report has been unlocked</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-lg bg-card/50 border border-border/40">
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground">Evaluation Score</span>
                <span className="text-2xl font-bold text-primary">{evaluation.score}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                You now have access to the complete analysis and all improvement suggestions.
              </p>
            </div>

            <div className="flex gap-4">
              <Link href={`/task/${evaluation.task_id}`} className="flex-1">
                <Button className="w-full">
                  View Full Report
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
