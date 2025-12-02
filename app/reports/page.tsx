import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ReportsPage } from "@/components/reports/reports-page"

export default async function Page() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get all evaluations with their tasks
  const { data: evaluations } = await supabase
    .from("evaluations")
    .select(`
      id,
      score,
      created_at,
      is_paid,
      tasks (
        id,
        title,
        language
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-card/50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-primary">TaskEval</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <ReportsPage evaluations={evaluations || []} />
      </main>
    </div>
  )
}
