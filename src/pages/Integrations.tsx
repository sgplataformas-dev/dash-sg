import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Copy, Check, Loader2, Link2, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getSetting, saveSetting, deleteSetting } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import type { FacebookAccount } from '@/types'

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://seu-dominio.vercel.app'
const SYNC_FN_URL = 'https://jayuivvpbhsfjpetfspa.supabase.co/functions/v1/sync-facebook-ads'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <Button variant="ghost" size="icon" onClick={copy} className="h-8 w-8 text-muted-foreground hover:text-foreground">
      {copied ? <Check className="w-4 h-4 text-brand-green" /> : <Copy className="w-4 h-4" />}
    </Button>
  )
}

function WebhookCard({ title, platform, url: urlOverride }: { title: string; platform: string; url?: string }) {
  const url = urlOverride ?? `${BASE_URL}/webhook/${platform}`
  const active = getSetting(`webhook_${platform}_active`) === 'true'

  return (
    <Card className="">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground text-base">{title}</CardTitle>
          <Badge variant={active ? 'active' : 'gray'}>
            {active ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-muted-foreground text-xs mb-1.5 block">URL do Webhook</Label>
          <div className="flex items-center gap-2 bg-inner border border-border rounded-md px-3 py-2">
            <Link2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground text-xs font-mono flex-1 truncate">{url}</span>
            <CopyButton text={url} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Configure este URL como webhook no painel do {title} para receber notificações de vendas.
        </p>
      </CardContent>
    </Card>
  )
}

export default function Integrations() {
  const [token, setToken] = useState('')
  const [accounts, setAccounts] = useState<FacebookAccount[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [connectedName, setConnectedName] = useState('')
  const [connectedAccountId, setConnectedAccountId] = useState('')
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    const savedToken = getSetting('facebook_token')
    const savedName  = getSetting('facebook_ad_account_name')
    const savedAccId = getSetting('facebook_ad_account_id')
    if (savedToken && savedName) {
      setIsConnected(true)
      setConnectedName(savedName)
      setConnectedAccountId(savedAccId ?? '')
    }
  }, [])

  const fetchAccounts = async () => {
    if (!token.trim()) {
      toast({ title: 'Atenção', description: 'Cole um Access Token válido.', variant: 'destructive' })
      return
    }
    setConnecting(true)
    try {
      const allAccounts: FacebookAccount[] = []
      let url: string | null =
        `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_id&limit=200&access_token=${token.trim()}`

      while (url) {
        const res = await fetch(url)
        const data = await res.json() as {
          data?: FacebookAccount[]
          error?: { message: string }
          paging?: { next?: string }
        }
        if (data.error) throw new Error(data.error.message)
        allAccounts.push(...(data.data ?? []))
        url = data.paging?.next ?? null
      }

      setAccounts(allAccounts)
      if (allAccounts.length === 0) {
        toast({ title: 'Aviso', description: 'Nenhuma conta de anúncio encontrada para este token.' })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      toast({ title: 'Erro ao conectar', description: msg, variant: 'destructive' })
    } finally {
      setConnecting(false)
    }
  }

  const saveConnection = async () => {
    const acc = accounts.find(a => a.id === selectedId)
    if (!acc) {
      toast({ title: 'Atenção', description: 'Selecione uma conta de anúncio.', variant: 'destructive' })
      return
    }
    try {
      await saveSetting('facebook_token', token.trim())
      await saveSetting('facebook_ad_account_id', acc.id)
      await saveSetting('facebook_ad_account_name', acc.name)
      setIsConnected(true)
      setConnectedName(acc.name)
      setConnectedAccountId(acc.account_id)
      setToken('')
      setAccounts([])
      toast({ title: 'Conectado!', description: `Conta "${acc.name}" salva com sucesso.` })
    } catch {
      toast({ title: 'Erro ao salvar', description: 'Verifique a conexão com o Supabase.', variant: 'destructive' })
    }
  }

  const syncCampaigns = async () => {
    setSyncing(true)
    try {
      const res = await fetch(SYNC_FN_URL, { method: 'POST' })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? 'Erro ao sincronizar.')
      toast({
        title: 'Sincronizado!',
        description: `${data.campaigns} campanhas, ${data.adSets} conjuntos, ${data.ads} anúncios. Gasto (30d): ${formatCurrency(data.totalSpend)}`,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      toast({ title: 'Erro ao sincronizar', description: msg, variant: 'destructive' })
    } finally {
      setSyncing(false)
    }
  }

  const disconnect = () => {
    deleteSetting('facebook_token')
    deleteSetting('facebook_ad_account_id')
    deleteSetting('facebook_ad_account_name')
    setIsConnected(false)
    setConnectedName('')
    setConnectedAccountId('')
    setToken('')
    setAccounts([])
    setSelectedId('')
    toast({ title: 'Desconectado', description: 'Integração com Facebook removida.' })
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Facebook Ads */}
      <Card className="">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground text-base flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-[#1877F2] flex items-center justify-center text-white text-xs font-bold">f</div>
              Facebook Ads
            </CardTitle>
            <div className="flex items-center gap-2">
              {isConnected
                ? <><CheckCircle2 className="w-4 h-4 text-brand-green" /><span className="text-brand-green text-sm font-medium">Conectado</span></>
                : <><XCircle className="w-4 h-4 text-brand-red" /><span className="text-brand-red text-sm font-medium">Desconectado</span></>
              }
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <div className="space-y-3">
              <div className="bg-inner rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Conta</span>
                  <span className="text-foreground font-medium">{connectedName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ID da conta</span>
                  <span className="text-foreground font-mono">{connectedAccountId}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={syncCampaigns} disabled={syncing} className="gap-1.5">
                  {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Sincronizar campanhas
                </Button>
                <Button variant="destructive" size="sm" onClick={disconnect} className="bg-brand-red/20 text-brand-red border border-brand-red/30 hover:bg-brand-red/30">
                  Desconectar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Access Token do Facebook</Label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="Cole seu access token aqui..."
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={fetchAccounts} disabled={connecting} className="shrink-0">
                    {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar contas'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Gere um token em developers.facebook.com com permissão <code className="bg-inner px-1 rounded">ads_read</code>.
                </p>
              </div>

              {accounts.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-1.5">
                    <Label>Conta de Anúncio</Label>
                    <div className="flex gap-2">
                      <Select value={selectedId} onValueChange={setSelectedId}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Selecione a conta..." />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map(acc => (
                            <SelectItem key={acc.id} value={acc.id}>
                              {acc.name} ({acc.account_id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={saveConnection} disabled={!selectedId}>
                        Salvar
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook Cards */}
      <WebhookCard
        title="Payt"
        platform="payt"
        url="https://jayuivvpbhsfjpetfspa.supabase.co/functions/v1/webhook-payt"
      />
    </div>
  )
}
