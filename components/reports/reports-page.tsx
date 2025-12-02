"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { format } from "date-fns"

interface Evaluation {
  id: string
  score: number
  created_at: string
  is_paid: boolean
  tasks?: {
    id: string
    title: string
    language: string
  }
}

export function ReportsPage({ evaluations: initialEvaluations }: { evaluations: Evaluation[] }) {
  const [evaluations, setEvaluations] = useState(initialEvaluations)
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "unpaid">("all")
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "highest-score" | "lowest-score">("newest")
  const router = useRouter()
  const supabase = createClient()

  const filteredAndSorted = evaluations
    .filter((e) => {
      if (filterStatus === "paid") return e.is_paid
      if (filterStatus === "unpaid") return !e.is_paid
      return true
    })
    .sort((a, b) => {
      switch (sortOrder) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "highest-score":
          return b.score - a.score
        case "lowest-score":
          return a.score - b.score
        default:
          return 0
      }
    })

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const stats = {
    total: evaluations.length,
    paid: evaluations.filter((e) => e.is_paid).length,
    unpaid: evaluations.filter((e) => !e.is_paid).length,
    averageScore:
      evaluations.length > 0 ? Math.round(evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length) : 0,
  }

  return (
    <div className="space-y-8">
      {/* Header with Logout */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold mb-2">Reports</h2>
          <p className="text-muted-foreground">Manage and review all your evaluations</p>
        </div>
        <Button variant="ghost" onClick={handleLogout}>
          Sign Out
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unlocked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.paid}</div>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Locked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.unpaid}</div>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.averageScore}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Sort */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle>Filter & Sort</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <div className="flex gap-2 flex-wrap">
                {["all", "paid", "unpaid"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status as any)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filterStatus === status
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Sort By</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest-score">Highest Score</option>
                <option value="lowest-score">Lowest Score</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle>Your Evaluations</CardTitle>
          <CardDescription>
            {filteredAndSorted.length} report{filteredAndSorted.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAndSorted.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-4">No reports found</p>
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAndSorted.map((evaluation) => (
                <Link key={evaluation.id} href={`/task/${evaluation.tasks?.id}`}>
                  <div className="p-4 rounded-lg border border-border/40 hover:bg-card/50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium mb-1">{evaluation.tasks?.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {evaluation.tasks?.language?.toUpperCase()} •{" "}
                          {format(new Date(evaluation.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">{evaluation.score}</div>
                          <p className="text-xs text-muted-foreground">out of 100</p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            evaluation.is_paid ? "bg-accent/20 text-accent" : "bg-orange-500/20 text-orange-500"
                          }`}
                        >
                          {evaluation.is_paid ? "Unlocked" : "Locked"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
