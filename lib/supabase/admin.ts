import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client for trusted server-only contexts (webhooks, cron).
 * Bypasses RLS — only use after authenticating the caller via another mechanism
 * (e.g. an API key whose `created_by` you've already validated).
 *
 * Never import this from a browser bundle or React component file.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
