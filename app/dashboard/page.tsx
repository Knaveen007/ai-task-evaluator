import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardContent } from "@/components/dashboard/dashboard-content"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("is_premium").eq("id", user.id).single()
  const isPremium = profile?.is_premium || false

  return (
    <div className="min-h-screen bg-background">
      <DashboardContent user={user} isPremium={isPremium} />
    </div>
  )
}
