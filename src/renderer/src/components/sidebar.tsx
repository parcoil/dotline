import { useState, useEffect } from 'react'
import { NavLink } from 'react-router'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Home,
  Settings,
  Menu,
  ChevronLeft,
  Pencil,
  Axis3D,
  HelpCircle,
  Info,
  Move3D
} from 'lucide-react'
import Discord from './discord'

function Sidebar() {
  const [collapsed, setCollapsed] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) {
      setCollapsed(saved === 'true')
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed))
  }, [collapsed])

  const navItems = [
    { to: '/', label: 'Discover', icon: <Home size={18} /> },
    { to: '/positioning', label: 'Positioning', icon: <Move3D size={18} /> },
    { to: '/editor', label: 'Editor', icon: <Pencil size={18} /> }
  ]

  const footerItems = [{ to: '/settings', label: 'Settings', icon: <Settings size={18} /> }]

  return (
    <aside
      className={cn(
        'left-0 top-[var(--titlebar-height)] h-full bg-background border-r flex flex-col transition-[width] duration-300 ease-in-out',
        collapsed ? 'w-14' : 'w-56'
      )}
    >
      <div className={cn('flex items-center justify-between p-2', collapsed && 'border-b')}>
        <Button variant="ghost" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <Menu size={18} /> : <Menu size={18} />}
        </Button>
      </div>

      <nav className="flex flex-col gap-1 p-2">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-md px-2.5 py-2 text-sm transition-all active:scale-95 gap-2',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <span className="flex items-center justify-center w-5 h-5">{icon}</span>
            <span
              className={cn(
                'whitespace-nowrap transition-opacity duration-200',
                collapsed ? 'opacity-0 overflow-hidden w-0' : 'opacity-100 w-auto'
              )}
            >
              {label}
            </span>
          </NavLink>
        ))}
      </nav>

      <nav className="flex flex-col gap-1 p-2 mt-auto border-t">
        {footerItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-md px-2.5 py-2 text-sm transition-all active:scale-95 gap-2',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <span className="flex items-center justify-center w-5 h-5">{icon}</span>
            <span
              className={cn(
                'whitespace-nowrap transition-opacity duration-200',
                collapsed ? 'opacity-0 overflow-hidden w-0' : 'opacity-100 w-auto'
              )}
            >
              {label}
            </span>
          </NavLink>
        ))}
        <a
          href="https://discord.com/invite/En5YJYWj3Z"
          target="_blank"
          className={cn(
            'flex items-center rounded-md px-2.5 py-2 text-sm transition-all active:scale-95 gap-2',
            'hover:bg-accent hover:text-accent-foreground'
          )}
        >
          <span className="flex items-center justify-center">
            <Discord className="w-5 h-5 fill-primary" />
          </span>
          <span
            className={cn(
              'whitespace-nowrap transition-opacity duration-200',
              collapsed ? 'opacity-0 overflow-hidden w-0' : 'opacity-100 w-auto'
            )}
          >
            Discord
          </span>
        </a>
      </nav>
    </aside>
  )
}

export default Sidebar
