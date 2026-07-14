import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { getSetting, saveSetting } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import type { Rate, RateType, RateAppliesTo } from '@/types'

// ─── General Tab ─────────────────────────────────────────────────────────────

function GeneralTab() {
  const [appName,  setAppName]  = useState(getSetting('app_name')  ?? 'sgGlobalDash')
  const [timezone, setTimezone] = useState(getSetting('timezone')   ?? 'America/Sao_Paulo')
  const [currency, setCurrency] = useState(getSetting('currency')   ?? 'BRL')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await saveSetting('app_name',  appName)
      await saveSetting('timezone',  timezone)
      await saveSetting('currency',  currency)
      toast({ title: 'Salvo!', description: 'Configurações gerais atualizadas.' })
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível salvar.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="">
      <CardHeader>
        <CardTitle className="text-foreground text-base">Configurações Gerais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          <Label>Nome do App</Label>
          <Input value={appName} onChange={e => setAppName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Fuso Horário</Label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="America/Sao_Paulo">América/São Paulo (UTC-3)</SelectItem>
              <SelectItem value="America/Manaus">América/Manaus (UTC-4)</SelectItem>
              <SelectItem value="America/Fortaleza">América/Fortaleza (UTC-3)</SelectItem>
              <SelectItem value="America/Belem">América/Belém (UTC-3)</SelectItem>
              <SelectItem value="America/Noronha">América/Noronha (UTC-2)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Moeda Padrão</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="BRL">BRL — Real Brasileiro</SelectItem>
              <SelectItem value="USD">USD — Dólar Americano</SelectItem>
              <SelectItem value="EUR">EUR — Euro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Salvar
        </Button>
      </CardContent>
    </Card>
  )
}

// ─── Facebook Ads Tab ─────────────────────────────────────────────────────────

function FacebookTab() {
  const [newToken, setNewToken] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [saving, setSaving] = useState(false)

  const rawToken = getSetting('facebook_token') ?? ''
  const maskedToken = rawToken.length > 10
    ? `${rawToken.slice(0, 10)}...`
    : rawToken ? '(token salvo)' : '(não configurado)'

  const lastSync = getSetting('last_fb_sync')

  const updateToken = async () => {
    if (!newToken.trim()) return
    setSaving(true)
    try {
      await saveSetting('facebook_token', newToken.trim())
      setNewToken('')
      toast({ title: 'Token atualizado!', description: 'Novo access token salvo.' })
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível salvar o token.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const syncNow = async () => {
    setSyncing(true)
    try {
      await new Promise(r => setTimeout(r, 1500)) // simula sync
      const now = new Date().toLocaleString('pt-BR')
      await saveSetting('last_fb_sync', now)
      toast({ title: 'Sincronizado!', description: `Última sync: ${now}` })
    } catch {
      toast({ title: 'Erro na sincronização', variant: 'destructive' })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Card className="">
      <CardHeader>
        <CardTitle className="text-foreground text-base">Facebook Ads</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="bg-inner rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Token atual</span>
            <span className="text-foreground font-mono">{maskedToken}</span>
          </div>
          {lastSync && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Última sincronização</span>
              <span className="text-foreground">{lastSync}</span>
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-1.5">
          <Label>Atualizar Token</Label>
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="Novo access token..."
              value={newToken}
              onChange={e => setNewToken(e.target.value)}
              className="flex-1"
            />
            <Button onClick={updateToken} disabled={saving || !newToken.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Atualizar'}
            </Button>
          </div>
        </div>

        <Button
          variant="secondary"
          onClick={syncNow}
          disabled={syncing || !rawToken}
          className="w-full sm:w-auto"
        >
          {syncing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Sincronizando...</> : 'Sincronizar agora'}
        </Button>

        {!rawToken && (
          <p className="text-xs text-muted-foreground">Configure um token na aba Integrações primeiro.</p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Rates Tab ────────────────────────────────────────────────────────────────

const emptyRate = (): Omit<Rate, 'id'> => ({
  name: '', type: 'percent', value: 0, appliesTo: 'revenue',
})

function RatesTab() {
  const [rates, setRates] = useState<Rate[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Rate | null>(null)
  const [form, setForm] = useState(emptyRate())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const raw = getSetting('rates')
    if (raw) {
      try { setRates(JSON.parse(raw) as Rate[]) } catch { /* ignore */ }
    }
  }, [])

  const persist = async (next: Rate[]) => {
    await saveSetting('rates', JSON.stringify(next))
    setRates(next)
  }

  const addRate = async () => {
    if (!form.name.trim() || form.value <= 0) {
      toast({ title: 'Atenção', description: 'Preencha nome e valor da taxa.', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const next = [...rates, { ...form, id: Date.now().toString() }]
      await persist(next)
      setShowAdd(false)
      setForm(emptyRate())
      toast({ title: 'Taxa adicionada!' })
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const deleteRate = async () => {
    if (!deleteTarget) return
    try {
      const next = rates.filter(r => r.id !== deleteTarget.id)
      await persist(next)
      setDeleteTarget(null)
      toast({ title: 'Taxa removida.' })
    } catch {
      toast({ title: 'Erro ao remover', variant: 'destructive' })
    }
  }

  const totalImpact = rates.reduce((sum, r) => {
    if (r.appliesTo !== 'revenue') return sum
    return r.type === 'percent' ? sum + r.value : sum
  }, 0)

  return (
    <>
      <Card className="">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground text-base">Taxas e Descontos</CardTitle>
              {rates.length > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Impacto total sobre receita: <span className="text-brand-red font-medium">-{totalImpact.toFixed(1)}%</span>
                </p>
              )}
            </div>
            <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1.5">
              <Plus className="w-4 h-4" />Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {rates.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              Nenhuma taxa cadastrada. Clique em "Adicionar" para começar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Aplica-se a</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates.map(rate => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-medium">{rate.name}</TableCell>
                    <TableCell>
                      <Badge variant="info">{rate.type === 'percent' ? 'Percentual' : 'Fixo'}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {rate.type === 'percent' ? `${rate.value}%` : formatCurrency(rate.value)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm capitalize">{rate.appliesTo === 'revenue' ? 'Receita' : 'Comissão'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-brand-red hover:text-brand-red hover:bg-brand-red/10"
                        onClick={() => setDeleteTarget(rate)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Rate Modal */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Adicionar Taxa</DialogTitle>
            <DialogDescription>Preencha os dados da nova taxa.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome da taxa</Label>
              <Input placeholder="Ex: Comissão Payt" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as RateType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentual</SelectItem>
                    <SelectItem value="fixed">Fixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Valor {form.type === 'percent' ? '(%)' : '(R$)'}</Label>
                <Input
                  type="number"
                  min={0}
                  step={form.type === 'percent' ? 0.1 : 1}
                  value={form.value || ''}
                  onChange={e => setForm(f => ({ ...f, value: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Aplica-se a</Label>
              <Select value={form.appliesTo} onValueChange={v => setForm(f => ({ ...f, appliesTo: v as RateAppliesTo }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Receita</SelectItem>
                  <SelectItem value="commission">Comissão</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => { setShowAdd(false); setForm(emptyRate()) }}>Cancelar</Button>
            <Button onClick={addRate} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Modal */}
      <Dialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remover taxa</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover a taxa <span className="text-foreground font-medium">"{deleteTarget?.name}"</span>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button
              className="bg-brand-red/20 text-brand-red border border-brand-red/30 hover:bg-brand-red/30"
              onClick={deleteRate}
            >
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Main Settings Page ───────────────────────────────────────────────────────

export default function Settings() {
  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Configurações</h2>
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="facebook">Facebook Ads</TabsTrigger>
          <TabsTrigger value="rates">Taxas</TabsTrigger>
        </TabsList>
        <TabsContent value="general"><GeneralTab /></TabsContent>
        <TabsContent value="facebook"><FacebookTab /></TabsContent>
        <TabsContent value="rates"><RatesTab /></TabsContent>
      </Tabs>
    </div>
  )
}
