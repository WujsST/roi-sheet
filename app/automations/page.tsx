"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Workflow, Search, Filter, Mail, FileText, UserPlus, AlertCircle, CheckCircle2, Play, MoreHorizontal, Zap, Calendar, Database, Globe, Settings, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAutomationsData, getClientsData } from "@/app/actions";
import type { Automation, Client } from "@/lib/supabase/types";
import { AddAutomationModal } from "@/components/modals/AddAutomationModal"

// Icon mapping helper
const getIconComponent = (iconName: string) => {
  const icons: { [key: string]: any } = {
    Mail,
    FileText,
    UserPlus,
    Workflow,
    Zap,
    Calendar,
    Database,
    Globe,
    Settings,
    Bell
  };
  return icons[iconName] || Workflow;
};

export default function AutomationsPage() {
  const router = useRouter()
  const [automations, setAutomations] = useState<Automation[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [error, setError] = useState<Error | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [automationsData, clientsData] = await Promise.all([
          getAutomationsData(),
          getClientsData()
        ])
        setAutomations(automationsData)
        setClients(clientsData)
      } catch (e) {
        setError(e as Error)
        console.error('Error fetching data:', e)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white font-display tracking-tight flex items-center gap-3">
            <Workflow className="h-8 w-8 text-text-muted" />
            Automatyzacje
          </h1>
          <p className="text-text-muted mt-2 font-mono text-xs uppercase tracking-widest">
            Monitoruj stan i wydajność procesów
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex gap-3">
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
             <input
               type="text"
               placeholder="Szukaj..."
               className="h-10 w-64 rounded-full border border-white/10 bg-[#0f0f0f] pl-10 pr-4 text-sm text-white focus:border-white/30 outline-none font-mono"
             />
          </div>
          <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#0f0f0f] text-text-muted hover:text-white hover:bg-white/5 transition-colors">
            <Filter className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-full bg-white px-6 py-2 text-sm font-bold text-black hover:bg-gray-200 transition-colors font-mono uppercase tracking-wide"
          >
             <Play className="h-3 w-3 fill-current" /> Nowy Proces
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
          <div className="flex items-center gap-3 text-red-400">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-bold">Błąd ładowania danych</p>
              <p className="text-sm text-red-400/70">{error.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading/Empty State */}
      {!error && automations.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-12 text-center">
          <Workflow className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-muted font-mono">Brak automatyzacji do wyświetlenia</p>
        </div>
      )}

      {/* Automations List */}
      {!error && automations.length > 0 && (
        <div className="space-y-3">
          {automations.map((item) => {
            const IconComponent = getIconComponent(item.icon);
            const uptimePercent = item.status === 'healthy' ? 99 : item.status === 'error' ? 85 : 0;

            return (
              <div
                key={item.id}
                className="group relative flex items-center justify-between rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 transition-all hover:border-white/30 hover:bg-[#0f0f0f]"
              >
                {/* Left: Icon & Info */}
                <div className="flex items-center gap-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/5 text-white border border-white/10 group-hover:bg-white/10 group-hover:border-white/20 transition-colors">
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-bold text-white font-display text-lg tracking-tight mb-1">{item.name}</div>
                    <div className="flex items-center gap-3 text-xs font-mono text-text-muted">
                       <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
                         <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> {item.client_name}
                       </span>
                       <span>Utworzono: {new Date(item.created_at).toLocaleDateString('pl-PL')}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Metrics & Status */}
                <div className="flex items-center gap-8">
                  {/* Health Bar (Mini) */}
                  <div className="hidden md:block w-32">
                     <div className="flex justify-between text-[10px] font-mono text-text-muted mb-1 uppercase tracking-wider">
                       <span>Health</span>
                       <span>{uptimePercent > 0 ? `${uptimePercent}%` : '-'}</span>
                     </div>
                     <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                        <div
                          className={cn("h-full rounded-full",
                            item.status === "healthy" ? "bg-green-500" :
                            item.status === "error" ? "bg-red-500" :
                            "bg-gray-500"
                          )}
                          style={{ width: `${uptimePercent}%` }}
                        ></div>
                     </div>
                  </div>

                  {/* Status Badge */}
                  <div className="w-28 text-right">
                    {item.status === "healthy" ? (
                      <>
                        <div className="text-lg font-bold text-brand-success font-display">
                          {item.saved_today} PLN
                        </div>
                        <div className="text-[10px] text-brand-success/70 font-mono uppercase tracking-wider flex items-center justify-end gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Healthy
                        </div>
                      </>
                    ) : item.status === "error" ? (
                       <>
                        <div className="text-lg font-bold text-brand-warning flex items-center gap-1 justify-end font-display">
                          Error
                        </div>
                        <div className="text-[10px] text-brand-warning/70 font-mono uppercase tracking-wider flex items-center justify-end gap-1">
                           <AlertCircle className="h-3 w-3" /> Check Logs
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-lg font-bold text-text-muted font-display">Paused</div>
                        <div className="text-[10px] text-text-muted/70 font-mono uppercase tracking-wider">Inactive</div>
                      </>
                    )}
                  </div>

                  {/* Menu */}
                  <button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-text-muted hover:text-white transition-colors">
                     <MoreHorizontal className="h-5 w-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddAutomationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          // Refresh data
          getAutomationsData().then(setAutomations)
          router.refresh()
        }}
        availableClients={clients}
      />
    </div>
  );
}
