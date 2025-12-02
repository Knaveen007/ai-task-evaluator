import { createClient } from "@/lib/supabase/server"
import { evaluateCodeWithAI } from "@/lib/ai/ollama"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  let taskId: string | null = null
  let supabase

  try {
    supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    taskId = body.taskId

    if (!taskId) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 })
    }

    // Get the task
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .eq("user_id", user.id)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Check if evaluation already exists
    const { data: existingEvaluation } = await supabase
      .from("evaluations")
      .select("*")
      .eq("task_id", taskId)
      .single()

    if (existingEvaluation) {
      console.log("Evaluation already exists for task:", taskId)
      // Ensure task status is completed
      if (task.status !== "completed") {
        await supabase.from("tasks").update({ status: "completed" }).eq("id", taskId)
      }
      return NextResponse.json(existingEvaluation, { status: 200 })
    }

    // Update task status to evaluating
    await supabase.from("tasks").update({ status: "evaluating" }).eq("id", taskId)

    // Evaluate with AI
    console.log("Starting AI evaluation for task:", taskId)
    const evaluation = await evaluateCodeWithAI({
      codeSnippet: task.code_snippet,
      language: task.language,
      description: task.description,
    })
    console.log("AI evaluation completed for task:", taskId)

    // Check if user is premium
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("id", user.id)
      .single()

    const isPremium = profile?.is_premium || false

    // Store the evaluation
    console.log("Creating evaluation for task:", taskId, "with is_paid:", isPremium)
    const { data: savedEvaluation, error: evalError } = await supabase
      .from("evaluations")
      .insert({
        task_id: taskId,
        user_id: user.id,
        score: evaluation.score,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
        full_report: evaluation.fullReport,
        is_paid: isPremium, // Automatically paid if user is premium
      })
      .select()
      .single()

    console.log("Evaluation created:", savedEvaluation?.id, "is_paid:", savedEvaluation?.is_paid)

    if (evalError) {
      console.error("Database error creating evaluation:", evalError)
      // Update task status to failed
      await supabase.from("tasks").update({ status: "failed" }).eq("id", taskId)

      throw evalError
    }

    // Update task status to completed
    await supabase.from("tasks").update({ status: "completed" }).eq("id", taskId)
    console.log("Task status updated to completed for task:", taskId)

    return NextResponse.json(savedEvaluation, { status: 200 })
  } catch (error) {
    console.error("Evaluation API error:", error)

    if (taskId && supabase) {
      try {
        await supabase.from("tasks").update({ status: "failed" }).eq("id", taskId)
        console.log("Task status updated to failed for task:", taskId)
      } catch (statusError) {
        console.error("Failed to update task status:", statusError)
      }
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : "Evaluation failed" }, { status: 500 })
  }
}
