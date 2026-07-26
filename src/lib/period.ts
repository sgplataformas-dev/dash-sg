import { startOfDay, endOfDay, subDays, parseISO } from 'date-fns'

export type PeriodOption = 'today' | 'yesterday' | '7d' | '30d' | 'max' | 'custom'

export function resolvePeriodRange(period: PeriodOption, customSince: string, customUntil: string): { since: Date; until: Date } {
  const now = new Date()
  if (period === 'custom' && customSince && customUntil) {
    // parseISO interpreta "yyyy-MM-dd" como meia-noite local. new Date(string) faz
    // parsing como UTC, o que deslocava o filtro ~3h (fuso de Brasilia) e vazava
    // o dia anterior inteiro num range de 1 dia so.
    return { since: startOfDay(parseISO(customSince)), until: endOfDay(parseISO(customUntil)) }
  }
  if (period === 'yesterday') {
    const yesterday = subDays(now, 1)
    return { since: startOfDay(yesterday), until: endOfDay(yesterday) }
  }
  if (period === 'max') {
    return { since: new Date('2020-01-01T00:00:00'), until: endOfDay(now) }
  }
  const days = period === 'today' ? 1 : period === '7d' ? 7 : 30
  return { since: startOfDay(subDays(now, days - 1)), until: endOfDay(now) }
}
