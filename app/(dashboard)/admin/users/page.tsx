"use client"

import { useEffect, useState } from "react"
import {
  listAllClerkUsers,
  getClientsData,
  assignClerkUserToClient,
  type ClerkUserRow,
} from "@/app/actions"
import type { Client } from "@/lib/supabase/types"
import { UserCog, Mail, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { pl } from "date-fns/locale"

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ClerkUserRow[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assigning, setAssigning] = useState<string | null>(null)

  const refresh = async () => {
    try {
      const [u, c] = await Promise.all([listAllClerkUsers(), getClientsData()])
      setUsers(u)
      setClients(c)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nieznany błąd")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const handleAssign = async (clerkUserId: string, clientId: string) => {
    if (!clientId) return
    setAssigning(clerkUserId)
    try {
      await assignClerkUserToClient({ clerkUserId, clientId })
      await refresh()
    } catch (e) {
      alert(`Nie udało się przypisać: ${e instanceof Error ? e.message : "Nieznany błąd"}`)
    } finally {
      setAssigning(null)
    }
  }

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-white font-display tracking-tight flex items-center gap-3">
          <UserCog className="h-8 w-8 text-text-muted" /> Użytkownicy Clerk
        </h1>
        <p className="text-text-muted mt-2 font-mono text-xs uppercase tracking-widest">
          Przypisuj zarejestrowanych userów do klientów-firm
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
          <div className="flex items-center gap-3 text-red-400">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-bold">Błąd ładowania</p>
              <p className="text-sm text-red-400/70">{error}</p>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-accent mx-auto mb-4" />
          <p className="text-text-muted font-mono">Ładowanie userów...</p>
        </div>
      )}

      {!loading && !error && users.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-12 text-center">
          <UserCog className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-muted font-mono">Brak userów w Clerk</p>
        </div>
      )}

      {!loading && !error && users.length > 0 && (
        <div className="space-y-3">
          {users.map((u) => {
            const assigned = u.assignedClientNames.length > 0
            return (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 hover:border-white/20 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={u.imageUrl}
                    alt=""
                    className="h-12 w-12 rounded-full border border-white/10"
                  />
                  <div>
                    <div className="text-white font-bold font-display">
                      {u.fullName || <span className="text-text-muted">— bez imienia —</span>}
                    </div>
                    <div className="text-xs text-text-muted font-mono flex items-center gap-1.5 mt-1">
                      <Mail className="h-3 w-3" /> {u.email || "—"}
                    </div>
                    <div className="text-[10px] text-text-muted/60 font-mono mt-1">
                      Zarejestrowany: {format(new Date(u.createdAt), "d MMM yyyy", { locale: pl })} • ID: {u.id.slice(0, 14)}…
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 min-w-[280px] justify-end">
                  {assigned ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold font-mono">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {u.assignedClientNames.join(", ")}
                    </div>
                  ) : (
                    <select
                      onChange={(e) => handleAssign(u.id, e.target.value)}
                      disabled={assigning === u.id}
                      defaultValue=""
                      className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm text-white cursor-pointer hover:border-brand-accent/40 focus:border-brand-accent outline-none disabled:opacity-50"
                    >
                      <option value="" disabled>
                        {assigning === u.id ? "Przypisuję…" : "Przypisz do klienta…"}
                      </option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
