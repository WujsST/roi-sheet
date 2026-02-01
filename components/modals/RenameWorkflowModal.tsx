"use client"

import { useState } from "react"
import { X, Edit3 } from "lucide-react"
import { updateAutomationName } from "@/app/actions"

interface RenameWorkflowModalProps {
    isOpen: boolean
    onClose: () => void
    automationId: string
    currentName: string | null
}

export function RenameWorkflowModal({
    isOpen,
    onClose,
    automationId,
    currentName
}: RenameWorkflowModalProps) {
    const [name, setName] = useState(currentName || "")
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        setIsSubmitting(true)
        try {
            await updateAutomationName(automationId, name.trim())
            onClose()
        } catch (error) {
            console.error("Error updating name:", error)
            alert("Błąd podczas zmiany nazwy")
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
                            <Edit3 className="h-5 w-5 text-brand-accent" />
                        </div>
                        <h2 className="text-2xl font-bold text-white font-display">Zmień Nazwę</h2>
                    </div>
                    <p className="text-sm text-text-muted font-mono">
                        Nadaj automatyzacji opisową nazwę
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="mb-3 block text-sm font-bold text-white uppercase tracking-wider">
                            Nazwa Automatyzacji
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="np. Invoice Parser v2"
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-5 py-4 text-white placeholder-white/20 outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all font-mono"
                            required
                            autoFocus
                        />
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
                            {isSubmitting ? "Zapisuję..." : "Zapisz"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
