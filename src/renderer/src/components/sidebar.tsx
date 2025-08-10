import { useState, useEffect } from 'react'
import { NavLink } from 'react-router'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Home, Settings, Menu, ChevronLeft, Pencil, Axis3D } from 'lucide-react'

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
    { to: '/positioning', label: 'Positioning', icon: <Axis3D size={18} className="rotate-90" /> },
    { to: '/editor', label: 'Editor', icon: <Pencil size={18} /> },
    { to: '/settings', label: 'Settings', icon: <Settings size={18} /> }
  ]

  return (
    <aside
      className={cn(
        ' left-0 top-[var(--titlebar-height)] h-full bg-background border-r flex flex-col transition-[width] duration-300 ease-in-out',
        collapsed ? 'w-14' : 'w-56'
      )}
    >
      <div className={cn('flex items-center justify-between p-2', collapsed && 'border-b')}>
        <Button variant="ghost" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      <nav className="flex flex-col gap-1 p-2">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-md px-3 py-2 text-sm transition-all active:scale-95',
                collapsed ? 'justify-start gap-0' : 'gap-2',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <span className="w-5 h-5 flex items-center justify-start">{icon}</span>
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
