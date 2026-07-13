import { useState, useMemo, useEffect } from 'react'
import { ChevronRight, ChevronDown, Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { fetchCampaignsFull } from '@/lib/supabase'
import type { Campaign, CampaignStatus } from '@/types'

const PAGE_SIZE = 5

const MetricCell = ({ value, formatter = (v: number) => String(v) }: { value: number; formatter?: (v: number) => string }) => (
  <TableCell className="text-right font-mono text-sm">{formatter(value)}</TableCell>
)

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all')
  const [page, setPage] = useState(1)
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set())
  const [expandedAdSets, setExpandedAdSets] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchCampaignsFull().then(setCampaigns)
  }, [])

  const filtered = useMemo(() => {
    return campaigns.filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [campaigns, search, statusFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const toggleCampaign = (id: string) => {
    setExpandedCampaigns(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAdSet = (id: string) => {
    setExpandedAdSets(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const cols = (
    <>
      <TableHead className="text-right">Gasto</TableHead>
      <TableHead className="text-right">Vendas</TableHead>
      <TableHead className="text-right">Receita</TableHead>
      <TableHead className="text-right">ROI %</TableHead>
      <TableHead className="text-right">ROAS</TableHead>
      <TableHead className="text-right">CPA</TableHead>
      <TableHead className="text-right">CPM</TableHead>
      <TableHead className="text-right">CPC</TableHead>
      <TableHead className="text-right">Impressões</TableHead>
      <TableHead className="text-right">Cliques</TableHead>
    </>
  )

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8892a4]" />
          <Input
            placeholder="Buscar campanha..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as CampaignStatus | 'all'); setPage(1) }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="paused">Pausado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="bg-[#1A1A2E] border-[#2d2d4a]">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[240px]">Campanha</TableHead>
                <TableHead>Status</TableHead>
                {cols}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map(campaign => (
                <>
                  {/* Campaign Row */}
                  <TableRow
                    key={campaign.id}
                    className="cursor-pointer select-none font-medium"
                    onClick={() => toggleCampaign(campaign.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {expandedCampaigns.has(campaign.id)
                          ? <ChevronDown className="w-4 h-4 text-[#74B9FF] flex-shrink-0" />
                          : <ChevronRight className="w-4 h-4 text-[#8892a4] flex-shrink-0" />}
                        <span className="truncate max-w-[200px]">{campaign.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={campaign.status === 'active' ? 'active' : 'paused'}>
                        {campaign.status === 'active' ? 'Ativo' : 'Pausado'}
                      </Badge>
                    </TableCell>
                    <MetricCell value={campaign.spend}       formatter={formatCurrency} />
                    <MetricCell value={campaign.sales}       formatter={formatNumber} />
                    <MetricCell value={campaign.revenue}     formatter={formatCurrency} />
                    <MetricCell value={campaign.roi}         formatter={v => `${v.toFixed(1)}%`} />
                    <MetricCell value={campaign.roas}        formatter={v => v.toFixed(2)} />
                    <MetricCell value={campaign.cpa}         formatter={formatCurrency} />
                    <MetricCell value={campaign.cpm}         formatter={v => `R$${v.toFixed(2)}`} />
                    <MetricCell value={campaign.cpc}         formatter={v => `R$${v.toFixed(2)}`} />
                    <MetricCell value={campaign.impressions} formatter={formatNumber} />
                    <MetricCell value={campaign.clicks}      formatter={formatNumber} />
                  </TableRow>

                  {/* AdSet Rows */}
                  {expandedCampaigns.has(campaign.id) && campaign.adSets.map(adSet => (
                    <>
                      <TableRow
                        key={adSet.id}
                        className="cursor-pointer select-none bg-[#12122A]/60 hover:bg-[#12122A]"
                        onClick={e => { e.stopPropagation(); toggleAdSet(adSet.id) }}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2 pl-6">
                            {expandedAdSets.has(adSet.id)
                              ? <ChevronDown className="w-3.5 h-3.5 text-[#00B894] flex-shrink-0" />
                              : <ChevronRight className="w-3.5 h-3.5 text-[#8892a4] flex-shrink-0" />}
                            <span className="text-[#8892a4] text-xs truncate max-w-[190px]">{adSet.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={adSet.status === 'active' ? 'active' : 'paused'} className="text-[10px]">
                            {adSet.status === 'active' ? 'Ativo' : 'Pausado'}
                          </Badge>
                        </TableCell>
                        <MetricCell value={adSet.spend}       formatter={formatCurrency} />
                        <MetricCell value={adSet.sales}       formatter={formatNumber} />
                        <MetricCell value={adSet.revenue}     formatter={formatCurrency} />
                        <MetricCell value={adSet.roi}         formatter={v => `${v.toFixed(1)}%`} />
                        <MetricCell value={adSet.roas}        formatter={v => v.toFixed(2)} />
                        <MetricCell value={adSet.cpa}         formatter={formatCurrency} />
                        <MetricCell value={adSet.cpm}         formatter={v => `R$${v.toFixed(2)}`} />
                        <MetricCell value={adSet.cpc}         formatter={v => `R$${v.toFixed(2)}`} />
                        <MetricCell value={adSet.impressions} formatter={formatNumber} />
                        <MetricCell value={adSet.clicks}      formatter={formatNumber} />
                      </TableRow>

                      {/* Ad Rows */}
                      {expandedAdSets.has(adSet.id) && adSet.ads.map(ad => (
                        <TableRow key={ad.id} className="bg-[#0F0F23]/80 hover:bg-[#0F0F23]">
                          <TableCell>
                            <div className="flex items-center gap-2 pl-12">
                              <span className="text-[#8892a4]/70 text-[10px] truncate max-w-[175px]">{ad.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={ad.status === 'active' ? 'active' : 'paused'} className="text-[10px]">
                              {ad.status === 'active' ? 'Ativo' : 'Pausado'}
                            </Badge>
                          </TableCell>
                          <MetricCell value={ad.spend}       formatter={formatCurrency} />
                          <MetricCell value={ad.sales}       formatter={formatNumber} />
                          <MetricCell value={ad.revenue}     formatter={formatCurrency} />
                          <MetricCell value={ad.roi}         formatter={v => `${v.toFixed(1)}%`} />
                          <MetricCell value={ad.roas}        formatter={v => v.toFixed(2)} />
                          <MetricCell value={ad.cpa}         formatter={formatCurrency} />
                          <MetricCell value={ad.cpm}         formatter={v => `R$${v.toFixed(2)}`} />
                          <MetricCell value={ad.cpc}         formatter={v => `R$${v.toFixed(2)}`} />
                          <MetricCell value={ad.impressions} formatter={formatNumber} />
                          <MetricCell value={ad.clicks}      formatter={formatNumber} />
                        </TableRow>
                      ))}
                    </>
                  ))}
                </>
              ))}

              {paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-12 text-[#8892a4]">
                    Nenhuma campanha encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-[#8892a4]">
          <span>{filtered.length} campanha{filtered.length !== 1 ? 's' : ''}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <span className="text-[#E0E0E0]">{page} / {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
