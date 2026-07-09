import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import { mockSales } from '@/data/mockData'
import type { CheckoutType, SaleStatus, SaleType } from '@/types'

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
  const [search, setSearch] = useState('')
  const [checkout, setCheckout] = useState<CheckoutType | 'all'>('all')
  const [type, setType] = useState<SaleType | 'all'>('all')
  const [status, setStatus] = useState<SaleStatus | 'all'>('all')

  const filtered = useMemo(() => {
    return mockSales.filter(s => {
      if (checkout !== 'all' && s.checkout !== checkout) return false
      if (type !== 'all' && s.type !== type) return false
      if (status !== 'all' && s.status !== status) return false
      if (search && !s.product.toLowerCase().includes(search.toLowerCase()) &&
          !s.campaign.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [search, checkout, type, status])

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
            <SelectItem value="Hotmart">Hotmart</SelectItem>
            <SelectItem value="Kiwify">Kiwify</SelectItem>
            <SelectItem value="Kirvano">Kirvano</SelectItem>
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
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 text-sm text-[#8892a4]">
        <span><span className="text-[#E0E0E0] font-medium">{filtered.length}</span> vendas</span>
        <span>Total aprovado: <span className="text-[#00B894] font-semibold">{formatCurrency(totalRevenue)}</span></span>
      </div>

      {/* Table */}
      <Card className="bg-[#1A1A2E] border-[#2d2d4a]">
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
                  <TableCell className="text-[#8892a4] text-sm whitespace-nowrap">{sale.date}</TableCell>
                  <TableCell className="font-medium whitespace-nowrap">{sale.product}</TableCell>
                  <TableCell className="text-right font-mono">
                    {sale.value > 0 ? formatCurrency(sale.value) : <span className="text-[#8892a4]">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="info">{sale.checkout}</Badge>
                  </TableCell>
                  <TableCell className="text-[#8892a4] text-xs max-w-[180px] truncate">{sale.campaign}</TableCell>
                  <TableCell className="text-[#8892a4] text-xs max-w-[160px] truncate">{sale.adSet}</TableCell>
                  <TableCell className="text-[#8892a4] text-xs max-w-[160px] truncate">{sale.ad}</TableCell>
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
                  <TableCell colSpan={9} className="text-center py-12 text-[#8892a4]">
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
