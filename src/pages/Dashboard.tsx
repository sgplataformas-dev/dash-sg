import { useState, useEffect, useMemo } from 'react'
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, Target,
  ShoppingCart, Eye, MousePointer2, Play, Zap, Receipt, Wallet,
} from 'lucide-react'
import { subDays, startOfDay, isSameDay, format as formatDateFns } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { mockCampaigns } from '@/data/mockData'
import { fetchRawSales, type RawSale } from '@/lib/supabase'
import type { Period } from '@/types'

const PIE_COLORS = ['#74B9FF', '#00B894', '#6C5CE7', '#FDCB6E']

export default function Dashboard() {
  const [period, setPeriod] = useState<Period>('7d')
  const [sales, setSales] = useState<RawSale[]>([])

  useEffect(() => {
    fetchRawSales().then(setSales)
  }, [])

  const approved = useMemo(() => sales.filter(s => s.status === 'approved'), [sales])
  const periodDays = period === 'today' ? 1 : period === '7d' ? 7 : 30

  const metrics = useMemo(() => {
    const cutoff = subDays(startOfDay(new Date()), periodDays - 1)
    const prevCutoff = subDays(cutoff, periodDays)
    const curr = approved.filter(s => new Date(s.date) >= cutoff)
    const prev = approved.filter(s => { const d = new Date(s.date); return d >= prevCutoff && d < cutoff })
    const grossRevenue = curr.reduce((sum, s) => sum + s.amount, 0)
    const prevGrossRevenue = prev.reduce((sum, s) => sum + s.amount, 0)

    return {
      grossRevenue, adSpend: 0,
      cpm: 0, ctr: 0, cpc: 0, cpv: 0, cpi: 0,
      cpa: 0, roas: 0,
      tax: 0, profit: grossRevenue, sales: curr.length,
      prevGrossRevenue, prevAdSpend: 0,
      prevCpm: 0, prevCtr: 0, prevCpc: 0, prevCpv: 0, prevCpi: 0,
      prevCpa: 0, prevRoas: 0,
      prevTax: 0, prevProfit: prevGrossRevenue, prevSales: prev.length,
    }
  }, [approved, periodDays])

  const chartData = useMemo(() => {
    const buckets: { date: string; revenue: number; spend: number; sales: number }[] = []
    for (let i = periodDays - 1; i >= 0; i--) {
      const day = subDays(startOfDay(new Date()), i)
      const dayRevenue = approved.filter(s => isSameDay(new Date(s.date), day)).reduce((sum, s) => sum + s.amount, 0)
      const daySales = approved.filter(s => isSameDay(new Date(s.date), day)).length
      buckets.push({ date: formatDateFns(day, 'dd/MM'), revenue: dayRevenue, spend: 0, sales: daySales })
    }
    return buckets
  }, [approved, periodDays])

  const salesBySource = useMemo(() => {
    const paid = approved.filter(s => !s.isOrganic).length
    const organic = approved.filter(s => s.isOrganic).length
    return [
      { name: 'Facebook', value: paid },
      { name: 'Orgânico', value: organic },
    ].filter(s => s.value > 0)
  }, [approved])

  const topCampaigns = [...mockCampaigns].filter(c => c.sales > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

  const kpis: {
    label: string; value: string; curr: number; prev: number;
    icon: React.ElementType; inverted: boolean; badge?: 'auto' | 'manual'
  }[] = [
    { label: 'Faturamento', value: formatCurrency(metrics.grossRevenue), curr: metrics.grossRevenue, prev: metrics.prevGrossRevenue, icon: DollarSign,    inverted: false },
    { label: 'Invest.',     value: formatCurrency(metrics.adSpend),      curr: metrics.adSpend,      prev: metrics.prevAdSpend,      icon: Target,        inverted: true  },
    { label: 'CPM',         value: formatCurrency(metrics.cpm),          curr: metrics.cpm,          prev: metrics.prevCpm,          icon: Eye,           inverted: true  },
    { label: 'CTR',         value: `${metrics.ctr.toFixed(1)}%`,         curr: metrics.ctr,          prev: metrics.prevCtr,          icon: MousePointer2, inverted: false },
    { label: 'CPC',         value: formatCurrency(metrics.cpc),          curr: metrics.cpc,          prev: metrics.prevCpc,          icon: MousePointer2, inverted: true  },
    { label: 'CPV',         value: formatCurrency(metrics.cpv),          curr: metrics.cpv,          prev: metrics.prevCpv,          icon: Play,          inverted: true  },
    { label: 'CPI',         value: formatCurrency(metrics.cpi),          curr: metrics.cpi,          prev: metrics.prevCpi,          icon: Zap,           inverted: true  },
    { label: 'CPA',         value: formatCurrency(metrics.cpa),          curr: metrics.cpa,          prev: metrics.prevCpa,          icon: Target,        inverted: true,  badge: 'auto'   },
    { label: 'ROAS',        value: metrics.roas.toFixed(2),              curr: metrics.roas,         prev: metrics.prevRoas,         icon: TrendingUp,    inverted: false, badge: 'auto'   },
    { label: 'Imposto',     value: formatCurrency(metrics.tax),          curr: metrics.tax,          prev: metrics.prevTax,          icon: Receipt,       inverted: true,  badge: 'auto'   },
    { label: 'Lucro',       value: formatCurrency(metrics.profit),       curr: metrics.profit,       prev: metrics.prevProfit,       icon: Wallet,        inverted: false, badge: 'auto'   },
    { label: 'Vendas',      value: formatNumber(metrics.sales),          curr: metrics.sales,        prev: metrics.prevSales,        icon: ShoppingCart,  inverted: false, badge: 'manual' },
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {kpis.map((kpi) => {
          const pct = kpi.prev === 0 ? 0 : ((kpi.curr - kpi.prev) / Math.abs(kpi.prev)) * 100
          const isGood = kpi.inverted ? pct < 0 : pct > 0
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="bg-[#1A1A2E] border-[#2d2d4a]">
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center gap-1">
                    <p className="text-[10px] uppercase tracking-wide text-[#8892a4] font-medium">{kpi.label}</p>
                    {kpi.badge && (
                      <span className={`text-[8px] px-1 py-0.5 rounded font-semibold leading-none ${
                        kpi.badge === 'auto'
                          ? 'bg-[#74B9FF]/15 text-[#74B9FF]'
                          : 'bg-[#2d2d4a] text-[#8892a4]'
                      }`}>
                        {kpi.badge}
                      </span>
                    )}
                  </div>
                  <Icon className="w-3 h-3 text-[#8892a4] flex-shrink-0 mt-0.5" />
                </div>
                <p className="text-base font-bold text-[#E0E0E0] leading-none">{kpi.value}</p>
                <div className={`flex items-center gap-0.5 mt-1.5 text-[10px] font-medium ${isGood ? 'text-[#00B894]' : 'text-[#E94560]'}`}>
                  {isGood ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  <span>{Math.abs(pct).toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Line Chart */}
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

        {/* Pie Chart */}
        <Card className="bg-[#1A1A2E] border-[#2d2d4a]">
          <CardHeader className="pb-2">
            <CardTitle className="text-[#E0E0E0] text-base">Vendas por Fonte</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={salesBySource}
                  cx="50%" cy="45%"
                  innerRadius={55} outerRadius={80}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {salesBySource.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
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

      {/* Top 5 Campaigns */}
      <Card className="bg-[#1A1A2E] border-[#2d2d4a]">
        <CardHeader className="pb-2">
          <CardTitle className="text-[#E0E0E0] text-base">Top 5 Campanhas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
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
        </CardContent>
      </Card>
    </div>
  )
}
