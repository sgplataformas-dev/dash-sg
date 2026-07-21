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
          'fixed top-0 left-0 z-30 h-full w-[76px] glass-sidebar flex flex-col items-center py-6 gap-6 transition-transform duration-300',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button onClick={onClose} className="lg:hidden absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>

        {/* Logo */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-green to-brand-blue flex items-center justify-center shadow-lg shadow-brand-green/20 flex-shrink-0">
          <BarChart2 className="w-5 h-5 text-primary-foreground" />
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              title={label}
              onClick={() => { if (window.innerWidth < 1024) onClose() }}
              className={({ isActive }) =>
                cn(
                  'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-150',
                  isActive
                    ? 'bg-brand-green text-primary-foreground shadow-lg shadow-brand-green/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                )
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="sr-only">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Avatar / brand mark */}
        <div className="mt-auto flex flex-col items-center gap-1" title="SG Plataformas — Rastreamento de Ads">
          <div className="w-9 h-9 rounded-full bg-inner border border-border flex items-center justify-center text-[10px] font-display font-bold text-brand-green">
            SG
          </div>
        </div>
      </aside>
    </>
  )
}
