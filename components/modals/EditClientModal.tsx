"use client"

import { useState, useEffect } from "react"
import { X, Building2, Zap } from "lucide-react"
import { updateClient, assignAutomationsToClient, getClientAutomations } from "@/app/actions"
import type { Client, Automation } from "@/lib/supabase/types"

interface EditClientModalProps {
    isOpen: boolean
    onClose: () => void
    client: Client
    availableAutomations: Automation[]
    onSuccess?: () => void
}

export function EditClientModal({
    isOpen,
    onClose,
    client,
    availableAutomations,
    onSuccess
}: EditClientModalProps) {
    const [name, setName] = useState(client.name)
    const [industry, setIndustry] = useState(client.industry)
    const [logo, setLogo] = useState(client.logo)
    const [status, setStatus] = useState<'active' | 'warning' | 'inactive'>(client.status)
    const [selectedAutomations, setSelectedAutomations] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoadingAutomations, setIsLoadingAutomations] = useState(true)

    useEffect(() => {
        if (isOpen) {
            // Reset form when modal opens
            setName(client.name)
            setIndustry(client.industry)
            setLogo(client.logo)
            setStatus(client.status)

            // Load client's current automations
            getClientAutomations(client.id).then(automations => {
                setSelectedAutomations(automations.map(a => a.id))
                setIsLoadingAutomations(false)
            })
        }
    }, [isOpen, client])

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        setIsSubmitting(true)
        try {
            // Update client basic data
            await updateClient(client.id, {
                name: name.trim(),
                industry: industry.trim(),
                logo: logo.trim(),
                status
            })

            // Update automation assignments
            await assignAutomationsToClient(client.id, selectedAutomations)

            onSuccess?.()
            onClose()
        } catch (error) {
            console.error("Error updating client:", error)
            alert("Błąd podczas zapisywania zmian")
        } finally {
            setIsSubmitting(false)
        }
    }

    const toggleAutomation = (automationId: string) => {
        setSelectedAutomations(prev =>
            prev.includes(automationId)
                ? prev.filter(id => id !== automationId)
                : [...prev, automationId]
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0a0a0a] p-8 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-full p-2 text-text-muted hover:bg-white/5 hover:text-white transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="mb-6">
                    <div className="mb-2 flex items-center gap-3">
                        <div className="rounded-full bg-brand-accent/10 p-2">
                            <Building2 className="h-5 w-5 text-brand-accent" />
                        </div>
                        <h2 className="text-2xl font-bold text-white font-display">Edytuj Klienta</h2>
                    </div>
                    <p className="text-sm text-text-muted font-mono">
                        Zaktualizuj dane klienta i zarządzaj przypisanymi automatyzacjami
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-bold text-white uppercase tracking-wider">
                                Nazwa Klienta
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="np. TechCorp Sp. z o.o."
                                className="w-full rounded-xl border border-white/10 bg-black/40 px-5 py-4 text-white placeholder-white/20 outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-bold text-white uppercase tracking-wider">
                                Branża
                            </label>
                            <input
                                type="text"
                                value={industry}
                                onChange={(e) => setIndustry(e.target.value)}
                                placeholder="np. SaaS / IT"
                                className="w-full rounded-xl border border-white/10 bg-black/40 px-5 py-4 text-white placeholder-white/20 outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-2 block text-sm font-bold text-white uppercase tracking-wider">
                                    Logo (Inicjały)
                                </label>
                                <input
                                    type="text"
                                    value={logo}
                                    onChange={(e) => setLogo(e.target.value.toUpperCase().slice(0, 3))}
                                    placeholder="TC"
                                    maxLength={3}
                                    className="w-full rounded-xl border border-white/10 bg-black/40 px-5 py-4 text-white placeholder-white/20 outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all font-mono text-center"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-bold text-white uppercase tracking-wider">
                                    Status
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as any)}
                                    className="w-full rounded-xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all"
                                >
                                    <option value="active">Aktywny</option>
                                    <option value="warning">Ryzyko</option>
                                    <option value="inactive">Nieaktywny</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Automations */}
                    <div>
                        <div className="mb-3 flex items-center gap-2">
                            <Zap className="h-4 w-4 text-brand-accent" />
                            <label className="text-sm font-bold text-white uppercase tracking-wider">
                                Przypisane Automatyzacje
                            </label>
                        </div>

                        {isLoadingAutomations ? (
                            <div className="text-sm text-text-muted font-mono">Ładowanie...</div>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-4">
                                {availableAutomations.length === 0 ? (
                                    <p className="text-sm text-text-muted font-mono">Brak dostępnych automatyzacji</p>
                                ) : (
                                    availableAutomations.map((automation) => (
                                        <label
                                            key={automation.id}
                                            className="flex items-center gap-3 rounded-lg border border-white/5 bg-black/40 p-3 cursor-pointer hover:bg-white/5 transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedAutomations.includes(automation.id)}
                                                onChange={() => toggleAutomation(automation.id)}
                                                className="h-4 w-4 rounded border-white/20 bg-black/40 text-brand-accent focus:ring-brand-accent focus:ring-offset-0"
                                            />
                                            <span className="text-sm text-white font-mono">
                                                {automation.name || 'Unnamed automation'}
                                            </span>
                                        </label>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-full border border-white/10 px-6 py-3 font-bold text-white hover:bg-white/5 transition-colors"
                        >
                            Anuluj
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !name.trim()}
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
