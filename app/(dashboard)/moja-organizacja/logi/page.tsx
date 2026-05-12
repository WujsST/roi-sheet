import { redirect } from "next/navigation"
import { getCurrentRole } from "@/lib/auth/role"
import { createClient } from "@/lib/supabase/server"
import { Activity, CheckCircle2, XCircle, Clock } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { pl } from "date-fns/locale"

export const dynamic = "force-dynamic"

interface LogRow {
  id: string
  execution_id: string
  workflow_id: string
  status: string
  started_at: string
  stopped_at: string | null
  workflow_name: string | null
}

export default async function MyOrgLogsPage() {
  const role = await getCurrentRole()
  if (role.role === "admin") redirect("/logs")
  if (role.role === "unassigned" || !role.clientId) redirect("/pending")

  const supabase = await createClient()

  // Pobierz workflow_ids automatyzacji tej firmy
  const { data: automations } = await supabase
    .from("automations")
    .select("workflow_id, name")
    .eq("client_id", role.clientId)

  const workflowIds = (automations || []).map((a) => a.workflow_id as string).filter(Boolean)
  const automationMap = new Map(
    (automations || []).map((a) => [a.workflow_id as string, a.name as string]),
  )

  let logs: LogRow[] = []
  if (workflowIds.length > 0) {
    const { data, error } = await supabase
      .from("executions_raw")
      .select("id, execution_id, workflow_id, status, started_at, stopped_at")
      .in("workflow_id", workflowIds)
      .order("created_at", { ascending: false })
      .limit(100)
    if (error) throw error
    logs = (data || []).map((e) => ({
      ...(e as LogRow),
      workflow_name: automationMap.get((e as LogRow).workflow_id) || null,
    }))
  }

  const successCount = logs.filter((l) => l.status === "success").length
  const errorCount = logs.filter((l) => l.status === "error").length

  return (
    <div className="space-y-8 pb-20 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold text-white font-display tracking-tight flex items-center gap-3">
          <Activity className="h-8 w-8 text-text-muted" />
          Logi {role.clientName}
        </h1>
        <p className="text-text-muted mt-2 font-mono text-xs uppercase tracking-widest">
          Historia wykonań automatyzacji Twojej organizacji
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
          <div className="text-xs text-text-muted font-mono uppercase mb-1">Łącznie</div>
          <div className="text-2xl font-bold text-white font-display">{logs.length}</div>
        </div>
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
          <div className="text-xs text-green-400/70 font-mono uppercase mb-1">Sukces</div>
          <div className="text-2xl font-bold text-green-400 font-display">{successCount}</div>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="text-xs text-red-400/70 font-mono uppercase mb-1">Błędy</div>
          <div className="text-2xl font-bold text-red-400 font-display">{errorCount}</div>
        </div>
      </div>

      <div className="flex-1 rounded-2xl border border-white/10 bg-[#050505] overflow-hidden flex flex-col shadow-2xl">
        <div className="bg-[#0a0a0a] border-b border-white/5 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-brand-accent" />
            <span className="text-sm font-mono text-white font-bold">n8n Execution Logs</span>
          </div>
          <span className="text-[10px] font-mono text-text-muted">{logs.length} egzekucji</span>
        </div>
        <div className="flex-1 overflow-auto">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-text-muted">
              <Activity className="h-12 w-12 mb-4" />
              <p className="font-mono">Brak egzekucji.</p>
            </div>
          ) : (
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead className="text-text-muted uppercase tracking-wider sticky top-0 bg-[#050505] z-10">
                <tr>
                  <th className="pb-4 pt-4 px-4 w-52">Czas</th>
                  <th className="pb-4 pt-4 px-4 w-28">Status</th>
                  <th className="pb-4 pt-4 px-4">Workflow</th>
                  <th className="pb-4 pt-4 px-4 w-24">Czas trwania</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log) => {
                  const dur =
                    log.stopped_at
                      ? new Date(log.stopped_at).getTime() - new Date(log.started_at).getTime()
                      : null
                  const durStr =
                    dur === null
                      ? "—"
                      : dur < 1000
                        ? `${dur}ms`
                        : dur < 60000
                          ? `${(dur / 1000).toFixed(1)}s`
                          : `${(dur / 60000).toFixed(1)}min`
                  return (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4">
                        <div className="text-white text-sm">
                          {format(new Date(log.started_at), "dd MMM yyyy, HH:mm:ss", { locale: pl })}
                        </div>
                        <div className="text-text-muted text-[10px]">
                          {formatDistanceToNow(new Date(log.started_at), {
                            addSuffix: true,
                            locale: pl,
                          })}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {log.status === "success" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 font-bold text-xs">
                            <CheckCircle2 className="h-3 w-3" /> SUCCESS
                          </span>
                        ) : log.status === "error" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 font-bold text-xs">
                            <XCircle className="h-3 w-3" /> ERROR
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 font-bold text-xs">
                            <Clock className="h-3 w-3" /> {log.status.toUpperCase()}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-white font-bold">
                          {log.workflow_name || "Nieznany workflow"}
                        </div>
                        <div className="text-text-muted text-[10px]">
                          ID: {log.workflow_id.slice(0, 12)}…
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-white font-bold">{durStr}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
