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
    <header className="h-16 bg-[#0D1526] border-b border-[#1E2D4A] flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-[#64748B] hover:text-[#E2E8F0] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-sm text-[#64748B]">
          <span>SG Plataformas</span>
          <span className="text-[#1E2D4A]">/</span>
          <span className="text-[#E2E8F0] font-medium">{pageName}</span>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={refreshing}
        className="flex items-center gap-2"
      >
        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">Atualizar</span>
      </Button>
    </header>
  )
}
