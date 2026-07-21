import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import { fetchSales, subscribeToSales } from '@/lib/supabase'
import { PeriodFilter } from '@/components/PeriodFilter'
import { resolvePeriodRange, type PeriodOption } from '@/lib/period'
import { subDays, format as formatDateFns } from 'date-fns'
import type { CheckoutType, Sale, SaleStatus, SaleType } from '@/types'

const statusVariant: Record<SaleStatus, 'success' | 'warning' | 'error'> = {
  aprovada:    'success',
  pendente:    'warning',
  reembolsada: 'error',
}

const statusLabel: Record<SaleStatus, string> = {
  aprovada:    'Aprovada',
  pendente:    'Pendente',
  reembolsada: 'Reembolsada',
}

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([])
  const [search, setSearch] = useState('')
  const [checkout, setCheckout] = useState<CheckoutType | 'all'>('all')
  const [type, setType] = useState<SaleType | 'all'>('all')
  const [status, setStatus] = useState<SaleStatus | 'all'>('all')
  const [period, setPeriod] = useState<PeriodOption>('30d')
  const [customSince, setCustomSince] = useState(formatDateFns(subDays(new Date(), 6), 'yyyy-MM-dd'))
  const [customUntil, setCustomUntil] = useState(formatDateFns(new Date(), 'yyyy-MM-dd'))

  const { since, until } = useMemo(() => resolvePeriodRange(period, customSince, customUntil), [period, customSince, customUntil])

  useEffect(() => {
    fetchSales(since, until).then(setSales)
    return subscribeToSales(() => { fetchSales(since, until).then(setSales) })
  }, [since, until])

  const filtered = useMemo(() => {
    return sales.filter(s => {
      if (checkout !== 'all' && s.checkout !== checkout) return false
      if (type !== 'all' && s.type !== type) return false
      if (status !== 'all' && s.status !== status) return false
      if (search && !s.product.toLowerCase().includes(search.toLowerCase()) &&
          !s.campaign.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [sales, search, checkout, type, status])

  const totalRevenue = filtered.filter(s => s.status === 'aprovada').reduce((sum, s) => sum + s.value, 0)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Input
            placeholder="Buscar produto ou campanha..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={checkout} onValueChange={v => setCheckout(v as CheckoutType | 'all')}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Checkout" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Payt">Payt</SelectItem>
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={v => setType(v as SaleType | 'all')}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="paga">Paga</SelectItem>
            <SelectItem value="organica">Orgânica</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={v => setStatus(v as SaleStatus | 'all')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="aprovada">Aprovada</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="reembolsada">Reembolsada</SelectItem>
          </SelectContent>
        </Select>
        <PeriodFilter
          period={period}
          onPeriodChange={setPeriod}
          customSince={customSince}
          customUntil={customUntil}
          onCustomSinceChange={setCustomSince}
          onCustomUntilChange={setCustomUntil}
        />
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span><span className="text-foreground font-medium">{filtered.length}</span> vendas</span>
        <span>Total aprovado: <span className="text-brand-green font-semibold">{formatCurrency(totalRevenue)}</span></span>
      </div>

      {/* Table */}
      <Card className="">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Checkout</TableHead>
                <TableHead className="min-w-[180px]">Campanha</TableHead>
                <TableHead className="min-w-[160px]">Conjunto</TableHead>
                <TableHead className="min-w-[160px]">Anúncio</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tipo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(sale => (
                <TableRow key={sale.id}>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{sale.date}</TableCell>
                  <TableCell className="font-medium whitespace-nowrap">{sale.product}</TableCell>
                  <TableCell className="text-right font-mono">
                    {sale.value > 0 ? formatCurrency(sale.value) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="info">{sale.checkout}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs max-w-[180px] truncate">{sale.campaign}</TableCell>
                  <TableCell className="text-muted-foreground text-xs max-w-[160px] truncate">{sale.adSet}</TableCell>
                  <TableCell className="text-muted-foreground text-xs max-w-[160px] truncate">{sale.ad}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[sale.status]}>{statusLabel[sale.status]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={sale.type === 'paga' ? 'info' : 'gray'}>
                      {sale.type === 'paga' ? 'Paga' : 'Orgânica'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    Nenhuma venda encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
