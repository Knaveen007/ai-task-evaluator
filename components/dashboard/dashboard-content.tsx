"use client"

import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"

interface Task {
  id: string
  title: string
  status: string
  created_at: string
  evaluations: {
    score: number
    is_paid: boolean
  }[]
}

export function DashboardContent({ user, isPremium = false }: { user: User; isPremium?: boolean }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data, error } = await supabase
          .from("tasks")
          .select(`
            id, 
            title, 
            status, 
            created_at,
            evaluations (
              score,
              is_paid
            )
          `)
          .order("created_at", { ascending: false })

        if (error) throw error
        // @ts-ignore
        setTasks(data || [])
      } catch (error) {
        console.error("Error fetching tasks:", error instanceof Error ? error.message : error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <div>
      {/* Header */}
      <header className="border-b border-border/40 bg-card/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">TaskEval</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
            <p className="text-muted-foreground">Manage and review your code evaluations</p>
          </div>
          <Link href="/submit-task">
            <Button size="lg">Submit New Task</Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.length}</div>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.filter((t) => t.status === "completed").length}</div>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.filter((t) => t.status !== "completed").length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks List */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle>Your Tasks</CardTitle>
            <CardDescription>All your submitted tasks and their evaluation status</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-4">No tasks yet. Submit your first task to get started!</p>
                <Link href="/submit-task">
                  <Button>Submit Your First Task</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => {
                  const evaluation = task.evaluations?.[0]
                  const hasFullAccess = isPremium || evaluation?.is_paid
                  return (
                    <Link key={task.id} href={`/task/${task.id}`}>
                      <div className="flex items-center justify-between p-4 rounded-lg border border-border/40 hover:bg-card/50 transition-colors cursor-pointer">
                        <div className="flex-1">
                          <h3 className="font-medium">{task.title}</h3>
                          <div className="flex gap-2 text-sm text-muted-foreground mt-1">
                            <span>{format(new Date(task.created_at), 'MMM d, yyyy')}</span>
                            {evaluation && (
                              <>
                                <span>•</span>
                                <span className={hasFullAccess ? "text-green-500" : "text-orange-500"}>
                                  {hasFullAccess ? "Full Report Unlocked" : "Partial Report Available"}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {evaluation && (
                            <div className="text-right">
                              <div className="text-sm font-medium text-muted-foreground">Score</div>
                              <div className="text-xl font-bold text-primary">{evaluation.score}</div>
                            </div>
                          )}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${task.status === "completed" ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
                              }`}
                          >
                            {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
