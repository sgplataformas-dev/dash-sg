import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Megaphone, ShoppingCart, Plug, Settings, X, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const navItems = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard'      },
  { to: '/campaigns',    icon: Megaphone,        label: 'Campanhas'      },
  { to: '/sales',        icon: ShoppingCart,     label: 'Vendas'         },
  { to: '/integrations', icon: Plug,             label: 'Integrações'    },
  { to: '/settings',     icon: Settings,         label: 'Configurações'  },
]

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-20 bg-black/70 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-30 h-full w-60 bg-[#16213E] border-r border-[#2d2d4a] flex flex-col transition-transform duration-300',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-[#2d2d4a]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#74B9FF] to-[#6C5CE7] flex items-center justify-center shadow-lg shadow-[#74B9FF]/20">
              <BarChart2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[#E0E0E0] font-bold text-sm leading-tight">sgGlobalDash</p>
              <p className="text-[#8892a4] text-xs">Facebook Ads</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-[#8892a4] hover:text-[#E0E0E0] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => { if (window.innerWidth < 1024) onClose() }}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-[#74B9FF]/15 text-[#74B9FF] border border-[#74B9FF]/25'
                    : 'text-[#8892a4] hover:text-[#E0E0E0] hover:bg-[#2d2d4a]/40'
                )
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#2d2d4a]">
          <div className="bg-[#0F0F23] rounded-lg p-3 text-xs text-[#8892a4]">
            <p className="font-semibold text-[#74B9FF] mb-0.5">SG Plataformas</p>
            <p>Rastreamento de Ads</p>
          </div>
        </div>
      </aside>
    </>
  )
}
