import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params
    const evaluationId = resolvedParams.id

    const { data: evaluation, error } = await supabase
      .from("evaluations")
      .select("id, is_paid")
      .eq("id", evaluationId)
      .eq("user_id", user.id)
      .single()

    if (error || !evaluation) {
      return NextResponse.json({ error: "Evaluation not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: evaluation.id,
      is_paid: evaluation.is_paid,
    })
  } catch (error) {
    console.error("Evaluation status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
