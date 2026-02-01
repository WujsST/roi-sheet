"use client"

import { useState } from "react"
import { X, User } from "lucide-react"
import { assignClientToAutomation } from "@/app/actions"
import type { Client } from "@/lib/supabase/types"

interface AssignClientModalProps {
    isOpen: boolean
    onClose: () => void
    automationId: string
    automationName: string
    clients: Client[]
}

export function AssignClientModal({
    isOpen,
    onClose,
    automationId,
    automationName,
    clients
}: AssignClientModalProps) {
    const [selectedClientId, setSelectedClientId] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedClientId) return

        setIsSubmitting(true)
        try {
            await assignClientToAutomation(automationId, selectedClientId)
            onClose()
        } catch (error) {
            console.error("Error assigning client:", error)
            alert("Błąd podczas przypisywania klienta")
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
                            <User className="h-5 w-5 text-brand-accent" />
                        </div>
                        <h2 className="text-2xl font-bold text-white font-display">Przypisz Klienta</h2>
                    </div>
                    <p className="text-sm text-text-muted font-mono">
                        Automatyzacja: <span className="text-white">{automationName}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="mb-3 block text-sm font-bold text-white uppercase tracking-wider">
                            Wybierz Klienta
                        </label>
                        <select
                            value={selectedClientId}
                            onChange={(e) => setSelectedClientId(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all appearance-none font-mono"
                            required
                        >
                            <option value="" className="bg-black">Wybierz klienta...</option>
                            {clients.map((client) => (
                                <option key={client.id} value={client.id} className="bg-black">
                                    {client.name}
                                </option>
                            ))}
                        </select>
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
                            disabled={isSubmitting || !selectedClientId}
                            className="flex-1 rounded-full bg-brand-accent px-6 py-3 font-bold text-white hover:bg-brand-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Zapisuję..." : "Przypisz"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
