
"use client"

import { useEffect, useState, useMemo } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Evaluation {
  id: string
  score: number
  is_paid: boolean
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "")

function CheckoutForm({ evaluationId }: { evaluationId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)

    console.log("Confirming payment with return_url:", `${window.location.origin}/payment/success/${evaluationId}`)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success/${evaluationId}`,
      },
    })

    if (error) {
      console.error("Stripe confirm error object:", error)
      console.error("Stripe confirm error details:", {
        message: error.message,
        type: error.type,
        code: error.code,
        decline_code: error.decline_code,
      })
      setMessage(error.message || "An unexpected error occurred.")
    }

    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {message && <div className="text-red-500 text-sm">{message}</div>}
      <Button disabled={isLoading || !stripe || !elements} className="w-full">
        {isLoading ? "Processing..." : "Pay Now"}
      </Button>
    </form>
  )
}

export function PaymentPage({ evaluation }: { evaluation: Evaluation }) {
  const [clientSecret, setClientSecret] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log("Payment page loaded for evaluation:", evaluation.id, "is_paid:", evaluation.is_paid)

    const createPaymentIntent = async () => {
      try {
        const response = await fetch("/api/refactored-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            evaluationId: evaluation.id,
            amount: 2900, // $29.00
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to create payment intent")
        }

        const data = await response.json()
        console.log("Payment intent created successfully:", data.clientSecret ? "Yes" : "No")
        if (data.clientSecret) {
          setClientSecret(data.clientSecret)
        }
      } catch (err) {
        console.error("Payment intent error:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    if (!evaluation.is_paid && !clientSecret) {
      createPaymentIntent()
    } else if (evaluation.is_paid) {
      setIsLoading(false)
    }
  }, [evaluation.id, evaluation.is_paid])

  const options = useMemo(() => ({
    clientSecret,
    appearance: {
      theme: 'night' as const,
    },
  }), [clientSecret])

  if (evaluation.is_paid) {
    return (
      <div className="space-y-6">
        <Card className="border-border/40 bg-green-500/10 border-green-500/20">
          <CardHeader>
            <CardTitle className="text-green-500">Already Unlocked</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">You have already unlocked the full report for this evaluation.</p>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-border/40">
        <CardContent className="py-6">
          <div className="p-4 rounded-lg bg-destructive/10 text-destructive mb-4">{error}</div>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle>Unlock Full Report</CardTitle>
          <CardDescription>Get complete analysis and all improvement suggestions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-lg bg-card/50 border border-border/40">
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">Evaluation Score</span>
              <span className="text-2xl font-bold text-primary">{evaluation.score}</span>
            </div>
            <p className="text-sm text-muted-foreground">Unlock detailed analysis and personalized recommendations</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>
          ) : clientSecret ? (
            <Elements stripe={stripePromise} options={options} key={clientSecret}>
              <CheckoutForm evaluationId={evaluation.id} />
            </Elements>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Payment form could not be loaded.</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
