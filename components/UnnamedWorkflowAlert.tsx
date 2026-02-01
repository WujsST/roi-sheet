"use client"

import { useState, useEffect } from "react"
import { X, AlertCircle } from "lucide-react"
import { getUnnamedAutomations, updateAutomationName } from "@/app/actions"
import type { Automation } from "@/lib/supabase/types"

export function UnnamedWorkflowAlert() {
    const [unnamedWorkflows, setUnnamedWorkflows] = useState<Automation[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [name, setName] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        async function fetchUnnamed() {
            const workflows = await getUnnamedAutomations()
            if (workflows.length > 0) {
                setUnnamedWorkflows(workflows)
                setIsVisible(true)
            }
        }
        fetchUnnamed()
    }, [])

    if (!isVisible || unnamedWorkflows.length === 0) return null

    const currentWorkflow = unnamedWorkflows[currentIndex]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        setIsSubmitting(true)
        try {
            await updateAutomationName(currentWorkflow.id, name.trim())

            // Move to next unnamed workflow or close
            if (currentIndex < unnamedWorkflows.length - 1) {
                setCurrentIndex(currentIndex + 1)
                setName("")
            } else {
                setIsVisible(false)
            }
        } catch (error) {
            console.error("Error updating name:", error)
            alert("Błąd podczas zapisywania nazwy")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSkip = () => {
        if (currentIndex < unnamedWorkflows.length - 1) {
            setCurrentIndex(currentIndex + 1)
            setName("")
        } else {
            setIsVisible(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md rounded-2xl border border-yellow-500/20 bg-[#0a0a0a] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute right-4 top-4 rounded-full p-2 text-text-muted hover:bg-white/5 hover:text-white transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="mb-6">
                    <div className="mb-2 flex items-center gap-3">
                        <div className="rounded-full bg-yellow-500/10 p-2">
                            <AlertCircle className="h-5 w-5 text-yellow-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white font-display">Nowy Workflow Wykryty!</h2>
                    </div>
                    <p className="text-sm text-text-muted font-mono">
                        Workflow ID: <span className="text-brand-accent">{currentWorkflow.workflow_id}</span>
                    </p>
                    {unnamedWorkflows.length > 1 && (
                        <p className="mt-2 text-xs text-text-muted">
                            {currentIndex + 1} z {unnamedWorkflows.length} nowych workflow
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="mb-3 block text-sm font-bold text-white uppercase tracking-wider">
                            Nadaj Nazwę
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="np. Invoice Parser v2"
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-5 py-4 text-white placeholder-white/20 outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all font-mono"
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleSkip}
                            className="flex-1 rounded-full border border-white/10 px-6 py-3 font-bold text-white hover:bg-white/5 transition-colors"
                        >
                            {currentIndex < unnamedWorkflows.length - 1 ? "Pomiń" : "Zamknij"}
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
