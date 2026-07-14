import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Menu, RefreshCw, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getStoredTheme, applyTheme, type Theme } from '@/lib/theme'

interface HeaderProps {
  onMenuClick: () => void
  onRefresh: () => void
  refreshing: boolean
}

const routeNames: Record<string, string> = {
  '/dashboard':    'Dashboard',
  '/campaigns':    'Campanhas',
  '/sales':        'Vendas',
  '/integrations': 'Integrações',
  '/settings':     'Configurações',
}

export function Header({ onMenuClick, onRefresh, refreshing }: HeaderProps) {
  const location = useLocation()
  const pageName = routeNames[location.pathname] ?? 'Dashboard'
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme())

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    applyTheme(next)
  }

  return (
    <header className="h-16 bg-sidebar/60 backdrop-blur-xl border-b border-white/5 dark:border-white/5 flex items-center justify-between px-4 lg:px-8 flex-shrink-0 z-40">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden text-muted-foreground hover:text-foreground transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
            <span>sgGlobalDash</span>
            <span>/</span>
            <span className="text-foreground">{pageName}</span>
          </div>
          <h1 className="font-display text-lg font-semibold text-foreground tracking-tight">{pageName}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-muted-foreground hover:text-foreground h-9 w-9 rounded-full"
          aria-label="Alternar tema"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
        <Button
          size="sm"
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-full"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline text-xs">Atualizar</span>
        </Button>
      </div>
    </header>
  )
}
