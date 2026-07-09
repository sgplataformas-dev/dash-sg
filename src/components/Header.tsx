import { useLocation } from 'react-router-dom'
import { Menu, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

  return (
    <header className="h-14 bg-[#16213E] border-b border-[#2d2d4a] flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden text-[#8892a4] hover:text-[#E0E0E0] transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-sm text-[#8892a4]">
          <span>sgGlobalDash</span>
          <span className="text-[#2d2d4a]">/</span>
          <span className="text-[#E0E0E0] font-medium">{pageName}</span>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={refreshing}
        className="flex items-center gap-2 border-[#2d2d4a] text-[#8892a4] hover:text-[#E0E0E0]"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline text-xs">Atualizar</span>
      </Button>
    </header>
  )
}
