import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TaskDetailView } from "@/components/tasks/task-detail-view"

export const dynamic = "force-dynamic"

export default async function TaskDetailPage({
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
  const taskId = resolvedParams.id

  // Get the task
  const { data: task } = await supabase.from("tasks").select("*").eq("id", taskId).eq("user_id", user.id).single()

  if (!task) {
    redirect("/dashboard")
  }

  // Get the evaluation if it exists
  const { data: evaluation } = await supabase.from("evaluations").select("*").eq("task_id", taskId).single()

  // Get user profile for premium status
  const { data: profile } = await supabase.from("profiles").select("is_premium").eq("id", user.id).single()
  const isPremium = profile?.is_premium || false

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-card/50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-primary">TaskEval</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <TaskDetailView task={task} evaluation={evaluation} isPremium={isPremium} />
      </main>
    </div>
  )
}
