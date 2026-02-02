"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Workflow, Search, Filter, Mail, FileText, UserPlus, AlertCircle, CheckCircle2, Play, MoreHorizontal, Zap, Calendar, Database, Globe, Settings, Bell, Bot, ArrowRight, Edit3, User, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAutomationsData, getClientsData, getUnlinkedWorkflows } from "@/app/actions";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import type { Automation, Client } from "@/lib/supabase/types";
import { AddAutomationModal } from "@/components/modals/AddAutomationModal"
import { AssignClientModal } from "@/components/modals/AssignClientModal"
import { RenameWorkflowModal } from "@/components/modals/RenameWorkflowModal"
import { EditAutomationModal } from "@/components/modals/EditAutomationModal"
import { UnnamedWorkflowAlert } from "@/components/UnnamedWorkflowAlert"

// Icon mapping helper
const getIconComponent = (iconName: string | null) => {
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
    Bell,
    Bot
  };
  return iconName ? (icons[iconName] || Workflow) : Workflow;
};

export default function AutomationsPage() {
  const router = useRouter()
  const [automations, setAutomations] = useState<Automation[]>([])
  const [unlinkedWorkflows, setUnlinkedWorkflows] = useState<{ workflow_id: string; execution_count: number; last_seen: string }[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [error, setError] = useState<Error | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null)
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false)
  const [isAssignClientModalOpen, setIsAssignClientModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [automationsData, clientsData, unlinkedData] = await Promise.all([
          getAutomationsData(),
          getClientsData(),
          getUnlinkedWorkflows()
        ])
        setAutomations(automationsData)
        setClients(clientsData)
        setUnlinkedWorkflows(unlinkedData)
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
          <Link
            href="/automations/new"
            className="flex items-center gap-2 rounded-full bg-white px-6 py-2 text-sm font-bold text-black hover:bg-gray-200 transition-colors font-mono uppercase tracking-wide"
          >
            <Play className="h-3 w-3 fill-current" /> Nowy Proces
          </Link>
        </div>
      </div>

      {unlinkedWorkflows.length > 0 && (
        <div className="rounded-xl border border-brand-accent/20 bg-brand-accent/5 p-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-brand-accent/10">
              <Bot className="h-5 w-5 text-brand-accent" />
            </div>
            <div>
              <h3 className="font-bold text-white">Wykryto nowe procesy ({unlinkedWorkflows.length})</h3>
              <p className="text-xs text-text-muted">Poniższe procesy n8n nie są jeszcze przypisane do klientów.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlinkedWorkflows.map((workflow) => (
              <div key={workflow.workflow_id} className="group relative overflow-hidden rounded-lg bg-black/40 border border-white/5 p-4 hover:border-brand-accent/50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="bg-white/5 p-1.5 rounded text-xs font-mono text-gray-400">
                    ID: {workflow.workflow_id.substring(0, 8)}...
                  </div>
                  <span className="text-xs font-bold text-white bg-brand-accent/20 px-2 py-1 rounded-full">
                    {workflow.execution_count} execs
                  </span>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs text-gray-500">
                    Ostatnia: {formatDistanceToNow(new Date(workflow.last_seen), { addSuffix: true, locale: pl })}
                  </div>

                  <Link
                    href={`/automations/new?workflowId=${workflow.workflow_id}`}
                    className="flex items-center gap-1 text-xs font-bold text-brand-accent hover:underline"
                  >
                    Konfiguruj <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> {item.client_name || 'Brak klienta'}
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
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-text-muted hover:text-white transition-colors"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>

                    {openMenuId === item.id && (
                      <div className="absolute right-0 top-10 z-10 w-48 rounded-xl border border-white/10 bg-[#0a0a0a] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <button
                          onClick={() => {
                            setSelectedAutomation(item)
                            setIsRenameModalOpen(true)
                            setOpenMenuId(null)
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/5 transition-colors rounded-t-xl flex items-center gap-2"
                        >
                          <Edit3 className="h-4 w-4" />
                          Zmień nazwę
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAutomation(item)
                            setIsEditModalOpen(true)
                            setOpenMenuId(null)
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                        >
                          <DollarSign className="h-4 w-4" />
                          Edytuj stawkę
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAutomation(item)
                            setIsAssignClientModalOpen(true)
                            setOpenMenuId(null)
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/5 transition-colors rounded-b-xl flex items-center gap-2"
                        >
                          <User className="h-4 w-4" />
                          Przypisz klienta
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <UnnamedWorkflowAlert />

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

      {selectedAutomation && (
        <>
          <RenameWorkflowModal
            isOpen={isRenameModalOpen}
            onClose={() => {
              setIsRenameModalOpen(false)
              setSelectedAutomation(null)
            }}
            automationId={selectedAutomation.id}
            currentName={selectedAutomation.name}
          />

          <AssignClientModal
            isOpen={isAssignClientModalOpen}
            onClose={() => {
              setIsAssignClientModalOpen(false)
              setSelectedAutomation(null)
            }}
            automationId={selectedAutomation.id}
            automationName={selectedAutomation.name || 'Unnamed automation'}
            clients={clients}
          />

          <EditAutomationModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false)
              setSelectedAutomation(null)
            }}
            automation={selectedAutomation}
            onSuccess={() => {
              getAutomationsData().then(setAutomations)
              router.refresh()
            }}
          />
        </>
      )}
    </div>
  );
}
