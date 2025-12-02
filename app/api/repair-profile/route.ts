import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if profile exists
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

    if (profile) {
        return NextResponse.json({ message: "Profile already exists", profile })
    }

    // Create profile
    const { data: newProfile, error } = await supabase
        .from("profiles")
        .insert({
            id: user.id,
            email: user.email,
            display_name: user.user_metadata?.full_name || user.email?.split("@")[0],
        })
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Profile created successfully", profile: newProfile })
}
