import { useState, useEffect, useMemo } from 'react'
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, Target,
  ShoppingCart, Wallet, Receipt, ShoppingBag, BarChart3, Zap, CreditCard, RotateCcw,
  Eye, MousePointer2, Play, Smartphone, UserCheck, Plus, Trash2, NotebookPen,
} from 'lucide-react'
import { subDays, isSameDay, eachDayOfInterval, format as formatDateFns } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PeriodFilter } from '@/components/PeriodFilter'
import { resolvePeriodRange, type PeriodOption } from '@/lib/period'
import { formatCurrency, formatNumber } from '@/lib/utils'
import {
  fetchRawSales, fetchCampaignsFull, subscribeToSales, getSetting, type RawSale,
  fetchActionLog, addActionLogEntry, deleteActionLogEntry,
} from '@/lib/supabase'
import type { Rate, Campaign, ActionLogEntry } from '@/types'

const PIE_COLORS = ['#4FA3FF', '#12E28A', '#8B6BF2', '#FFC24B']
const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

function sourceCategory(s: RawSale): string {
  if (s.isOrganic || !s.utmSource) return 'Orgânico'
  const src = s.utmSource.toLowerCase()
  if (src.includes('instagram')) return 'Instagram'
  if (src.includes('facebook') || src.includes('fb')) return 'Facebook'
  return 'Outros'
}

function paymentLabel(method: string | null): string {
  if (method === 'credit_card' || method === 'card') return 'Cartão'
  if (method === 'pix') return 'PIX'
  return 'Outros'
}

function sparklinePath(values: number[]): string {
  if (values.length < 2) return ''
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const step = 100 / (values.length - 1)
  return values
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)} ${(18 - ((v - min) / range) * 16).toFixed(1)}`)
    .join(' ')
}

function MetricCard({ label, value, curr, prev, icon: Icon, inverted = false, noCompare = false, subtitle, sparkline }: {
  label: string; value: string; curr: number; prev: number
  icon: React.ElementType; inverted?: boolean; noCompare?: boolean; subtitle?: string; sparkline?: number[]
}) {
  const pct = prev === 0 ? 0 : ((curr - prev) / Math.abs(prev)) * 100
  const isGood = inverted ? pct < 0 : pct > 0
  const sparkColor = noCompare ? 'text-muted-foreground' : isGood ? 'text-brand-green' : 'text-brand-red'
  return (
    <Card>
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${noCompare ? 'bg-inner text-muted-foreground' : isGood ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-red/10 text-brand-red'}`}>
            <Icon className="w-4 h-4" />
          </div>
          {noCompare ? (
            <span className="px-2 py-1 rounded-full bg-inner text-muted-foreground text-[10px] font-mono-tab">período completo</span>
          ) : (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold font-mono-tab ${isGood ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-red/10 text-brand-red'}`}>
              {isGood ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(pct).toFixed(1)}%
            </div>
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className="text-xl font-mono-tab font-semibold text-foreground mt-1">{value}</p>
          {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {sparkline && sparkline.length > 1 && (
          <svg viewBox="0 0 100 20" className={`w-full h-4 ${sparkColor}`} preserveAspectRatio="none">
            <path d={sparklinePath(sparkline)} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </CardContent>
    </Card>
  )
}

function ProgressList({ items }: { items: { label: string; count: number; extra?: string }[] }) {
  const max = Math.max(1, ...items.map(i => i.count))
  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.label}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-foreground">{item.label}</span>
            <span className="text-muted-foreground font-mono-tab">{item.extra ?? item.count}</span>
          </div>
          <div className="h-1.5 bg-inner rounded-full overflow-hidden">
            <div className="h-full bg-brand-green rounded-full" style={{ width: `${(item.count / max) * 100}%` }} />
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">Sem dados para o período.</p>}
    </div>
  )
}

export default function Dashboard() {
  const [period, setPeriod] = useState<PeriodOption>('7d')
  const [customSince, setCustomSince] = useState(formatDateFns(subDays(new Date(), 6), 'yyyy-MM-dd'))
  const [customUntil, setCustomUntil] = useState(formatDateFns(new Date(), 'yyyy-MM-dd'))
  const [sales, setSales] = useState<RawSale[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [actionLog, setActionLog] = useState<ActionLogEntry[]>([])
  const [logCampaign, setLogCampaign] = useState('')
  const [logAction, setLogAction] = useState('')
  const [logResult, setLogResult] = useState('')
  const [savingLog, setSavingLog] = useState(false)

  const { since, until } = useMemo(() => resolvePeriodRange(period, customSince, customUntil), [period, customSince, customUntil])
  const { prevSince, prevUntil } = useMemo(() => {
    const duration = until.getTime() - since.getTime()
    const pUntil = new Date(since.getTime() - 1)
    const pSince = new Date(pUntil.getTime() - duration)
    return { prevSince: pSince, prevUntil: pUntil }
  }, [since, until])

  useEffect(() => {
    fetchRawSales().then(setSales)
    return subscribeToSales(() => { fetchRawSales().then(setSales) })
  }, [])

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

  const syncedAdSpend = useMemo(() => campaigns.reduce((sum, c) => sum + c.spend, 0), [campaigns])

  const metaAgg = useMemo(() => {
    const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0)
    const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0)
    const cpm = totalImpressions > 0 ? (syncedAdSpend / totalImpressions) * 1000 : 0
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
    const cpc = totalClicks > 0 ? syncedAdSpend / totalClicks : 0
    const cpvCampaigns = campaigns.filter(c => c.cpv > 0)
    const cpvSpend = cpvCampaigns.reduce((s, c) => s + c.spend, 0)
    const cpv = cpvSpend > 0 ? cpvCampaigns.reduce((s, c) => s + c.cpv * c.spend, 0) / cpvSpend : 0
    const cpiCampaigns = campaigns.filter(c => c.cpi > 0)
    const cpiSpend = cpiCampaigns.reduce((s, c) => s + c.spend, 0)
    const cpi = cpiSpend > 0 ? cpiCampaigns.reduce((s, c) => s + c.cpi * c.spend, 0) / cpiSpend : 0
    return { cpm, ctr, cpc, cpv, cpi }
  }, [campaigns, syncedAdSpend])

  const rates = useMemo<Rate[]>(() => {
    const raw = getSetting('rates')
    if (!raw) return []
    try { return JSON.parse(raw) as Rate[] } catch { return [] }
  }, [])
  const taxPercent = rates.reduce((sum, r) => (r.appliesTo === 'revenue' && r.type === 'percent') ? sum + r.value : sum, 0)

  const approved = useMemo(() => sales.filter(s => s.status === 'approved'), [sales])
  const refunded = useMemo(() => sales.filter(s => s.status === 'refunded' || s.status === 'chargeback'), [sales])

  const splitByPeriod = (list: RawSale[]) => ({
    curr: list.filter(s => { const d = new Date(s.date); return d >= since && d <= until }),
    prev: list.filter(s => { const d = new Date(s.date); return d >= prevSince && d <= prevUntil }),
  })

  const periodSales = useMemo(() => splitByPeriod(approved), [approved, since, until, prevSince, prevUntil])
  const periodRefunds = useMemo(() => splitByPeriod(refunded), [refunded, since, until, prevSince, prevUntil])

  const metrics = useMemo(() => {
    const { curr, prev } = periodSales
    const grossRevenue = curr.reduce((sum, s) => sum + s.amount, 0)
    const prevGrossRevenue = prev.reduce((sum, s) => sum + s.amount, 0)
    const adSpend = syncedAdSpend
    const prevAdSpend = 0
    const impostoMeta = grossRevenue * taxPercent / 100
    const prevImpostoMeta = prevGrossRevenue * taxPercent / 100
    const profit = grossRevenue - adSpend - impostoMeta
    const prevProfit = prevGrossRevenue - prevAdSpend - prevImpostoMeta
    const sales = curr.length
    const prevSales = prev.length
    const roi = adSpend > 0 ? (profit / adSpend) * 100 : 0
    const prevRoi = prevAdSpend > 0 ? (prevProfit / prevAdSpend) * 100 : 0
    const roas = adSpend > 0 ? grossRevenue / adSpend : 0
    const prevRoas = prevAdSpend > 0 ? prevGrossRevenue / prevAdSpend : 0
    const cpa = adSpend > 0 && sales > 0 ? adSpend / sales : 0
    const prevCpa = prevAdSpend > 0 && prevSales > 0 ? prevAdSpend / prevSales : 0
    const ticketMedio = sales > 0 ? grossRevenue / sales : 0
    const prevTicketMedio = prevSales > 0 ? prevGrossRevenue / prevSales : 0

    const refundAmount = periodRefunds.curr.reduce((sum, s) => sum + s.amount, 0)
    const prevRefundAmount = periodRefunds.prev.reduce((sum, s) => sum + s.amount, 0)
    const refundCount = periodRefunds.curr.length
    const prevRefundCount = periodRefunds.prev.length

    const uniqueBuyers = new Set(curr.map(s => s.customerEmail).filter(Boolean)).size
    const prevUniqueBuyers = new Set(prev.map(s => s.customerEmail).filter(Boolean)).size

    return {
      grossRevenue, prevGrossRevenue, adSpend, prevAdSpend,
      impostoMeta, prevImpostoMeta, profit, prevProfit,
      sales, prevSales, roi, prevRoi, roas, prevRoas, cpa, prevCpa,
      ticketMedio, prevTicketMedio, comprasFB: 0, prevComprasFB: 0,
      refundAmount, prevRefundAmount, refundCount, prevRefundCount,
      uniqueBuyers, prevUniqueBuyers,
    }
  }, [periodSales, periodRefunds, taxPercent, syncedAdSpend])

  const chartData = useMemo(() => {
    return eachDayOfInterval({ start: since, end: until }).map(day => {
      const daySales = approved.filter(s => isSameDay(new Date(s.date), day))
      const dayRevenue = daySales.reduce((sum, s) => sum + s.amount, 0)
      return { date: formatDateFns(day, 'dd/MM'), revenue: dayRevenue, spend: 0, sales: daySales.length, cpa: 0, roas: 0 }
    })
  }, [approved, since, until])

  const salesBySource = useMemo(() => {
    const counts = new Map<string, number>()
    periodSales.curr.forEach(s => {
      const cat = sourceCategory(s)
      counts.set(cat, (counts.get(cat) ?? 0) + 1)
    })
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }))
  }, [periodSales])

  const salesByPayment = useMemo(() => {
    const counts = new Map<string, number>()
    periodSales.curr.forEach(s => {
      const label = paymentLabel(s.paymentMethod)
      counts.set(label, (counts.get(label) ?? 0) + 1)
    })
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }))
  }, [periodSales])

  const salesByProduct = useMemo(() => {
    const counts = new Map<string, number>()
    periodSales.curr.forEach(s => {
      const name = s.productName ?? 'Produto'
      counts.set(name, (counts.get(name) ?? 0) + 1)
    })
    const total = periodSales.curr.length
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, count]) => ({ label, count, extra: `${count} · ${total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'}%` }))
  }, [periodSales])

  const salesByHour = useMemo(() => {
    const buckets = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}h`, sales: 0 }))
    periodSales.curr.forEach(s => {
      const h = new Date(s.date).getHours()
      buckets[h].sales += 1
    })
    return buckets
  }, [periodSales])

  const salesByWeekday = useMemo(() => {
    const buckets = WEEKDAY_LABELS.map(label => ({ day: label, sales: 0 }))
    periodSales.curr.forEach(s => {
      const jsDay = new Date(s.date).getDay()
      const idx = (jsDay + 6) % 7
      buckets[idx].sales += 1
    })
    return buckets
  }, [periodSales])

  const funnelStages = [
    { label: 'Page View', value: 0 },
    { label: 'View Content', value: 0 },
    { label: 'Initiate Checkout', value: 0 },
    { label: 'Purchase', value: metrics.sales },
  ]
  const funnelBase = funnelStages[0].value
  const funnelPct = (v: number) => funnelBase > 0 ? `${((v / funnelBase) * 100).toFixed(1)}%` : '—'

  const fluxoStages = [
    { label: 'Cliques no Link', value: 0 },
    { label: 'Page View', value: 0 },
    { label: 'IC', value: 0 },
    { label: 'Purchase', value: metrics.sales },
  ]

  const topCampaigns = [...campaigns].filter(c => c.sales > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

  const revenueSparkline = chartData.map(d => d.revenue)
  const salesSparkline = chartData.map(d => d.sales)

  const kpis: { label: string; value: string; curr: number; prev: number; icon: React.ElementType; inverted?: boolean; noCompare?: boolean; subtitle?: string; sparkline?: number[] }[] = [
    { label: 'Faturamento Bruto', value: formatCurrency(metrics.grossRevenue), curr: metrics.grossRevenue, prev: metrics.prevGrossRevenue, icon: DollarSign, sparkline: revenueSparkline },
    { label: 'Gasto com Ads',     value: formatCurrency(metrics.adSpend),      curr: metrics.adSpend,      prev: metrics.prevAdSpend,      icon: Target, noCompare: true },
    { label: 'Lucro',             value: formatCurrency(metrics.profit),       curr: metrics.profit,       prev: metrics.prevProfit,       icon: Wallet },
    { label: 'ROI',               value: `${metrics.roi.toFixed(1)}%`,         curr: metrics.roi,          prev: metrics.prevRoi,          icon: TrendingUp, noCompare: true },
    { label: 'ROAS',              value: `${metrics.roas.toFixed(2)}x`,        curr: metrics.roas,         prev: metrics.prevRoas,         icon: BarChart3, noCompare: true },
    { label: 'CPA',               value: formatCurrency(metrics.cpa),          curr: metrics.cpa,          prev: metrics.prevCpa,          icon: Zap, noCompare: true },
    { label: 'Imposto Meta',      value: formatCurrency(metrics.impostoMeta),  curr: metrics.impostoMeta,  prev: metrics.prevImpostoMeta,  icon: Receipt, noCompare: true },
    { label: 'Vendas Totais',     value: formatNumber(metrics.sales),          curr: metrics.sales,        prev: metrics.prevSales,        icon: ShoppingCart, sparkline: salesSparkline },
    { label: 'Vendas Únicas',     value: formatNumber(metrics.uniqueBuyers),   curr: metrics.uniqueBuyers, prev: metrics.prevUniqueBuyers, icon: UserCheck },
    { label: 'Reembolsos',        value: formatCurrency(metrics.refundAmount), curr: metrics.refundAmount, prev: metrics.prevRefundAmount, icon: RotateCcw, inverted: true, subtitle: `(${formatNumber(metrics.refundCount)})` },
    { label: 'Compras FB',        value: formatNumber(metrics.comprasFB),      curr: metrics.comprasFB,    prev: metrics.prevComprasFB,    icon: ShoppingBag, noCompare: true },
  ]

  const metaKpis: { label: string; value: string; curr: number; prev: number; icon: React.ElementType; inverted?: boolean; noCompare?: boolean }[] = [
    { label: 'CPM',  value: formatCurrency(metaAgg.cpm),          curr: metaAgg.cpm, prev: 0, icon: Eye,           inverted: true, noCompare: true },
    { label: 'CTR',  value: `${metaAgg.ctr.toFixed(2)}%`,         curr: metaAgg.ctr, prev: 0, icon: MousePointer2,                 noCompare: true },
    { label: 'CPC',  value: formatCurrency(metaAgg.cpc),          curr: metaAgg.cpc, prev: 0, icon: MousePointer2, inverted: true, noCompare: true },
    { label: 'CPV',  value: formatCurrency(metaAgg.cpv),          curr: metaAgg.cpv, prev: 0, icon: Play,          inverted: true, noCompare: true },
    { label: 'CPI',  value: formatCurrency(metaAgg.cpi),          curr: metaAgg.cpi, prev: 0, icon: Smartphone,    inverted: true, noCompare: true },
  ]

  return (
    <div className="space-y-5">
      {/* Period selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-foreground">Visão Geral</h2>
        <PeriodFilter
          period={period}
          onPeriodChange={setPeriod}
          customSince={customSince}
          customUntil={customUntil}
          onCustomSinceChange={setCustomSince}
          onCustomUntilChange={setCustomUntil}
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {kpis.map(kpi => <MetricCard key={kpi.label} {...kpi} />)}
      </div>

      {/* Ticket Médio */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        <MetricCard
          label="Ticket Médio"
          value={formatCurrency(metrics.ticketMedio)}
          curr={metrics.ticketMedio}
          prev={metrics.prevTicketMedio}
          icon={CreditCard}
        />
      </div>

      {/* Métricas Meta Ads */}
      <div>
        <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2">Métricas Meta Ads</h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {metaKpis.map(kpi => <MetricCard key={kpi.label} {...kpi} />)}
        </div>
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

      {/* Produtor / Coprodutor */}
      <div>
        <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2">Produtor / Coprodutor</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard label="Lucro × 50% Produtor"    value={formatCurrency(metrics.profit * 0.5)}   curr={metrics.profit * 0.5}   prev={metrics.prevProfit * 0.5}   icon={Wallet} />
          <MetricCard label="Lucro × 50% Coprodutor"  value={formatCurrency(metrics.profit * 0.5)}   curr={metrics.profit * 0.5}   prev={metrics.prevProfit * 0.5}   icon={Wallet} />
          <MetricCard label="Gastos × 50% Produtor"   value={formatCurrency(metrics.adSpend * 0.5)}  curr={metrics.adSpend * 0.5}  prev={metrics.prevAdSpend * 0.5}  icon={Target} noCompare />
          <MetricCard label="Gastos × 50% Coprodutor" value={formatCurrency(metrics.adSpend * 0.5)}  curr={metrics.adSpend * 0.5}  prev={metrics.prevAdSpend * 0.5}  icon={Target} noCompare />
        </div>
      </div>

      {/* CPA x ROAS x Vendas + Funil de Conversão */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 ">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-base">CPA × ROAS × Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272F" />
                <XAxis dataKey="date" stroke="#909099" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis yAxisId="left" stroke="#909099" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#909099" tick={{ fontSize: 10 }} tickLine={false} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="bg-card border border-border rounded-lg p-3 text-xs">
                        <p className="text-muted-foreground mb-1">{label}</p>
                        {payload.map(p => (
                          <p key={String(p.dataKey)} style={{ color: p.color }}>
                            {p.name}: {p.dataKey === 'sales' ? p.value : formatCurrency(Number(p.value ?? 0))}
                          </p>
                        ))}
                      </div>
                    )
                  }}
                />
                <Legend iconType="circle" iconSize={8} />
                <Bar yAxisId="right" dataKey="sales" name="Vendas" fill="#8B6BF2" radius={[6, 6, 0, 0]} />
                <Line yAxisId="left" type="monotone" dataKey="cpa" name="CPA" stroke="#FF3B5C" strokeWidth={2} dot={false} />
                <Line yAxisId="left" type="monotone" dataKey="roas" name="ROAS" stroke="#4FA3FF" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-base">Funil de Conversão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {funnelStages.map(stage => (
              <div key={stage.label} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{stage.label}</span>
                <span className="text-foreground font-medium font-mono-tab">{formatNumber(stage.value)} · {funnelPct(stage.value)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Funil de Fluxo */}
      <Card className="">
        <CardHeader className="pb-2">
          <CardTitle className="text-foreground text-base">Funil de Fluxo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3 text-center">
            {fluxoStages.map(stage => (
              <div key={stage.label} className="bg-inner rounded-lg py-4">
                <p className="text-lg font-bold text-foreground font-mono-tab">{formatNumber(stage.value)}</p>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wide">{stage.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Faturamento vs Gasto + Vendas por Origem */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 ">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-base">Faturamento vs Gasto</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#12E28A" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#12E28A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272F" vertical={false} />
                <XAxis dataKey="date" stroke="#909099" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis stroke="#909099" tick={{ fontSize: 10 }} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="bg-card border border-border rounded-lg p-3 text-xs font-mono-tab">
                        <p className="text-muted-foreground mb-1 font-sans">{label}</p>
                        {payload.map(p => (
                          <p key={String(p.dataKey)} style={{ color: p.color }}>
                            {p.dataKey === 'revenue' ? 'Faturamento' : 'Gasto'}: {formatCurrency(Number(p.value ?? 0))}
                          </p>
                        ))}
                      </div>
                    )
                  }}
                />
                <Legend iconType="circle" iconSize={8} formatter={(v) => v === 'revenue' ? 'Faturamento' : 'Gasto'} />
                <Area type="monotone" dataKey="revenue" stroke="#12E28A" strokeWidth={2.5} fill="url(#revenueGradient)" dot={false} />
                <Area type="monotone" dataKey="spend" stroke="#FF3B5C" strokeWidth={2} strokeDasharray="6 4" fill="none" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-base">Vendas por Origem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={salesBySource} cx="50%" cy="45%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {salesBySource.map((_, i) => <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const p = payload[0]
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 text-xs">
                          <p style={{ color: p.payload.fill }}>{p.name}: <strong className="font-mono-tab">{p.value} vendas</strong></p>
                        </div>
                      )
                    }}
                  />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ marginTop: '-22px' }}>
                <span className="text-xl font-mono-tab font-bold text-foreground">{formatNumber(salesBySource.reduce((s, x) => s + x.value, 0))}</span>
                <span className="text-[9px] text-muted-foreground uppercase tracking-widest">vendas</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vendas por Horário */}
      <Card className="">
        <CardHeader className="pb-2">
          <CardTitle className="text-foreground text-base">Vendas por Horário</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={salesByHour} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272F" />
              <XAxis dataKey="hour" stroke="#909099" tick={{ fontSize: 9 }} tickLine={false} interval={1} />
              <YAxis stroke="#909099" tick={{ fontSize: 10 }} tickLine={false} allowDecimals={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="bg-card border border-border rounded-lg p-3 text-xs">
                      <p className="text-muted-foreground">{label}: <strong className="text-foreground">{payload[0].value} vendas</strong></p>
                    </div>
                  )
                }}
              />
              <Bar dataKey="sales" fill="#12E28A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Vendas por Produto + Vendas por Pagamento + Vendas por Dia da Semana */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-base">Vendas por Produto</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressList items={salesByProduct} />
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-base">Vendas por Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={salesByPayment} cx="50%" cy="45%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                    {salesByPayment.map((_, i) => <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const p = payload[0]
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 text-xs">
                          <p style={{ color: p.payload.fill }}>{p.name}: <strong className="font-mono-tab">{p.value} vendas</strong></p>
                        </div>
                      )
                    }}
                  />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ marginTop: '-20px' }}>
                <span className="text-lg font-mono-tab font-bold text-foreground">{formatNumber(salesByPayment.reduce((s, x) => s + x.value, 0))}</span>
                <span className="text-[9px] text-muted-foreground uppercase tracking-widest">vendas</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-base">Vendas por Dia da Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={salesByWeekday} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272F" />
                <XAxis dataKey="day" stroke="#909099" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis stroke="#909099" tick={{ fontSize: 10 }} tickLine={false} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="bg-card border border-border rounded-lg p-3 text-xs">
                        <p className="text-muted-foreground">{label}: <strong className="text-foreground">{payload[0].value} vendas</strong></p>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="sales" fill="#FFC24B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Campanhas */}
      <Card className="">
        <CardHeader className="pb-2">
          <CardTitle className="text-foreground text-base">Top Campanhas</CardTitle>
        </CardHeader>
        <CardContent className={topCampaigns.length === 0 ? '' : 'p-0'}>
          {topCampaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sem dados de campanha para o período.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campanha</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Gasto</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                  <TableHead className="text-right">ROAS</TableHead>
                  <TableHead className="text-right">CPA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCampaigns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium max-w-[220px] truncate">{c.name}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === 'active' ? 'active' : 'paused'}>
                        {c.status === 'active' ? 'Ativo' : 'Pausado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-brand-red font-mono-tab">{formatCurrency(c.spend)}</TableCell>
                    <TableCell className="text-right text-brand-green font-mono-tab">{formatCurrency(c.revenue)}</TableCell>
                    <TableCell className="text-right text-brand-blue font-mono-tab">{c.roas.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono-tab">{formatCurrency(c.cpa)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
