import { startOfDay, endOfDay, subDays } from 'date-fns'

export type PeriodOption = 'today' | '7d' | '30d' | 'custom'

export function resolvePeriodRange(period: PeriodOption, customSince: string, customUntil: string): { since: Date; until: Date } {
  const now = new Date()
  if (period === 'custom' && customSince && customUntil) {
    return { since: startOfDay(new Date(customSince)), until: endOfDay(new Date(customUntil)) }
  }
  const days = period === 'today' ? 1 : period === '7d' ? 7 : 30
  return { since: startOfDay(subDays(now, days - 1)), until: endOfDay(now) }
}
