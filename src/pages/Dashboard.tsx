import { useState } from 'react'
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, Target, ShoppingCart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { mockMetrics, dailyData, salesBySource, mockCampaigns } from '@/data/mockData'
import type { Period } from '@/types'

const PIE_COLORS = ['#74B9FF', '#00B894', '#6C5CE7', '#FDCB6E']

export default function Dashboard() {
  const [period, setPeriod] = useState<Period>('7d')

  const metrics = mockMetrics[period]
  const chartData = period === 'today' ? dailyData.slice(-1) : period === '7d' ? dailyData.slice(-7) : dailyData
  const topCampaigns = [...mockCampaigns].filter(c => c.sales > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

  const kpis = [
    { label: 'Fat. Bruto',  value: formatCurrency(metrics.grossRevenue), curr: metrics.grossRevenue, prev: metrics.prevGrossRevenue, icon: DollarSign,   inverted: false },
    { label: 'Fat. Líquido',value: formatCurrency(metrics.netRevenue),   curr: metrics.netRevenue,   prev: metrics.prevNetRevenue,   icon: TrendingUp,   inverted: false },
    { label: 'Gasto Ads',   value: formatCurrency(metrics.adSpend),      curr: metrics.adSpend,      prev: metrics.prevAdSpend,      icon: Target,       inverted: true  },
    { label: 'ROI',         value: `${metrics.roi.toFixed(1)}%`,          curr: metrics.roi,          prev: metrics.prevRoi,          icon: TrendingUp,   inverted: false },
    { label: 'ROAS',        value: metrics.roas.toFixed(2),               curr: metrics.roas,         prev: metrics.prevRoas,         icon: Target,       inverted: false },
    { label: 'CPA',         value: formatCurrency(metrics.cpa),           curr: metrics.cpa,          prev: metrics.prevCpa,          icon: Target,       inverted: true  },
    { label: 'Vendas',      value: formatNumber(metrics.sales),           curr: metrics.sales,        prev: metrics.prevSales,        icon: ShoppingCart, inverted: false },
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {kpis.map((kpi) => {
          const pct = kpi.prev === 0 ? 0 : ((kpi.curr - kpi.prev) / Math.abs(kpi.prev)) * 100
          const isGood = kpi.inverted ? pct < 0 : pct > 0
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="bg-[#1A1A2E] border-[#2d2d4a]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] uppercase tracking-wide text-[#8892a4]">{kpi.label}</p>
                  <Icon className="w-3.5 h-3.5 text-[#8892a4]" />
                </div>
                <p className="text-lg font-bold text-[#E0E0E0] leading-none">{kpi.value}</p>
                <div className={`flex items-center gap-0.5 mt-1.5 text-xs font-medium ${isGood ? 'text-[#00B894]' : 'text-[#E94560]'}`}>
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
