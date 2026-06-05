import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return allCookies },
          setAll() {},
        },
      }
    )

    let user = null, authError = null
    try {
      const result = await supabase.auth.getUser()
      user = result.data?.user ? { id: result.data.user.id, email: result.data.user.email } : null
      authError = result.error?.message ?? null
    } catch (e) {
      authError = String(e)
    }

    return NextResponse.json({
      cookieNames: allCookies.map(c => c.name),
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      user,
      authError,
    })
  } catch (e) {
    return NextResponse.json({ fatalError: String(e) })
  }
}
