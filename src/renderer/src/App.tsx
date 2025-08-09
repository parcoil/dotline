import { useEffect, useState } from 'react'
import { HashRouter as Router, Routes, Route } from 'react-router'
import { Crosshair } from './components/Crosshair'
import type { CrosshairConfig } from './types/crosshair'
import { defaultConfig } from './types/crosshair'
import Settings from './pages/settings'
import Discover from './pages/discover'

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
        const saved = JSON.parse(savedRaw) as CrosshairConfig
        setConfig(saved)
      } catch {}
    }
  }, [])

  return <Crosshair config={config} />
}

function RoutedApp() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Settings />} />
        <Route path="/discover" element={<Discover />} />
      </Routes>
    </Router>
  )
}

function App() {
  const params = new URLSearchParams(window.location.search)
  const isOverlay = params.get('overlay') === '1'
  return isOverlay ? <Overlay /> : <RoutedApp />
}

export default App
