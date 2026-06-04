import { createBrowserClient } from '@supabase/ssr'

// Browsers reject fetch() if any header value contains non-ISO-8859-1 characters.
// Supabase may forward cookie-stored session data (which can include Korean names
// in user_metadata) into headers. This wrapper strips the problematic characters.
const safeFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  if (init?.headers && !(init.headers instanceof Headers)) {
    const safe: Record<string, string> = {}
    for (const [k, v] of Object.entries(init.headers as Record<string, string>)) {
      safe[k] = typeof v === 'string' ? v.replace(/[^\x00-\xFF]/g, '') : v
    }
    return fetch(input, { ...init, headers: safe })
  }
  return fetch(input, init)
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { fetch: safeFetch } }
  )
}
