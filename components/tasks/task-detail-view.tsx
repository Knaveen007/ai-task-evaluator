"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"

interface Task {
  id: string
  title: string
  code_snippet: string
  description: string
  language: string
  status: string
  created_at: string
}

interface Evaluation {
  id: string
  score: number
  strengths: string[]
  improvements: string[]
  full_report: string
  is_paid: boolean
  created_at: string
}

export function TaskDetailView({
  task,
  evaluation: initialEvaluation,
  isPremium = false,
}: {
  task: Task
  evaluation?: Evaluation
  isPremium?: boolean
}) {
  const [evaluation, setEvaluation] = useState(initialEvaluation)
  const [isLoading, setIsLoading] = useState(!initialEvaluation && (task.status === "pending" || task.status === "completed"))
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    console.log("TaskDetailView loaded for task:", task.id, "status:", task.status, "evaluation:", initialEvaluation?.id, "is_paid:", initialEvaluation?.is_paid)
    if (!initialEvaluation && (task.status === "pending" || task.status === "completed")) {
      evaluateTask()
    }
  }, [task.id])

  const evaluateTask = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id }),
      })

      if (!response.ok) {
        throw new Error("Evaluation failed")
      }

      const data = await response.json()
      setEvaluation(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const hasFullAccess = isPremium || evaluation?.is_paid

  return (
    <div className="space-y-6">
      <Link href="/dashboard">
        <Button variant="ghost" className="mb-4">
          ← Back to Dashboard
        </Button>
      </Link>

      <Card className="border-border/40">
        <CardHeader>
          <CardTitle>{task.title}</CardTitle>
          <CardDescription>Submitted on {format(new Date(task.created_at), 'MMM d, yyyy')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {task.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{task.description}</p>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-2">Code ({task.language})</h3>
            <pre className="bg-card/50 border border-border/40 rounded-lg p-4 overflow-x-auto">
              <code className="text-sm">{task.code_snippet}</code>
            </pre>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card className="border-border/40">
          <CardContent className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
              <p className="text-muted-foreground">Evaluating your code with AI...</p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-border/40">
          <CardContent className="py-6">
            <div className="p-4 rounded-lg bg-destructive/10 text-destructive">{error}</div>
            <Button onClick={evaluateTask} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : evaluation ? (
        <>
          {/* Score Card */}
          <Card className="border-border/40 bg-card/50">
            <CardHeader>
              <CardTitle>Evaluation Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="text-6xl font-bold text-primary">{evaluation.score}</div>
                <div>
                  <p className="text-muted-foreground">out of 100</p>
                  <p className="text-sm mt-2">
                    {evaluation.score >= 80 && "Excellent work!"}
                    {evaluation.score >= 60 && evaluation.score < 80 && "Good effort, room for improvement"}
                    {evaluation.score >= 40 && evaluation.score < 60 && "Keep practicing"}
                    {evaluation.score < 40 && "Needs significant improvement"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strengths */}
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="text-accent">Strengths</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {evaluation.strengths && evaluation.strengths.length > 0 ? (
                  evaluation.strengths.map((strength, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="text-accent mt-1">✓</span>
                      <span>{strength}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-muted-foreground">No strengths identified</p>
                )}
              </ul>
            </CardContent>
          </Card>

          {/* Improvements */}
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="text-orange-500">Areas for Improvement</CardTitle>
            </CardHeader>
            <CardContent>
              {!hasFullAccess ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-3">
                      Detailed improvements and full report are available to premium members
                    </p>
                    <Link href={`/payment/${evaluation.id}`}>
                      <Button>Unlock Full Report</Button>
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {evaluation.improvements &&
                      evaluation.improvements.slice(0, 2).map((improvement, idx) => (
                        <li key={idx} className="flex gap-3">
                          <span className="text-orange-500 mt-1">→</span>
                          <span className="text-sm text-muted-foreground">{improvement}</span>
                        </li>
                      ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +{Math.max(0, (evaluation.improvements?.length || 0) - 2)} more suggestions available
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {evaluation.improvements &&
                    evaluation.improvements.map((improvement, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="text-orange-500 mt-1">→</span>
                        <span>{improvement}</span>
                      </li>
                    ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Full Report Preview */}
          {!hasFullAccess && (
            <Card className="border-border/40 bg-card/50">
              <CardHeader>
                <CardTitle className="text-sm">Full Report Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground text-sm line-clamp-3">{evaluation.full_report}</div>
                <Link href={`/payment/${evaluation.id}`} className="block mt-4">
                  <Button variant="outline" className="w-full bg-transparent">
                    Unlock Complete Analysis
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {hasFullAccess && (
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle>Complete Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert max-w-none text-foreground">
                  <p className="whitespace-pre-wrap">{evaluation.full_report}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card className="border-border/40">
          <CardContent className="py-6">
            <p className="text-muted-foreground mb-4">
              {task.status === "failed" ? "Evaluation failed. Please try again." : "No evaluation available yet."}
            </p>
            {task.status === "failed" && <Button onClick={evaluateTask}>Retry Evaluation</Button>}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
