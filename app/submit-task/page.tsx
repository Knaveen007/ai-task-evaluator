import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TaskSubmissionForm } from "@/components/forms/task-submission-form"

export default async function SubmitTaskPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-card/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-primary">TaskEval</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Submit a Coding Task</h2>
          <p className="text-muted-foreground">Paste your code and let our AI evaluate it for you</p>
        </div>

        <TaskSubmissionForm />
      </main>
    </div>
  )
}
