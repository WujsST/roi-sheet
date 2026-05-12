import Link from "next/link"
import { redirect } from "next/navigation"
import { parseISO } from "date-fns"
import { getCurrentRole } from "@/lib/auth/role"
import { createClient } from "@/lib/supabase/server"
import type { Report } from "@/lib/supabase/types"
import { formatRangeLabel } from "@/lib/date-range"
import { FileText, Download } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function MyOrgReportsPage() {
  const role = await getCurrentRole()
  if (role.role === "admin") redirect("/reports")
  if (role.role === "unassigned" || !role.clientId) redirect("/pending")

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("client_id", role.clientId)
    .order("created_at", { ascending: false })
  if (error) throw error
  const reports = (data || []) as Report[]

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-white font-display tracking-tight flex items-center gap-3">
          <FileText className="h-8 w-8 text-text-muted" />
          Raporty {role.clientName}
        </h1>
        <p className="text-text-muted mt-2 font-mono text-xs uppercase tracking-widest">
          Archiwum raportów Twojej organizacji
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-12 text-center">
          <FileText className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-muted font-mono">
            Brak raportów. Twoja agencja jeszcze nie wygenerowała żadnego.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {reports.map((report) => {
            const periodLabel = formatRangeLabel({
              from: parseISO(report.period_from),
              to: parseISO(report.period_to),
            })
            return (
              <Link
                key={report.id}
                href={`/reports/${report.id}`}
                className="group relative flex flex-col rounded-3xl border border-white/10 bg-[#0a0a0a] overflow-hidden transition-all hover:border-white/30"
              >
                <div className="relative h-64 w-full bg-[#0f0f0f] flex items-center justify-center p-8">
                  <div className="w-full h-full bg-white rounded-sm p-4 flex flex-col gap-2">
                    <div className="w-1/3 h-2 bg-gray-800 rounded mb-2" />
                    <div className="w-full h-1 bg-gray-200 rounded" />
                    <div className="w-full h-1 bg-gray-200 rounded" />
                    <div className="w-2/3 h-1 bg-gray-200 rounded mb-4" />
                    <div className="flex-1 border border-dashed border-gray-200 rounded bg-gray-50" />
                  </div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity backdrop-blur-sm">
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white text-black">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white text-black">
                      <Download className="h-5 w-5" />
                    </div>
                  </div>
                </div>
                <div className="p-5 border-t border-white/5">
                  <h3 className="font-bold text-white text-sm font-display truncate mb-1">
                    {report.title || "Raport ROI"}
                  </h3>
                  <div className="text-xs text-text-muted font-mono">{periodLabel}</div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
