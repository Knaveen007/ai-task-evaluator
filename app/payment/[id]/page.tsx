import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PaymentPage } from "@/components/payment/payment-page"

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const resolvedParams = await params
  const evaluationId = resolvedParams.id

  // Get the evaluation
  const { data: evaluation } = await supabase
    .from("evaluations")
    .select("*")
    .eq("id", evaluationId)
    .eq("user_id", user.id)
    .single()

  if (!evaluation) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-card/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-primary">TaskEval</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <PaymentPage evaluation={evaluation} />
      </main>
    </div>
  )
}
