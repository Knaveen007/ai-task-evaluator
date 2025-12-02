"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        router.push("/dashboard")
      } else {
        setIsLoading(false)
      }
    }
    checkUser()
  }, [router, supabase])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-card">
      <nav className="border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-primary">TaskEval</div>
          <div className="flex gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance">AI-Powered Code Evaluation</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
          Get instant, detailed feedback on your coding tasks. Receive AI-driven insights to improve your skills
          efficiently.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/auth/sign-up">
            <Button size="lg" className="text-base">
              Start Free Evaluation
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="text-base bg-transparent">
            Learn More
          </Button>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-lg border border-border/40 bg-card/50">
            <h3 className="text-lg font-semibold mb-3 text-primary">Instant Feedback</h3>
            <p className="text-muted-foreground">Get AI-powered evaluations within seconds of submission</p>
          </div>
          <div className="p-6 rounded-lg border border-border/40 bg-card/50">
            <h3 className="text-lg font-semibold mb-3 text-primary">Detailed Reports</h3>
            <p className="text-muted-foreground">Comprehensive analysis with strengths and improvement areas</p>
          </div>
          <div className="p-6 rounded-lg border border-border/40 bg-card/50">
            <h3 className="text-lg font-semibold mb-3 text-primary">Track Progress</h3>
            <p className="text-muted-foreground">Manage all your evaluations in one professional dashboard</p>
          </div>
        </div>
      </div>
    </main>
  )
}
