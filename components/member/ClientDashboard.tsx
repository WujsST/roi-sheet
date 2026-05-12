"use client"

import type { ReportSnapshot } from "@/lib/supabase/types"
import { Wallet, Clock, Zap, TrendingUp, CheckCircle2, XCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface Props {
  snapshot: ReportSnapshot
}

export function ClientDashboard({ snapshot }: Props) {
  const { client, automations, trends } = snapshot
  const totalSuccess = automations.reduce((s, a) => s + (a.success_count ?? 0), 0)
  const totalErrors = client.total_errors ?? automations.reduce((s, a) => s + (a.error_count ?? 0), 0)
  const errorRate = (client.error_rate ?? 0) * 100
  const maxTrend = Math.max(...trends.map((t) => t.total_savings), 1)

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-4xl font-bold text-white font-display tracking-tight">
          {client.client_name}
        </h1>
        <p className="text-text-muted mt-2 font-mono text-xs uppercase tracking-widest">
          {client.client_industry} • Twoja organizacja
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard
          icon={Wallet}
          label="Oszczędności"
          value={`${formatCurrency(client.total_savings_pln)} PLN`}
          sub="Łącznie"
          variant="green"
        />
        <KpiCard
          icon={Clock}
          label="Zaoszczędzony czas"
          value={`${client.total_hours_saved}h`}
          sub="Godziny pracy"
          variant="purple"
        />
        <KpiCard
          icon={TrendingUp}
          label="Średni ROI"
          value={`${client.avg_roi_percentage}%`}
          sub="Across automations"
          variant="purple"
        />
        <KpiCard
          icon={Zap}
          label="Aktywne automatyzacje"
          value={String(client.total_automations)}
          sub={`${client.total_executions} egzekucji`}
          variant="default"
        />
      </div>

      {/* Trend chart */}
      {trends.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-6">
            Trend oszczędności
          </h2>
          <div className="flex items-end gap-3 h-48">
            {trends.map((t) => (
              <div key={t.week_label} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-[10px] font-mono text-text-muted">
                  {formatCurrency(t.total_savings)}
                </div>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-brand-accent to-brand-accent/60"
                  style={{ height: `${(t.total_savings / maxTrend) * 160}px`, minHeight: "4px" }}
                />
                <div className="text-[10px] font-mono text-text-muted">{t.week_label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Execution stats */}
      <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted">
            Wykonania &amp; Błędy
          </h2>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-green-400">
              <CheckCircle2 className="h-3 w-3" /> {totalSuccess}
            </span>
            <span className="flex items-center gap-1.5 text-red-400">
              <XCircle className="h-3 w-3" /> {totalErrors}
            </span>
            <span className="text-text-muted">{errorRate.toFixed(1)}% błędów</span>
          </div>
        </div>
        <div className="space-y-3">
          {automations.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-xl border border-white/5 bg-black/30 p-4"
            >
              <div className="font-bold text-white">{a.name}</div>
              <div className="flex items-center gap-6 text-xs font-mono">
                <span className="text-green-400">OK: {a.success_count ?? 0}</span>
                <span className={(a.error_count ?? 0) > 0 ? "text-red-400" : "text-text-muted"}>
                  Err: {a.error_count ?? 0}
                </span>
                <span className="text-brand-success font-bold w-28 text-right">
                  {formatCurrency(a.money_saved_pln)} PLN
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  variant,
}: {
  icon: typeof Wallet
  label: string
  value: string
  sub: string
  variant: "green" | "purple" | "default"
}) {
  const accent =
    variant === "green"
      ? "text-brand-success"
      : variant === "purple"
        ? "text-brand-accent"
        : "text-white"
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 min-h-[180px] flex flex-col justify-between">
      <Icon className="h-6 w-6 text-text-muted" />
      <div>
        <div className={`text-3xl font-bold font-display ${accent}`}>{value}</div>
        <div className="text-xs text-text-muted font-mono uppercase tracking-wider mt-2">
          {label}
        </div>
        <div className="text-[10px] text-text-muted/60 font-mono mt-1">{sub}</div>
      </div>
    </div>
  )
}
