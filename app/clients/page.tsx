"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Users, MoreHorizontal, TrendingUp, Zap, Building2, Plus, ArrowUpRight, AlertCircle, Edit, ChevronDown } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { getClientsData, getAutomationsData } from "@/app/actions";
import type { Client, Automation } from "@/lib/supabase/types";
import { AddClientModal } from "@/components/modals/AddClientModal"
import { EditClientModal } from "@/components/modals/EditClientModal"

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [automations, setAutomations] = useState<Automation[]>([])
  const [error, setError] = useState<Error | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [clientsData, automationsData] = await Promise.all([
          getClientsData(),
          getAutomationsData()
        ])
        setClients(clientsData)
        setAutomations(automationsData)
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
            <Users className="h-8 w-8 text-text-muted" />
            Klienci
          </h1>
          <p className="text-text-muted mt-2 font-mono text-xs uppercase tracking-widest">
            Zarządzaj portfelem klientów i monitoruj ich wyniki
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-full bg-white px-6 py-2 text-sm font-bold text-black hover:bg-gray-200 transition-colors font-mono uppercase tracking-wide"
        >
          <Plus className="h-4 w-4" /> Dodaj Klienta
        </button>
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
      {!error && clients.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-12 text-center">
          <Users className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-muted font-mono">Brak klientów do wyświetlenia</p>
        </div>
      )}

      {/* Clients Grid */}
      {!error && clients.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <div
              key={client.id}
              className="group relative flex flex-col justify-between rounded-3xl border border-white/10 bg-[#0a0a0a] p-6 transition-all hover:border-white/20 hover:bg-[#0f0f0f]"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg font-bold text-white font-display">
                    {client.logo}
                  </div>
                  <div>
                    <h3 className="font-bold text-white font-display">{client.name}</h3>
                    <p className="text-xs text-text-muted font-mono">{client.industry}</p>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === client.id ? null : client.id)}
                    className="text-text-muted hover:text-white transition-colors"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </button>

                  {openDropdown === client.id && (
                    <div className="absolute right-0 top-8 z-10 w-48 rounded-xl border border-white/10 bg-[#0a0a0a] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                      <button
                        onClick={() => {
                          setSelectedClient(client)
                          setIsEditModalOpen(true)
                          setOpenDropdown(null)
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors rounded-xl"
                      >
                        <Edit className="h-4 w-4" />
                        Edytuj klienta
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl border border-white/5 bg-black/40 p-3">
                  <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider mb-1">Oszczędności</div>
                  <div className="text-lg font-bold text-white font-display">
                    {formatCurrency(client.saved_amount)} PLN
                  </div>
                </div>
                <div className="rounded-xl border border-white/5 bg-black/40 p-3">
                  <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider mb-1">ROI</div>
                  <div className="text-lg font-bold text-brand-success font-display flex items-center gap-1">
                    +{client.roi_percentage}% <ArrowUpRight className="h-3 w-3" />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
                <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
                  <Zap className="h-3 w-3" />
                  {client.automations_count} procesów
                </div>

                <div className={cn(
                  "flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider border",
                  client.status === "active" ? "border-green-500/30 bg-green-500/10 text-green-500" :
                    client.status === "warning" ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-500" :
                      "border-gray-500/30 bg-gray-500/10 text-gray-500"
                )}>
                  <div className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    client.status === "active" ? "bg-green-500 animate-pulse" :
                      client.status === "warning" ? "bg-yellow-500" :
                        "bg-gray-500"
                  )}></div>
                  {client.status === "active" ? "Aktywny" : client.status === "warning" ? "Ryzyko" : "Nieaktywny"}
                </div>
              </div>
            </div>
          ))}

          {/* Add Client Placeholder Card */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="group flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-white/10 bg-transparent p-6 transition-all hover:border-white/30 hover:bg-white/5 min-h-[240px]"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-white/50 group-hover:bg-white/10 group-hover:text-white transition-colors">
              <Plus className="h-6 w-6" />
            </div>
            <span className="text-sm font-bold text-text-muted font-mono uppercase tracking-widest group-hover:text-white">
              Dodaj Nowego Klienta
            </span>
          </button>
        </div>
      )}

      <AddClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          // Refresh data
          getClientsData().then(setClients)
          router.refresh()
        }}
        availableAutomations={automations}
      />

      {selectedClient && (
        <EditClientModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedClient(null)
          }}
          client={selectedClient}
          availableAutomations={automations}
          onSuccess={() => {
            // Refresh data
            getClientsData().then(setClients)
            router.refresh()
          }}
        />
      )}
    </div>
  );
}
