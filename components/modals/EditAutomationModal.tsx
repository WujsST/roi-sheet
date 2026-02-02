"use client"

import { useState, useEffect } from "react"
import { X, Zap, Clock } from "lucide-react"
import { updateAutomation } from "@/app/actions"
import type { Automation } from "@/lib/supabase/types"

interface EditAutomationModalProps {
    isOpen: boolean
    onClose: () => void
    automation: Automation
    onSuccess?: () => void
}

export function EditAutomationModal({
    isOpen,
    onClose,
    automation,
    onSuccess
}: EditAutomationModalProps) {
    const [hourlyRate, setHourlyRate] = useState(automation.hourly_rate)
    const [manualTime, setManualTime] = useState(automation.manual_time_per_execution_seconds ?? 300)
    const [automationTime, setAutomationTime] = useState(automation.automation_time_per_execution_seconds ?? 30)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setHourlyRate(automation.hourly_rate)
            setManualTime(automation.manual_time_per_execution_seconds ?? 300)
            setAutomationTime(automation.automation_time_per_execution_seconds ?? 30)
        }
    }, [isOpen, automation])

    if (!isOpen) return null

    const timeSavedPerExec = Math.max(0, manualTime - automationTime)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (hourlyRate <= 0) return

        setIsSubmitting(true)
        try {
            await updateAutomation(automation.id, {
                hourly_rate: hourlyRate,
                manual_time_per_execution_seconds: manualTime,
                automation_time_per_execution_seconds: automationTime
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0a] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
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
                        <h2 className="text-2xl font-bold text-white font-display">Edytuj Automatyzację</h2>
                    </div>
                    <p className="text-sm text-text-muted font-mono">
                        {automation.name || 'Unnamed automation'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="mb-2 block text-sm font-bold text-white uppercase tracking-wider">
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

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-2 block text-xs font-bold text-white uppercase tracking-wider">
                                Czas Manualny (sek)
                            </label>
                            <input
                                type="number"
                                value={manualTime}
                                onChange={(e) => setManualTime(Number(e.target.value))}
                                placeholder="300"
                                min="0"
                                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-white/20 outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all font-mono"
                            />
                            <p className="mt-1 text-[10px] text-text-muted font-mono">
                                Ile trwa ręcznie?
                            </p>
                        </div>
                        <div>
                            <label className="mb-2 block text-xs font-bold text-white uppercase tracking-wider">
                                Czas Automatyzacji (sek)
                            </label>
                            <input
                                type="number"
                                value={automationTime}
                                onChange={(e) => setAutomationTime(Number(e.target.value))}
                                placeholder="30"
                                min="0"
                                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-white/20 outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all font-mono"
                            />
                            <p className="mt-1 text-[10px] text-text-muted font-mono">
                                Ile trwa auto?
                            </p>
                        </div>
                    </div>

                    {/* Calculated savings display */}
                    <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                        <div className="flex items-center gap-2 text-sm text-green-400">
                            <Clock className="h-4 w-4" />
                            <span className="font-mono font-bold">
                                Oszczędność: {timeSavedPerExec} sek/exec ({(timeSavedPerExec / 60).toFixed(1)} min)
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

