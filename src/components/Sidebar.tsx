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
          'fixed top-0 left-0 z-30 h-full w-60 bg-[#0D0D12] border-r border-[#27272F] flex flex-col transition-transform duration-300',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-[#27272F]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#12E28A] to-[#4FA3FF] flex items-center justify-center shadow-lg shadow-[#12E28A]/20">
              <BarChart2 className="w-5 h-5 text-[#0A0A0F]" />
            </div>
            <div>
              <p className="text-[#F2F2F0] font-bold text-sm leading-tight">sgGlobalDash</p>
              <p className="text-[#909099] text-xs">Facebook Ads</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-[#909099] hover:text-[#F2F2F0] transition-colors">
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
                    ? 'bg-[#12E28A]/15 text-[#12E28A] border border-[#12E28A]/25'
                    : 'text-[#909099] hover:text-[#F2F2F0] hover:bg-[#27272F]/40'
                )
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#27272F]">
          <div className="bg-[#0A0A0F] rounded-lg p-3 text-xs text-[#909099]">
            <p className="font-semibold text-[#12E28A] mb-0.5">SG Plataformas</p>
            <p>Rastreamento de Ads</p>
          </div>
        </div>
      </aside>
    </>
  )
}
