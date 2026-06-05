import { createBrowserClient } from '@supabase/ssr'

// Strip BOM and whitespace that can be introduced by env var tooling
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/^﻿/, '').trim()
const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').replace(/^﻿/, '').trim()

// Browsers reject fetch() if any header value contains non-ISO-8859-1 characters.
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
  return createBrowserClient(supabaseUrl, supabaseKey, {
    global: { fetch: safeFetch },
  })
}
