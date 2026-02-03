"use client"

import { useState, useEffect } from "react"
import { X, Zap, Info, Users, Clock, DollarSign, Edit3, Cpu } from "lucide-react"
import { updateAutomation, assignClientToAutomation, updateAutomationName } from "@/app/actions"
import type { Automation, Client } from "@/lib/supabase/types"

const AUTOMATION_SOURCES = [
    { value: 'n8n', label: 'n8n' },
    { value: 'zapier', label: 'Zapier' },
    { value: 'make', label: 'Make (Integromat)' },
    { value: 'retell', label: 'Retell' },
    { value: 'custom', label: 'Custom Script' },
    { value: 'other', label: 'Inne' },
]

interface EditAutomationModalProps {
    isOpen: boolean
    onClose: () => void
    automation: Automation
    clients: Client[]
    onSuccess?: () => void
}

export function EditAutomationModal({
    isOpen,
    onClose,
    automation,
    clients,
    onSuccess
}: EditAutomationModalProps) {
    const [name, setName] = useState(automation.name || '')
    const [clientId, setClientId] = useState(automation.client_id || '')
    const [hourlyRate, setHourlyRate] = useState(String(automation.hourly_rate || 0))
    const [source, setSource] = useState(automation.source || 'n8n')
    // Convert seconds to minutes for display - use string for better input handling
    const [manualTimeMinutes, setManualTimeMinutes] = useState(
        String(Math.round((automation.manual_time_per_execution_seconds ?? 300) / 60))
    )
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setName(automation.name || '')
            setClientId(automation.client_id || '')
            setHourlyRate(String(automation.hourly_rate || 0))
            setSource(automation.source || 'n8n')
            setManualTimeMinutes(String(Math.round((automation.manual_time_per_execution_seconds ?? 300) / 60)))
        }
    }, [isOpen, automation])

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const rate = parseFloat(hourlyRate) || 0
        if (rate <= 0) return

        setIsSubmitting(true)
        try {
            // Update name if changed
            if (name !== automation.name && name.trim()) {
                await updateAutomationName(automation.id, name)
            }

            // Update client if changed
            if (clientId !== (automation.client_id || '')) {
                await assignClientToAutomation(automation.id, clientId)
            }

            // Update rate and manual time
            // NOTE: source field will be saved once migration 020 is applied
            const minutes = parseInt(manualTimeMinutes) || 0
            await updateAutomation(automation.id, {
                hourly_rate: rate,
                manual_time_per_execution_seconds: minutes * 60
            })

            onSuccess?.()
            onClose()
        } catch (error) {
            console.error("Error updating automation:", error)
            const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd'
            alert(`Błąd podczas zapisywania zmian: ${errorMessage}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a0a0a] p-8 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-full p-2 text-text-muted hover:bg-white/5 hover:text-white transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="mb-6">
                    <div className="mb-2 flex items-center gap-3">
                        <div className="rounded-full bg-brand-accent/10 p-2">
                            <Zap className="h-5 w-5 text-brand-accent" />
                        </div>
                        <h2 className="text-2xl font-bold text-white font-display">Ustawienia Automatyzacji</h2>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name */}
                    <div>
                        <label className="mb-2 flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                            <Edit3 className="h-4 w-4 text-text-muted" />
                            Nazwa
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nazwa automatyzacji..."
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-5 py-3 text-white placeholder-white/20 outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all"
                        />
                    </div>

                    {/* Client Selection */}
                    <div>
                        <label className="mb-2 flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                            <Users className="h-4 w-4 text-text-muted" />
                            Klient
                        </label>
                        <select
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-5 py-3 text-white outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all cursor-pointer"
                        >
                            <option value="">Brak przypisanego klienta</option>
                            {clients.map((client) => (
                                <option key={client.id} value={client.id}>
                                    {client.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Source/Technology Selection */}
                    <div>
                        <label className="mb-2 flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                            <Cpu className="h-4 w-4 text-text-muted" />
                            Technologia / Źródło
                        </label>
                        <select
                            value={source}
                            onChange={(e) => setSource(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-5 py-3 text-white outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all cursor-pointer"
                        >
                            {AUTOMATION_SOURCES.map((s) => (
                                <option key={s.value} value={s.value}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-text-muted font-mono">
                            Platforma odpowiadająca za tę automatyzację
                        </p>
                    </div>

                    {/* Hourly Rate */}
                    <div>
                        <label className="mb-2 flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                            <DollarSign className="h-4 w-4 text-text-muted" />
                            Stawka Godzinowa (PLN/h)
                        </label>
                        <input
                            type="text"
                            inputMode="decimal"
                            value={hourlyRate}
                            onChange={(e) => setHourlyRate(e.target.value)}
                            placeholder="100"
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-5 py-3 text-white placeholder-white/20 outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all font-mono"
                        />
                    </div>

                    {/* Manual Time (in MINUTES) - using text input for better UX */}
                    <div>
                        <label className="mb-2 flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                            <Clock className="h-4 w-4 text-text-muted" />
                            Czas Manualny (minuty)
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={manualTimeMinutes}
                            onChange={(e) => setManualTimeMinutes(e.target.value)}
                            placeholder="5"
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-5 py-3 text-white placeholder-white/20 outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all font-mono"
                        />
                        <p className="mt-1 text-xs text-text-muted font-mono">
                            Ile minut trwałoby zrobienie tego ręcznie?
                        </p>
                    </div>

                    {/* Info about calculation */}
                    <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                        <div className="flex items-start gap-2 text-sm text-blue-400">
                            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span className="font-mono text-xs">
                                Hours Back = ilość egzekucji × czas manualny ÷ 60
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-full border border-white/10 px-6 py-3 font-bold text-white hover:bg-white/5 transition-colors"
                        >
                            Anuluj
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || (parseFloat(hourlyRate) || 0) <= 0}
                            className="flex-1 rounded-full bg-brand-accent px-6 py-3 font-bold text-white hover:bg-brand-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Zapisuję..." : "Zapisz Zmiany"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
