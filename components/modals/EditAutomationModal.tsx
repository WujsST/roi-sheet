"use client"

import { useState, useEffect } from "react"
import { X, Zap, Info, Users, Clock, DollarSign, Edit3 } from "lucide-react"
import { updateAutomation, assignClientToAutomation, updateAutomationName } from "@/app/actions"
import type { Automation, Client } from "@/lib/supabase/types"

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
    const [hourlyRate, setHourlyRate] = useState(automation.hourly_rate)
    // Convert seconds to minutes for display
    const [manualTimeMinutes, setManualTimeMinutes] = useState(
        Math.round((automation.manual_time_per_execution_seconds ?? 300) / 60)
    )
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setName(automation.name || '')
            setClientId(automation.client_id || '')
            setHourlyRate(automation.hourly_rate)
            setManualTimeMinutes(Math.round((automation.manual_time_per_execution_seconds ?? 300) / 60))
        }
    }, [isOpen, automation])

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (hourlyRate <= 0) return

        setIsSubmitting(true)
        try {
            // Update name if changed
            if (name !== automation.name) {
                await updateAutomationName(automation.id, name)
            }

            // Update client if changed
            if (clientId !== automation.client_id) {
                await assignClientToAutomation(automation.id, clientId)
            }

            // Update rate and manual time (convert minutes back to seconds)
            await updateAutomation(automation.id, {
                hourly_rate: hourlyRate,
                manual_time_per_execution_seconds: manualTimeMinutes * 60
            })

            onSuccess?.()
            onClose()
        } catch (error) {
            console.error("Error updating automation:", error)
            alert("Błąd podczas zapisywania zmian")
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
                className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a0a0a] p-8 shadow-2xl animate-in zoom-in-95 duration-200"
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

                    {/* Hourly Rate */}
                    <div>
                        <label className="mb-2 flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                            <DollarSign className="h-4 w-4 text-text-muted" />
                            Stawka Godzinowa (PLN/h)
                        </label>
                        <input
                            type="number"
                            value={hourlyRate}
                            onChange={(e) => setHourlyRate(Number(e.target.value))}
                            placeholder="100"
                            min="0"
                            step="0.01"
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-5 py-3 text-white placeholder-white/20 outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all font-mono"
                            required
                        />
                    </div>

                    {/* Manual Time (in MINUTES) */}
                    <div>
                        <label className="mb-2 flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                            <Clock className="h-4 w-4 text-text-muted" />
                            Czas Manualny (minuty)
                        </label>
                        <input
                            type="number"
                            value={manualTimeMinutes}
                            onChange={(e) => setManualTimeMinutes(Number(e.target.value))}
                            placeholder="5"
                            min="0"
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-5 py-3 text-white placeholder-white/20 outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all font-mono"
                        />
                        <p className="mt-1 text-xs text-text-muted font-mono">
                            Ile minut trwałoby zrobienie tego ręcznie?
                        </p>
                    </div>

                    {/* Info about dynamic automation time */}
                    <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                        <div className="flex items-start gap-2 text-sm text-blue-400">
                            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span className="font-mono text-xs">
                                Czas egzekucji automatyzacji obliczany jest automatycznie z rzeczywistych danych n8n
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
                            disabled={isSubmitting || hourlyRate <= 0}
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
