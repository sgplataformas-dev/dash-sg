import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import type { PeriodOption } from '@/lib/period'

export function PeriodFilter({
  period, onPeriodChange, customSince, customUntil, onCustomSinceChange, onCustomUntilChange,
}: {
  period: PeriodOption
  onPeriodChange: (p: PeriodOption) => void
  customSince: string
  customUntil: string
  onCustomSinceChange: (v: string) => void
  onCustomUntilChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Select value={period} onValueChange={(v) => onPeriodChange(v as PeriodOption)}>
        <SelectTrigger className="w-40 h-9 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Hoje</SelectItem>
          <SelectItem value="7d">7 dias</SelectItem>
          <SelectItem value="30d">30 dias</SelectItem>
          <SelectItem value="custom">Personalizado</SelectItem>
        </SelectContent>
      </Select>
      {period === 'custom' && (
        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            value={customSince}
            onChange={e => onCustomSinceChange(e.target.value)}
            className="h-9 w-[150px] text-sm"
          />
          <span className="text-muted-foreground text-sm">até</span>
          <Input
            type="date"
            value={customUntil}
            onChange={e => onCustomUntilChange(e.target.value)}
            className="h-9 w-[150px] text-sm"
          />
        </div>
      )}
    </div>
  )
}
