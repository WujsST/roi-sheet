'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Calendar, ChevronDown, Check } from 'lucide-react'
import {
  PRESETS,
  type PresetKey,
  type RangeISO,
  presetRange,
  toRangeISO,
  detectPreset,
  formatRangeLabel,
} from '@/lib/date-range'
import { parseISO } from 'date-fns'

type Props = {
  /** Initial range, parsed server-side from URL params. */
  initial: RangeISO
}

export function DateRangePicker({ initial }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [open, setOpen] = useState(false)
  const [draftFrom, setDraftFrom] = useState(initial.from)
  const [draftTo, setDraftTo] = useState(initial.to)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  // When initial changes from server (URL changes), sync draft
  useEffect(() => {
    setDraftFrom(initial.from)
    setDraftTo(initial.to)
  }, [initial.from, initial.to])

  const activePreset = detectPreset({
    from: parseISO(initial.from),
    to: parseISO(initial.to),
  })
  const label = formatRangeLabel({
    from: parseISO(initial.from),
    to: parseISO(initial.to),
  })

  function applyRange(range: RangeISO) {
    const sp = new URLSearchParams(searchParams.toString())
    sp.set('from', range.from)
    sp.set('to', range.to)
    startTransition(() => {
      router.replace(`${pathname}?${sp.toString()}`)
    })
    setOpen(false)
  }

  function applyPreset(preset: PresetKey) {
    if (preset === 'custom') {
      // Just keep panel open and switch to custom mode
      return
    }
    const range = toRangeISO(presetRange(preset))
    applyRange(range)
  }

  function applyCustom() {
    if (!draftFrom || !draftTo) return
    if (draftFrom > draftTo) return
    applyRange({ from: draftFrom, to: draftTo })
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className="flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white font-mono hover:bg-white/5 transition-colors uppercase tracking-wide disabled:opacity-60"
      >
        <Calendar className="h-4 w-4 text-text-muted" />
        <span className="normal-case">{label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-2xl border border-white/10 bg-[#0a0a0a] p-3 shadow-2xl">
          <div className="mb-2 px-2 pt-1 text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Zakres
          </div>
          <ul className="space-y-1">
            {PRESETS.map((p) => (
              <li key={p.key}>
                <button
                  type="button"
                  onClick={() => applyPreset(p.key)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    activePreset === p.key
                      ? 'bg-white/10 text-white'
                      : 'text-text-muted hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>{p.label}</span>
                  {activePreset === p.key && <Check className="h-4 w-4 text-brand-accent" />}
                </button>
              </li>
            ))}
          </ul>

          {/* Custom input always visible — power users skip the preset list */}
          <div className="mt-3 border-t border-white/5 pt-3">
            <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-text-muted">
              Własny zakres
            </div>
            <div className="flex flex-col gap-2 px-2">
              <label className="flex items-center gap-2 text-xs text-text-muted">
                <span className="w-8 font-mono">Od</span>
                <input
                  type="date"
                  value={draftFrom}
                  max={draftTo}
                  onChange={(e) => setDraftFrom(e.target.value)}
                  className="flex-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-text-muted">
                <span className="w-8 font-mono">Do</span>
                <input
                  type="date"
                  value={draftTo}
                  min={draftFrom}
                  onChange={(e) => setDraftTo(e.target.value)}
                  className="flex-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
                />
              </label>
              <button
                type="button"
                onClick={applyCustom}
                className="mt-2 rounded-full bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-black hover:bg-gray-200 transition-colors"
              >
                Zastosuj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
