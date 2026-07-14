import { useState, useMemo, useEffect } from 'react'
import { ChevronRight, ChevronDown, Search, NotebookPen, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { fetchCampaignsFull, fetchActionLog, addActionLogEntry, deleteActionLogEntry } from '@/lib/supabase'
import { PeriodFilter } from '@/components/PeriodFilter'
import { resolvePeriodRange, type PeriodOption } from '@/lib/period'
import { subDays, format as formatDateFns } from 'date-fns'
import type { Campaign, CampaignStatus, ActionLogEntry } from '@/types'

const PAGE_SIZE = 5

const MetricCell = ({ value, formatter = (v: number) => String(v) }: { value: number; formatter?: (v: number) => string }) => (
  <TableCell className="text-right font-mono text-sm">{formatter(value)}</TableCell>
)

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all')
  const [period, setPeriod] = useState<PeriodOption>('30d')
  const [customSince, setCustomSince] = useState(formatDateFns(subDays(new Date(), 6), 'yyyy-MM-dd'))
  const [customUntil, setCustomUntil] = useState(formatDateFns(new Date(), 'yyyy-MM-dd'))
  const [page, setPage] = useState(1)
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set())
  const [expandedAdSets, setExpandedAdSets] = useState<Set<string>>(new Set())
  const [actionLog, setActionLog] = useState<ActionLogEntry[]>([])
  const [logCampaign, setLogCampaign] = useState('')
  const [logAction, setLogAction] = useState('')
  const [logResult, setLogResult] = useState('')
  const [savingLog, setSavingLog] = useState(false)

  const { since, until } = useMemo(() => resolvePeriodRange(period, customSince, customUntil), [period, customSince, customUntil])

  useEffect(() => {
    fetchCampaignsFull(since, until).then(setCampaigns)
  }, [since, until])

  const loadActionLog = () => { fetchActionLog().then(setActionLog) }
  useEffect(() => { loadActionLog() }, [])

  const handleAddLogEntry = async () => {
    if (!logAction.trim()) return
    setSavingLog(true)
    try {
      await addActionLogEntry({
        entryDate: formatDateFns(new Date(), 'yyyy-MM-dd'),
        campaignName: logCampaign.trim() || null,
        actionTaken: logAction.trim(),
        observedResult: logResult.trim() || null,
      })
      setLogCampaign('')
      setLogAction('')
      setLogResult('')
      loadActionLog()
    } finally {
      setSavingLog(false)
    }
  }

  const handleDeleteLogEntry = async (id: string) => {
    await deleteActionLogEntry(id)
    loadActionLog()
  }

  const filtered = useMemo(() => {
    return campaigns
      .filter(c => {
        if (statusFilter !== 'all' && c.status !== statusFilter) return false
        if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
        return true
      })
      .sort((a, b) => {
        if (a.revenue !== b.revenue) return b.revenue - a.revenue
        return b.spend - a.spend
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
        <PeriodFilter
          period={period}
          onPeriodChange={(p) => { setPeriod(p); setPage(1) }}
          customSince={customSince}
          customUntil={customUntil}
          onCustomSinceChange={setCustomSince}
          onCustomUntilChange={setCustomUntil}
        />
      </div>

      {/* Diário de Ações */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <NotebookPen className="w-4 h-4 text-brand-green" />
            <CardTitle className="text-base">Diário de Ações</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">Registre ações tomadas e resultados observados para medir a efetividade ao longo do tempo.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input
              placeholder="Campanha (opcional)"
              value={logCampaign}
              onChange={e => setLogCampaign(e.target.value)}
            />
            <Input
              placeholder="Ação tomada"
              value={logAction}
              onChange={e => setLogAction(e.target.value)}
              className="sm:col-span-1"
            />
            <div className="flex gap-2">
              <Input
                placeholder="Resultado observado (opcional)"
                value={logResult}
                onChange={e => setLogResult(e.target.value)}
              />
              <Button size="icon" onClick={handleAddLogEntry} disabled={savingLog || !logAction.trim()} className="flex-shrink-0">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
            {actionLog.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">Nenhum registro ainda. Adicione o primeiro acima.</p>
            )}
            {actionLog.map(entry => (
              <div key={entry.id} className="flex items-start justify-between gap-3 bg-inner rounded-xl p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono-tab text-muted-foreground">{formatDateFns(new Date(entry.entryDate + 'T00:00:00'), 'dd/MM/yyyy')}</span>
                    {entry.campaignName && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-blue/10 text-brand-blue truncate max-w-[200px]">{entry.campaignName}</span>}
                  </div>
                  <p className="text-sm text-foreground mt-1">{entry.actionTaken}</p>
                  {entry.observedResult && <p className="text-xs text-muted-foreground mt-0.5">→ {entry.observedResult}</p>}
                </div>
                <button onClick={() => handleDeleteLogEntry(entry.id)} className="text-muted-foreground hover:text-brand-red transition-colors flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="">
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
                          ? <ChevronDown className="w-4 h-4 text-brand-blue flex-shrink-0" />
                          : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
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
                        className="cursor-pointer select-none bg-inner/60 hover:bg-inner"
                        onClick={e => { e.stopPropagation(); toggleAdSet(adSet.id) }}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2 pl-6">
                            {expandedAdSets.has(adSet.id)
                              ? <ChevronDown className="w-3.5 h-3.5 text-brand-green flex-shrink-0" />
                              : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                            <span className="text-muted-foreground text-xs truncate max-w-[190px]">{adSet.name}</span>
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
                        <TableRow key={ad.id} className="bg-background/80 hover:bg-background">
                          <TableCell>
                            <div className="flex items-center gap-2 pl-12">
                              <span className="text-muted-foreground/70 text-[10px] truncate max-w-[175px]">{ad.name}</span>
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
                  <TableCell colSpan={12} className="text-center py-12 text-muted-foreground">
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
        <div className="flex items-center justify-between text-sm text-muted-foreground">
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
            <span className="text-foreground">{page} / {totalPages}</span>
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
