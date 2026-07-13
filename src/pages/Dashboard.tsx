import { useState, useEffect, useMemo } from 'react'
import {
  LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, Target,
  ShoppingCart, Wallet, Receipt, ShoppingBag, BarChart3, Zap, CreditCard, RotateCcw,
} from 'lucide-react'
import { subDays, startOfDay, isSameDay, format as formatDateFns } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { fetchRawSales, fetchCampaignsFull, subscribeToSales, getSetting, type RawSale } from '@/lib/supabase'
import type { Period, Rate, Campaign } from '@/types'

const PIE_COLORS = ['#74B9FF', '#00B894', '#6C5CE7', '#FDCB6E']
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

function MetricCard({ label, value, curr, prev, icon: Icon, inverted = false, noCompare = false, subtitle }: {
  label: string; value: string; curr: number; prev: number
  icon: React.ElementType; inverted?: boolean; noCompare?: boolean; subtitle?: string
}) {
  const pct = prev === 0 ? 0 : ((curr - prev) / Math.abs(prev)) * 100
  const isGood = inverted ? pct < 0 : pct > 0
  return (
    <Card className="bg-[#1A1A2E] border-[#2d2d4a]">
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-1.5">
          <p className="text-[10px] uppercase tracking-wide text-[#8892a4] font-medium">{label}</p>
          <Icon className="w-3 h-3 text-[#8892a4] flex-shrink-0 mt-0.5" />
        </div>
        <p className="text-base font-bold text-[#E0E0E0] leading-none">{value}</p>
        {noCompare ? (
          <p className="text-[10px] text-[#8892a4] mt-1.5">período completo</p>
        ) : (
          <div className={`flex items-center gap-0.5 mt-1.5 text-[10px] font-medium ${isGood ? 'text-[#00B894]' : 'text-[#E94560]'}`}>
            {isGood ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span>{Math.abs(pct).toFixed(1)}%</span>
            {subtitle && <span className="text-[#8892a4] font-normal ml-1">{subtitle}</span>}
          </div>
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
            <span className="text-[#E0E0E0]">{item.label}</span>
            <span className="text-[#8892a4]">{item.extra ?? item.count}</span>
          </div>
          <div className="h-1.5 bg-[#12122A] rounded-full overflow-hidden">
            <div className="h-full bg-[#00B894] rounded-full" style={{ width: `${(item.count / max) * 100}%` }} />
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-xs text-[#8892a4] text-center py-6">Sem dados para o período.</p>}
    </div>
  )
}

export default function Dashboard() {
  const [period, setPeriod] = useState<Period>('7d')
  const [sales, setSales] = useState<RawSale[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])

  useEffect(() => {
    fetchRawSales().then(setSales)
    fetchCampaignsFull().then(setCampaigns)
    return subscribeToSales(() => { fetchRawSales().then(setSales) })
  }, [])

  const syncedAdSpend = useMemo(() => campaigns.reduce((sum, c) => sum + c.spend, 0), [campaigns])

  const rates = useMemo<Rate[]>(() => {
    const raw = getSetting('rates')
    if (!raw) return []
    try { return JSON.parse(raw) as Rate[] } catch { return [] }
  }, [])
  const taxPercent = rates.reduce((sum, r) => (r.appliesTo === 'revenue' && r.type === 'percent') ? sum + r.value : sum, 0)

  const approved = useMemo(() => sales.filter(s => s.status === 'approved'), [sales])
  const refunded = useMemo(() => sales.filter(s => s.status === 'refunded' || s.status === 'chargeback'), [sales])
  const periodDays = period === 'today' ? 1 : period === '7d' ? 7 : 30

  const splitByPeriod = (list: RawSale[]) => {
    const cutoff = subDays(startOfDay(new Date()), periodDays - 1)
    const prevCutoff = subDays(cutoff, periodDays)
    return {
      curr: list.filter(s => new Date(s.date) >= cutoff),
      prev: list.filter(s => { const d = new Date(s.date); return d >= prevCutoff && d < cutoff }),
    }
  }

  const periodSales = useMemo(() => splitByPeriod(approved), [approved, periodDays])
  const periodRefunds = useMemo(() => splitByPeriod(refunded), [refunded, periodDays])

  const metrics = useMemo(() => {
    const { curr, prev } = periodSales
    const grossRevenue = curr.reduce((sum, s) => sum + s.amount, 0)
    const prevGrossRevenue = prev.reduce((sum, s) => sum + s.amount, 0)
    const adSpend = period === '30d' ? syncedAdSpend : 0
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

    return {
      grossRevenue, prevGrossRevenue, adSpend, prevAdSpend,
      impostoMeta, prevImpostoMeta, profit, prevProfit,
      sales, prevSales, roi, prevRoi, roas, prevRoas, cpa, prevCpa,
      ticketMedio, prevTicketMedio, comprasFB: 0, prevComprasFB: 0,
      refundAmount, prevRefundAmount, refundCount, prevRefundCount,
    }
  }, [periodSales, periodRefunds, taxPercent, period, syncedAdSpend])

  const chartData = useMemo(() => {
    const buckets: { date: string; revenue: number; spend: number; sales: number; cpa: number; roas: number }[] = []
    for (let i = periodDays - 1; i >= 0; i--) {
      const day = subDays(startOfDay(new Date()), i)
      const daySales = approved.filter(s => isSameDay(new Date(s.date), day))
      const dayRevenue = daySales.reduce((sum, s) => sum + s.amount, 0)
      buckets.push({ date: formatDateFns(day, 'dd/MM'), revenue: dayRevenue, spend: 0, sales: daySales.length, cpa: 0, roas: 0 })
    }
    return buckets
  }, [approved, periodDays])

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

  const kpis: { label: string; value: string; curr: number; prev: number; icon: React.ElementType; inverted?: boolean; noCompare?: boolean; subtitle?: string }[] = [
    { label: 'Faturamento Bruto', value: formatCurrency(metrics.grossRevenue), curr: metrics.grossRevenue, prev: metrics.prevGrossRevenue, icon: DollarSign },
    { label: 'Gasto com Ads',     value: formatCurrency(metrics.adSpend),      curr: metrics.adSpend,      prev: metrics.prevAdSpend,      icon: Target, inverted: true },
    { label: 'Lucro',             value: formatCurrency(metrics.profit),       curr: metrics.profit,       prev: metrics.prevProfit,       icon: Wallet },
    { label: 'ROI',               value: `${metrics.roi.toFixed(1)}%`,         curr: metrics.roi,          prev: metrics.prevRoi,          icon: TrendingUp },
    { label: 'ROAS',              value: `${metrics.roas.toFixed(2)}x`,        curr: metrics.roas,         prev: metrics.prevRoas,         icon: BarChart3 },
    { label: 'CPA',               value: formatCurrency(metrics.cpa),          curr: metrics.cpa,          prev: metrics.prevCpa,          icon: Zap, inverted: true },
    { label: 'Imposto Meta',      value: formatCurrency(metrics.impostoMeta),  curr: metrics.impostoMeta,  prev: metrics.prevImpostoMeta,  icon: Receipt, noCompare: true },
    { label: 'Vendas',            value: formatNumber(metrics.sales),          curr: metrics.sales,        prev: metrics.prevSales,        icon: ShoppingCart },
    { label: 'Reembolsos',        value: formatCurrency(metrics.refundAmount), curr: metrics.refundAmount, prev: metrics.prevRefundAmount, icon: RotateCcw, inverted: true, subtitle: `(${formatNumber(metrics.refundCount)})` },
    { label: 'Compras FB',        value: formatNumber(metrics.comprasFB),      curr: metrics.comprasFB,    prev: metrics.prevComprasFB,    icon: ShoppingBag, noCompare: true },
  ]

  return (
    <div className="space-y-5">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#E0E0E0]">Visão Geral</h2>
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="w-36 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="7d">7 dias</SelectItem>
            <SelectItem value="30d">30 dias</SelectItem>
          </SelectContent>
        </Select>
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

      {/* Produtor / Coprodutor */}
      <div>
        <h3 className="text-xs uppercase tracking-wide text-[#8892a4] font-medium mb-2">Produtor / Coprodutor</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard label="Lucro × 50% Produtor"    value={formatCurrency(metrics.profit * 0.5)}   curr={metrics.profit * 0.5}   prev={metrics.prevProfit * 0.5}   icon={Wallet} />
          <MetricCard label="Lucro × 50% Coprodutor"  value={formatCurrency(metrics.profit * 0.5)}   curr={metrics.profit * 0.5}   prev={metrics.prevProfit * 0.5}   icon={Wallet} />
          <MetricCard label="Gastos × 50% Produtor"   value={formatCurrency(metrics.adSpend * 0.5)}  curr={metrics.adSpend * 0.5}  prev={metrics.prevAdSpend * 0.5}  icon={Target} noCompare />
          <MetricCard label="Gastos × 50% Coprodutor" value={formatCurrency(metrics.adSpend * 0.5)}  curr={metrics.adSpend * 0.5}  prev={metrics.prevAdSpend * 0.5}  icon={Target} noCompare />
        </div>
      </div>

      {/* CPA x ROAS x Vendas + Funil de Conversão */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 bg-[#1A1A2E] border-[#2d2d4a]">
          <CardHeader className="pb-2">
            <CardTitle className="text-[#E0E0E0] text-base">CPA × ROAS × Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4a" />
                <XAxis dataKey="date" stroke="#8892a4" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis yAxisId="left" stroke="#8892a4" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#8892a4" tick={{ fontSize: 10 }} tickLine={false} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="bg-[#1A1A2E] border border-[#2d2d4a] rounded-lg p-3 text-xs">
                        <p className="text-[#8892a4] mb-1">{label}</p>
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
                <Bar yAxisId="right" dataKey="sales" name="Vendas" fill="#6C5CE7" radius={[3, 3, 0, 0]} />
                <Line yAxisId="left" type="monotone" dataKey="cpa" name="CPA" stroke="#E94560" strokeWidth={2} dot={false} />
                <Line yAxisId="left" type="monotone" dataKey="roas" name="ROAS" stroke="#74B9FF" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A2E] border-[#2d2d4a]">
          <CardHeader className="pb-2">
            <CardTitle className="text-[#E0E0E0] text-base">Funil de Conversão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {funnelStages.map(stage => (
              <div key={stage.label} className="flex items-center justify-between text-xs">
                <span className="text-[#8892a4]">{stage.label}</span>
                <span className="text-[#E0E0E0] font-medium">{formatNumber(stage.value)} · {funnelPct(stage.value)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Funil de Fluxo */}
      <Card className="bg-[#1A1A2E] border-[#2d2d4a]">
        <CardHeader className="pb-2">
          <CardTitle className="text-[#E0E0E0] text-base">Funil de Fluxo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3 text-center">
            {fluxoStages.map(stage => (
              <div key={stage.label} className="bg-[#12122A] rounded-lg py-4">
                <p className="text-lg font-bold text-[#E0E0E0]">{formatNumber(stage.value)}</p>
                <p className="text-[10px] text-[#8892a4] mt-1 uppercase tracking-wide">{stage.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Faturamento vs Gasto + Vendas por Origem */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 bg-[#1A1A2E] border-[#2d2d4a]">
          <CardHeader className="pb-2">
            <CardTitle className="text-[#E0E0E0] text-base">Faturamento vs Gasto</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4a" />
                <XAxis dataKey="date" stroke="#8892a4" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis stroke="#8892a4" tick={{ fontSize: 10 }} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="bg-[#1A1A2E] border border-[#2d2d4a] rounded-lg p-3 text-xs">
                        <p className="text-[#8892a4] mb-1">{label}</p>
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
                <Line type="monotone" dataKey="revenue" stroke="#00B894" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="spend"   stroke="#E94560" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A2E] border-[#2d2d4a]">
          <CardHeader className="pb-2">
            <CardTitle className="text-[#E0E0E0] text-base">Vendas por Origem</CardTitle>
          </CardHeader>
          <CardContent>
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
                      <div className="bg-[#1A1A2E] border border-[#2d2d4a] rounded-lg p-3 text-xs">
                        <p style={{ color: p.payload.fill }}>{p.name}: <strong>{p.value} vendas</strong></p>
                      </div>
                    )
                  }}
                />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Vendas por Horário */}
      <Card className="bg-[#1A1A2E] border-[#2d2d4a]">
        <CardHeader className="pb-2">
          <CardTitle className="text-[#E0E0E0] text-base">Vendas por Horário</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={salesByHour} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4a" />
              <XAxis dataKey="hour" stroke="#8892a4" tick={{ fontSize: 9 }} tickLine={false} interval={1} />
              <YAxis stroke="#8892a4" tick={{ fontSize: 10 }} tickLine={false} allowDecimals={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="bg-[#1A1A2E] border border-[#2d2d4a] rounded-lg p-3 text-xs">
                      <p className="text-[#8892a4]">{label}: <strong className="text-[#E0E0E0]">{payload[0].value} vendas</strong></p>
                    </div>
                  )
                }}
              />
              <Bar dataKey="sales" fill="#00B894" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Vendas por Produto + Vendas por Pagamento + Vendas por Dia da Semana */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="bg-[#1A1A2E] border-[#2d2d4a]">
          <CardHeader className="pb-2">
            <CardTitle className="text-[#E0E0E0] text-base">Vendas por Produto</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressList items={salesByProduct} />
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A2E] border-[#2d2d4a]">
          <CardHeader className="pb-2">
            <CardTitle className="text-[#E0E0E0] text-base">Vendas por Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
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
                      <div className="bg-[#1A1A2E] border border-[#2d2d4a] rounded-lg p-3 text-xs">
                        <p style={{ color: p.payload.fill }}>{p.name}: <strong>{p.value} vendas</strong></p>
                      </div>
                    )
                  }}
                />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A2E] border-[#2d2d4a]">
          <CardHeader className="pb-2">
            <CardTitle className="text-[#E0E0E0] text-base">Vendas por Dia da Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={salesByWeekday} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4a" />
                <XAxis dataKey="day" stroke="#8892a4" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis stroke="#8892a4" tick={{ fontSize: 10 }} tickLine={false} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="bg-[#1A1A2E] border border-[#2d2d4a] rounded-lg p-3 text-xs">
                        <p className="text-[#8892a4]">{label}: <strong className="text-[#E0E0E0]">{payload[0].value} vendas</strong></p>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="sales" fill="#FDCB6E" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Campanhas */}
      <Card className="bg-[#1A1A2E] border-[#2d2d4a]">
        <CardHeader className="pb-2">
          <CardTitle className="text-[#E0E0E0] text-base">Top Campanhas</CardTitle>
        </CardHeader>
        <CardContent className={topCampaigns.length === 0 ? '' : 'p-0'}>
          {topCampaigns.length === 0 ? (
            <p className="text-sm text-[#8892a4] text-center py-8">Sem dados de campanha para o período.</p>
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
                    <TableCell className="text-right text-[#E94560]">{formatCurrency(c.spend)}</TableCell>
                    <TableCell className="text-right text-[#00B894]">{formatCurrency(c.revenue)}</TableCell>
                    <TableCell className="text-right text-[#74B9FF]">{c.roas.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(c.cpa)}</TableCell>
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
