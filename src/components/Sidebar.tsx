import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Megaphone, ShoppingCart, Plug, Settings, X, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/campaigns', icon: Megaphone, label: 'Campanhas' },
  { to: '/sales', icon: ShoppingCart, label: 'Vendas' },
  { to: '/integrations', icon: Plug, label: 'Integrações' },
  { to: '/settings', icon: Settings, label: 'Configurações' },
]

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/70 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-30 h-full w-64 bg-[#0D1526] border-r border-[#1E2D4A] flex flex-col transition-transform duration-300',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-[#1E2D4A]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#6366F1] flex items-center justify-center shadow-lg shadow-[#3B82F6]/20">
              <BarChart2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[#E2E8F0] font-bold text-sm leading-tight">SG Plataformas</p>
              <p className="text-[#64748B] text-xs">Dashboard · Ads</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-[#64748B] hover:text-[#E2E8F0] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => { if (window.innerWidth < 1024) onClose() }}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30'
                    : 'text-[#64748B] hover:text-[#E2E8F0] hover:bg-[#1E2D4A]'
                )
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#1E2D4A]">
          <div className="bg-[#0A0F1E] rounded-lg p-3 text-xs text-[#64748B]">
            <p className="font-semibold text-[#3B82F6] mb-0.5">SG Plataformas</p>
            <p>Painel de Rastreamento</p>
          </div>
        </div>
      </aside>
    </>
  )
}
