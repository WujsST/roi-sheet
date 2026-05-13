import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'

export type UserRole = 'admin' | 'member' | 'unassigned'

export interface CurrentRole {
  userId: string
  role: UserRole
  orgId: string | null
  /** jeśli member, jaką firmę (clients.id) widzi; null dla admin/unassigned */
  clientId: string | null
  /** nazwa firmy klienta (do nagłówków) */
  clientName: string | null
}

/**
 * Wykrywa rolę aktualnie zalogowanego użytkownika Clerk.
 *
 * - `admin`  → `is_admin()` RPC (SECURITY DEFINER → bypassuje RLS na admin_users).
 * - `member` → user ma aktywną Clerk Organization (`orgId` z `auth()`) powiązaną z rekordem `clients.clerk_org_id`.
 * - `unassigned` → zalogowany, ale nie admin i jego org (jeśli ma) nie jest powiązana z żadnym klientem.
 *
 * Wymaga że Clerk JWT template "supabase" zawiera claim `sub` (auto) i `org_id`.
 */
export async function getCurrentRole(): Promise<CurrentRole> {
  const { userId, orgId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const supabase = await createClient()

  // is_admin() = SECURITY DEFINER w SQL → bypassuje policy `admin_users using (false)`.
  // Czyta auth.jwt() ->> 'sub', więc Clerk JWT (Authorization header) musi być valid.
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (isAdmin === true) {
    return { userId, role: 'admin', orgId: orgId || null, clientId: null, clientName: null }
  }

  if (orgId) {
    const { data: client } = await supabase
      .from('clients')
      .select('id, name')
      .eq('clerk_org_id', orgId)
      .maybeSingle()
    if (client) {
      return {
        userId,
        role: 'member',
        orgId,
        clientId: client.id as string,
        clientName: client.name as string,
      }
    }
  }

  return { userId, role: 'unassigned', orgId: orgId || null, clientId: null, clientName: null }
}

/** Throws if not admin. Use w server actions które są tylko dla Dawida. */
export async function requireAdmin(): Promise<CurrentRole> {
  const role = await getCurrentRole()
  if (role.role !== 'admin') throw new Error('Forbidden — admin only')
  return role
}
