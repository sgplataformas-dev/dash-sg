import { useState, type FormEvent } from 'react'
import { BarChart2, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('E-mail ou senha inválidos.')
    setLoading(false)
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background">
      <div className="aurora-bg" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative z-10 w-full max-w-[420px] px-6 flex flex-col items-center">
        {/* Logo & Header */}
        <div className="mb-8 text-center animate-fade-up">
          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute w-20 h-20 rounded-full bg-gradient-to-br from-brand-green to-brand-blue blur-2xl opacity-20 animate-pulse" />
            <div className="relative w-14 h-14 flex items-center justify-center rounded-2xl bg-card border border-border shadow-2xl">
              <BarChart2 className="w-6 h-6 text-brand-green" />
            </div>
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground tracking-tight mb-2">dash-sg</h1>
          <p className="text-muted-foreground text-xs opacity-80 uppercase tracking-widest font-medium">
            SG Plataformas &bull; Acesso Seguro
          </p>
        </div>

        {/* Auth Card */}
        <div className="w-full bg-card border border-border rounded-[20px] p-8 shadow-2xl animate-fade-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email-input" className="block text-[10px] font-bold uppercase tracking-widest text-brand-green opacity-80 ml-1">
                Endereço de E-mail
              </label>
              <input
                id="email-input"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green transition-all placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password-input" className="block text-[10px] font-bold uppercase tracking-widest text-brand-green opacity-80 ml-1">
                Senha de Acesso
              </label>
              <input
                id="password-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green transition-all placeholder:text-muted-foreground"
              />
            </div>

            {error && <p className="text-brand-red text-xs font-medium text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-green to-brand-blue text-primary-foreground font-semibold text-sm py-3 rounded-xl shadow-lg shadow-brand-green/20 hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              ACESSAR DASHBOARD
            </button>
          </form>

          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green" />
              </span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Conexão Segura</span>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-muted-foreground text-xs font-medium animate-fade-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
          Problemas no login? Contate o administrador do sistema.
        </p>
      </div>
    </div>
  )
}
