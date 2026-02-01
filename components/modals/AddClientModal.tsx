"use client"

import { useState } from "react"
import { Modal } from "@/components/ui/Modal"
import { clientSchema } from "@/lib/validations"
import { createNewClient } from "@/app/actions"
import type { Automation } from "@/lib/supabase/types"
import { Check } from "lucide-react"

interface AddClientModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  availableAutomations: Automation[]
}

export function AddClientModal({ isOpen, onClose, onSuccess, availableAutomations }: AddClientModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    logo: '',
    automationIds: [] as string[]
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Real-time validation
    try {
      clientSchema.shape[field as keyof typeof clientSchema.shape].parse(value)
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    } catch (error: any) {
      setErrors(prev => ({ ...prev, [field]: error.errors[0]?.message || 'Invalid value' }))
    }
  }

  const toggleAutomation = (automationId: string) => {
    const newIds = formData.automationIds.includes(automationId)
      ? formData.automationIds.filter(id => id !== automationId)
      : [...formData.automationIds, automationId]
    handleChange('automationIds', newIds)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Validate entire form
      clientSchema.parse(formData)
      setIsSubmitting(true)

      await createNewClient(formData)

      // Reset and close
      setFormData({ name: '', industry: '', logo: '', automationIds: [] })
      setErrors({})
      onSuccess()
      onClose()
    } catch (error: any) {
      if (error.errors) {
        // Zod validation errors
        const newErrors: Record<string, string> = {}
        error.errors.forEach((err: any) => {
          newErrors[err.path[0]] = err.message
        })
        setErrors(newErrors)
      } else {
        // Server error
        alert('Błąd podczas tworzenia klienta: ' + error.message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Dodaj Nowego Klienta">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
            Nazwa Klienta
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white outline-none focus:border-brand-accent transition-colors"
            placeholder="np. Acme Corp"
          />
          {errors.name && (
            <p className="text-xs text-red-400 mt-1">{errors.name}</p>
          )}
        </div>

        {/* Industry */}
        <div>
          <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
            Branża (opcjonalnie)
          </label>
          <input
            type="text"
            value={formData.industry}
            onChange={(e) => handleChange('industry', e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white outline-none focus:border-brand-accent transition-colors"
            placeholder="np. E-commerce"
          />
        </div>

        {/* Logo */}
        <div>
          <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
            Logo (inicjały, max 2 znaki)
          </label>
          <input
            type="text"
            maxLength={2}
            value={formData.logo}
            onChange={(e) => handleChange('logo', e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white outline-none focus:border-brand-accent transition-colors"
            placeholder="AC"
          />
          {errors.logo && (
            <p className="text-xs text-red-400 mt-1">{errors.logo}</p>
          )}
        </div>

        {/* Automations */}
        <div>
          <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
            Przypisane Automatyzacje
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-[#111] p-3">
            {availableAutomations.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-4">
                Brak dostępnych automatyzacji
              </p>
            ) : (
              availableAutomations.map((automation) => (
                <label
                  key={automation.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <div className="relative flex items-center justify-center h-5 w-5">
                    <input
                      type="checkbox"
                      checked={formData.automationIds.includes(automation.id)}
                      onChange={() => toggleAutomation(automation.id)}
                      className="sr-only"
                    />
                    <div className={`h-5 w-5 rounded border-2 transition-colors ${
                      formData.automationIds.includes(automation.id)
                        ? 'bg-brand-accent border-brand-accent'
                        : 'border-white/20'
                    }`}>
                      {formData.automationIds.includes(automation.id) && (
                        <Check className="h-full w-full text-white p-0.5" />
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-white font-mono">{automation.name}</span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-white/20 px-6 py-3 text-sm font-bold text-white hover:bg-white/5 transition-colors font-mono uppercase"
          >
            Anuluj
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 rounded-full bg-white px-6 py-3 text-sm font-bold text-black hover:bg-gray-200 transition-colors font-mono uppercase disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Tworzenie...' : 'Dodaj Klienta'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
