import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'
import { Sun, Moon, X, Square, Minus } from 'lucide-react'

function Titlebar() {
  const { theme, setTheme } = useTheme()

  const handleWindowControl = (action: 'minimize' | 'maximize' | 'close') => {
    // @ts-ignore
    window.electron?.ipcRenderer?.send('window-control', action)
  }

  return (
    <header
      className="flex items-center justify-between p-2 select-none bg-background border-b "
      style={{
        // @ts-ignore
        WebkitAppRegion: 'drag',
        userSelect: 'none',
        height: 42,
        // Expose a CSS var so sidebar can offset below titlebar
        /* @ts-ignore */
        ['--titlebar-height' as any]: '42px'
      }}
    >
      <div className="flex items-center gap-2 text-base font-semibold">Crosshair+</div>
      {/* @ts-ignore */}
      <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleWindowControl('minimize')}
          title="Minimize"
          aria-label="Minimize window"
        >
          <Minus size={18} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleWindowControl('maximize')}
          title="Maximize"
          aria-label="Maximize window"
        >
          <Square size={18} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleWindowControl('close')}
          title="Close"
          aria-label="Close window"
        >
          <X size={18} />
        </Button>
      </div>
    </header>
  )
}

export default Titlebar
