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
 * - `admin`  → user_id znajduje się w tabeli `admin_users` (server-side check przez RLS-protected query).
 * - `member` → user ma aktywną Clerk Organization (`orgId` z `auth()`) powiązaną z rekordem `clients.clerk_org_id`.
 * - `unassigned` → zalogowany, ale nie admin i jego org (jeśli ma) nie jest powiązana z żadnym klientem.
 *
 * Wymaga że Clerk JWT template "supabase" zawiera claim `org_id` żeby `current_org_id()` w SQL też widział org.
 */
export async function getCurrentRole(): Promise<CurrentRole> {
  const { userId, orgId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const supabase = await createClient()

  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (adminRow) {
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
