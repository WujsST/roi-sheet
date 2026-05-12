import { redirect } from "next/navigation"
import { getCurrentRole } from "@/lib/auth/role"
import { createClient } from "@/lib/supabase/server"
import type { Automation } from "@/lib/supabase/types"
import { Workflow, DollarSign, TrendingUp, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function MyOrgAutomationsPage() {
  const role = await getCurrentRole()
  if (role.role === "admin") redirect("/automations")
  if (role.role === "unassigned" || !role.clientId) redirect("/pending")

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("automations_dashboard")
    .select("*")
    .eq("client_id", role.clientId)
    .order("money_saved_pln", { ascending: false })
  if (error) throw error
  const automations = (data || []) as Automation[]

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-white font-display tracking-tight flex items-center gap-3">
          <Workflow className="h-8 w-8 text-text-muted" />
          Automatyzacje {role.clientName}
        </h1>
        <p className="text-text-muted mt-2 font-mono text-xs uppercase tracking-widest">
          Procesy działające dla Twojej organizacji
        </p>
      </div>

      {automations.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-12 text-center">
          <Workflow className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-muted font-mono">Brak automatyzacji.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {automations.map((item) => {
            const uptimePercent = item.status === "healthy" ? 99 : item.status === "error" ? 85 : 0
            return (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0a0a0a] p-5"
              >
                <div className="flex items-center gap-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                    <Workflow className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-white font-display text-lg tracking-tight mb-1">
                      {item.name}
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono text-text-muted">
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-brand-accent/10 border border-brand-accent/20">
                        <DollarSign className="h-3 w-3 text-brand-accent" />
                        <span className="text-brand-accent font-semibold">
                          {item.hourly_rate} PLN/h
                        </span>
                      </span>
                      {item.roi_percentage !== undefined && item.roi_percentage !== null && (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/20">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span className="text-green-500 font-semibold">
                            ROI: {item.roi_percentage.toFixed(0)}%
                          </span>
                        </span>
                      )}
                      {item.executions_count !== undefined && item.saved_hours !== undefined && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          {item.executions_count} exec • {item.saved_hours.toFixed(1)}h
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="hidden md:block w-32">
                    <div className="flex justify-between text-[10px] font-mono text-text-muted mb-1 uppercase tracking-wider">
                      <span>Health</span>
                      <span>{uptimePercent > 0 ? `${uptimePercent}%` : "-"}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          item.status === "healthy"
                            ? "bg-green-500"
                            : item.status === "error"
                              ? "bg-red-500"
                              : "bg-gray-500",
                        )}
                        style={{ width: `${uptimePercent}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-28 text-right">
                    {item.status === "healthy" ? (
                      <>
                        <div className="text-lg font-bold text-brand-success font-display">
                          {(item.money_saved_pln || 0).toFixed(0)} PLN
                        </div>
                        <div className="text-[10px] text-brand-success/70 font-mono uppercase tracking-wider flex items-center justify-end gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Healthy
                        </div>
                      </>
                    ) : item.status === "error" ? (
                      <>
                        <div className="text-lg font-bold text-brand-warning font-display">
                          Error
                        </div>
                        <div className="text-[10px] text-brand-warning/70 font-mono uppercase tracking-wider flex items-center justify-end gap-1">
                          <AlertCircle className="h-3 w-3" /> Sprawdź logi
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-lg font-bold text-text-muted font-display">Paused</div>
                        <div className="text-[10px] text-text-muted/70 font-mono uppercase tracking-wider">
                          Inactive
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
