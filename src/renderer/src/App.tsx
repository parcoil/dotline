import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router'
import { Crosshair } from '@/components/crosshair'
import type { CrosshairConfig } from '@/types/crosshair'
import { defaultConfig } from '@/types/crosshair'
import Editor from '@/pages/editor'
import Discover from '@/pages/discover'
import Titlebar from './components/Titlebar'
import Sidebar from './components/sidebar'
import Positioning from './pages/positioning'
import Settings from './pages/settings'

function Overlay() {
  const [config, setConfig] = useState<CrosshairConfig>(defaultConfig)

  useEffect(() => {
    const listener = (_event: unknown, cfg: CrosshairConfig) => setConfig(cfg)
    window.electron.ipcRenderer.on('overlay:config', listener as any)
    return () => {
      window.electron.ipcRenderer.removeListener('overlay:config', listener as any)
    }
  }, [])

  useEffect(() => {
    const savedRaw = localStorage.getItem('currentConfig')
    if (savedRaw) {
      try {
        const saved = JSON.parse(savedRaw) as Partial<CrosshairConfig>
        setConfig({ ...defaultConfig, ...saved })
      } catch {}
    }
  }, [])

  return <Crosshair config={config} />
}

function RoutedApp() {
  return (
    <div className="flex flex-col h-screen">
      <Titlebar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-4">
          <Routes>
            <Route path="/" element={<Discover />} />
            <Route path="/positioning" element={<Positioning />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/editor" element={<Editor />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function App() {
  const params = new URLSearchParams(window.location.search)
  const isOverlay = params.get('overlay') === '1'
  return isOverlay ? <Overlay /> : <RoutedApp />
}

export default App
