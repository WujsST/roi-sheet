"use client"

import { useState } from "react"
import { Modal } from "@/components/ui/Modal"
import { automationSchema } from "@/lib/validations"
import { createNewAutomation } from "@/app/actions"
import type { Client } from "@/lib/supabase/types"
import { Check, Zap, Mail, FileText, UserPlus, Calendar, Database, Globe, Settings, Bell } from "lucide-react"

interface AddAutomationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  availableClients: Client[]
}

const ICON_OPTIONS = [
  { name: 'Zap', component: Zap },
  { name: 'Mail', component: Mail },
  { name: 'FileText', component: FileText },
  { name: 'UserPlus', component: UserPlus },
  { name: 'Calendar', component: Calendar },
  { name: 'Database', component: Database },
  { name: 'Globe', component: Globe },
  { name: 'Settings', component: Settings },
  { name: 'Bell', component: Bell }
]

export function AddAutomationModal({ isOpen, onClose, onSuccess, availableClients }: AddAutomationModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    hourlyRate: 150,
    workflowId: '',
    clientIds: [] as string[]
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field: string, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Real-time validation
    try {
      automationSchema.shape[field as keyof typeof automationSchema.shape].parse(value)
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    } catch (error: any) {
      setErrors(prev => ({ ...prev, [field]: error.errors[0]?.message || 'Invalid value' }))
    }
  }

  const toggleClient = (clientId: string) => {
    const newIds = formData.clientIds.includes(clientId)
      ? formData.clientIds.filter(id => id !== clientId)
      : [...formData.clientIds, clientId]
    handleChange('clientIds', newIds)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Validate entire form
      automationSchema.parse(formData)
      setIsSubmitting(true)

      await createNewAutomation(formData)

      // Reset and close
      setFormData({ name: '', icon: '', hourlyRate: 150, workflowId: '', clientIds: [] })
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
        alert('Błąd podczas tworzenia automatyzacji: ' + error.message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Dodaj Nową Automatyzację">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
            Nazwa Automatyzacji
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white outline-none focus:border-brand-accent transition-colors"
            placeholder="np. Wysyłka Faktur"
          />
          {errors.name && (
            <p className="text-xs text-red-400 mt-1">{errors.name}</p>
          )}
        </div>

        {/* Icon Picker */}
        <div>
          <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
            Ikona
          </label>
          <div className="grid grid-cols-5 gap-2">
            {ICON_OPTIONS.map(({ name, component: Icon }) => (
              <button
                key={name}
                type="button"
                onClick={() => handleChange('icon', name)}
                className={`p-3 rounded-lg border transition-colors ${
                  formData.icon === name
                    ? 'border-brand-accent bg-brand-accent/10'
                    : 'border-white/10 bg-[#111] hover:border-white/20'
                }`}
              >
                <Icon className="h-5 w-5 text-white mx-auto" />
              </button>
            ))}
          </div>
          {errors.icon && (
            <p className="text-xs text-red-400 mt-1">{errors.icon}</p>
          )}
        </div>

        {/* Hourly Rate */}
        <div>
          <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
            Stawka Godzinowa (PLN)
          </label>
          <input
            type="number"
            min="0"
            max="10000"
            step="0.01"
            value={formData.hourlyRate}
            onChange={(e) => handleChange('hourlyRate', parseFloat(e.target.value))}
            className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white outline-none focus:border-brand-accent transition-colors"
            placeholder="150"
          />
          {errors.hourlyRate && (
            <p className="text-xs text-red-400 mt-1">{errors.hourlyRate}</p>
          )}
        </div>

        {/* Workflow ID */}
        <div>
          <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
            Workflow ID (n8n/trigger.dev)
          </label>
          <input
            type="text"
            value={formData.workflowId}
            onChange={(e) => handleChange('workflowId', e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white outline-none focus:border-brand-accent transition-colors font-mono text-sm"
            placeholder="wf_abc123xyz"
          />
          {errors.workflowId && (
            <p className="text-xs text-red-400 mt-1">{errors.workflowId}</p>
          )}
        </div>

        {/* Client Selection */}
        <div>
          <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
            Przypisani Klienci
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-[#111] p-3">
            {availableClients.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-4">
                Brak dostępnych klientów
              </p>
            ) : (
              availableClients.map((client) => (
                <label
                  key={client.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <div className="relative flex items-center justify-center h-5 w-5">
                    <input
                      type="checkbox"
                      checked={formData.clientIds.includes(client.id)}
                      onChange={() => toggleClient(client.id)}
                      className="sr-only"
                    />
                    <div className={`h-5 w-5 rounded border-2 transition-colors ${
                      formData.clientIds.includes(client.id)
                        ? 'bg-brand-accent border-brand-accent'
                        : 'border-white/20'
                    }`}>
                      {formData.clientIds.includes(client.id) && (
                        <Check className="h-full w-full text-white p-0.5" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-white/5 text-xs font-bold text-white">
                      {client.logo}
                    </div>
                    <span className="text-sm text-white font-mono">{client.name}</span>
                  </div>
                </label>
              ))
            )}
          </div>
          {errors.clientIds && (
            <p className="text-xs text-red-400 mt-1">{errors.clientIds}</p>
          )}
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
            {isSubmitting ? 'Tworzenie...' : 'Dodaj Automatyzację'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
