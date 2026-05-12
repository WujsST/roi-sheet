import {
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfQuarter,
  endOfQuarter,
  subDays,
  format,
  parseISO,
  isValid,
  startOfDay,
} from 'date-fns'
import { pl } from 'date-fns/locale'

export type DateRange = { from: Date; to: Date }
export type RangeISO = { from: string; to: string }

export type PresetKey =
  | 'this_month'
  | 'prev_month'
  | 'last_7'
  | 'last_30'
  | 'last_90'
  | 'this_quarter'
  | 'custom'

export const PRESETS: { key: PresetKey; label: string }[] = [
  { key: 'this_month', label: 'Ten miesiąc' },
  { key: 'prev_month', label: 'Poprzedni miesiąc' },
  { key: 'last_7', label: 'Ostatnie 7 dni' },
  { key: 'last_30', label: 'Ostatnie 30 dni' },
  { key: 'last_90', label: 'Ostatnie 90 dni' },
  { key: 'this_quarter', label: 'Ten kwartał' },
  { key: 'custom', label: 'Niestandardowy' },
]

export function presetRange(key: PresetKey, today: Date = new Date()): DateRange {
  const t = startOfDay(today)
  switch (key) {
    case 'this_month':
      return { from: startOfMonth(t), to: endOfMonth(t) }
    case 'prev_month': {
      const prev = subMonths(t, 1)
      return { from: startOfMonth(prev), to: endOfMonth(prev) }
    }
    case 'last_7':
      return { from: subDays(t, 6), to: t }
    case 'last_30':
      return { from: subDays(t, 29), to: t }
    case 'last_90':
      return { from: subDays(t, 89), to: t }
    case 'this_quarter':
      return { from: startOfQuarter(t), to: endOfQuarter(t) }
    case 'custom':
      return { from: startOfMonth(t), to: endOfMonth(t) }
  }
}

export function defaultRange(): DateRange {
  return presetRange('this_month')
}

export function toRangeISO(range: DateRange): RangeISO {
  return {
    from: format(range.from, 'yyyy-MM-dd'),
    to: format(range.to, 'yyyy-MM-dd'),
  }
}

/**
 * Detect which preset (if any) a given range matches. Returns 'custom' when none match.
 */
export function detectPreset(range: DateRange, today: Date = new Date()): PresetKey {
  const target = toRangeISO(range)
  for (const preset of PRESETS) {
    if (preset.key === 'custom') continue
    const candidate = toRangeISO(presetRange(preset.key, today))
    if (candidate.from === target.from && candidate.to === target.to) {
      return preset.key
    }
  }
  return 'custom'
}

/**
 * Parse `from` / `to` from URL search params. Returns the default range when missing
 * or invalid — the dashboard uses the result directly so it must always be valid.
 */
export function parseRangeFromSearchParams(sp: {
  from?: string | string[]
  to?: string | string[]
}): DateRange {
  const fromRaw = Array.isArray(sp.from) ? sp.from[0] : sp.from
  const toRaw = Array.isArray(sp.to) ? sp.to[0] : sp.to
  if (!fromRaw || !toRaw) return defaultRange()

  const from = parseISO(fromRaw)
  const to = parseISO(toRaw)
  if (!isValid(from) || !isValid(to) || from > to) return defaultRange()

  return { from: startOfDay(from), to: startOfDay(to) }
}

/**
 * Returns true if the given range ends more than `maxDaysOld` days ago.
 * Used by dashboard to detect when bookmarked/cached URL params are stale.
 */
export function isStaleRange(range: DateRange, maxDaysOld: number = 60, today: Date = new Date()): boolean {
  const diffMs = startOfDay(today).getTime() - startOfDay(range.to).getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return diffDays > maxDaysOld
}

/**
 * Human-readable label for a date range. Uses Polish locale.
 *  - same month → "marzec 2026"
 *  - same year → "1 mar – 31 maj 2026"
 *  - cross-year → "1 lis 2025 – 31 sty 2026"
 */
export function formatRangeLabel(range: DateRange): string {
  const { from, to } = range
  const sameMonth =
    from.getFullYear() === to.getFullYear() && from.getMonth() === to.getMonth()
  const sameYear = from.getFullYear() === to.getFullYear()
  if (sameMonth && from.getDate() === 1) {
    const last = endOfMonth(from)
    if (last.getDate() === to.getDate()) {
      return format(from, 'LLLL yyyy', { locale: pl })
    }
  }
  if (sameYear) {
    return `${format(from, 'd MMM', { locale: pl })} – ${format(to, 'd MMM yyyy', {
      locale: pl,
    })}`
  }
  return `${format(from, 'd MMM yyyy', { locale: pl })} – ${format(to, 'd MMM yyyy', {
    locale: pl,
  })}`
}
