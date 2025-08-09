import { useEffect, useState } from 'react'
import { Checkbox } from './components/ui/checkbox'
import { Slider } from './components/ui/slider'

import { Button } from './components/ui/button'
import { Label } from './components/ui/label'
import { Input } from './components/ui/input'
import { Crosshair } from './components/Crosshair'
import type { CrosshairConfig } from './types/crosshair'

const defaultConfig: CrosshairConfig = {
  enabled: true,
  color: '#22C55E',
  opacity: 1,
  thickness: 2,
  length: 5,
  gap: 0,
  centerDot: false
}

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

function Settings() {
  const [config, setConfig] = useState<CrosshairConfig>(defaultConfig)

  useEffect(() => {
    const savedRaw = localStorage.getItem('currentConfig')
    if (savedRaw) {
      try {
        const saved = JSON.parse(savedRaw) as CrosshairConfig
        setConfig(saved)
        // also inform overlay on startup
        window.electron.ipcRenderer.invoke('overlay:update-config', saved)
      } catch {}
    }
  }, [])

  useEffect(() => {
    window.electron.ipcRenderer.invoke('overlay:update-config', config)
  }, [config])

  const handleChange = <K extends keyof CrosshairConfig>(key: K, value: CrosshairConfig[K]) => {
    setConfig((c) => ({ ...c, [key]: value }))
  }

  const save = async () => {
    localStorage.setItem('currentConfig', JSON.stringify(config))
    await window.electron.ipcRenderer.invoke('overlay:update-config', config)
  }

  return (
    <div className="p-6 max-w-md mx-auto space-y-6">
      <Label className="flex items-center justify-between">
        <span>Enabled</span>
        <Checkbox
          checked={config.enabled}
          onCheckedChange={(checked) => handleChange('enabled', !!checked)}
        />
      </Label>

      <div>
        <Label htmlFor="color-picker">Color</Label>
        <Input
          id="color-picker"
          type="color"
          value={config.color}
          onChange={(e) => handleChange('color', e.target.value)}
          className="w-20 h-10 p-0 border-none cursor-pointer"
        />
      </div>

      <div>
        <Label>Opacity: {config.opacity.toFixed(2)}</Label>
        <Slider
          value={[config.opacity]}
          onValueChange={(val) => handleChange('opacity', val[0])}
          min={0}
          max={1}
          step={0.01}
        ></Slider>
      </div>

      <div>
        <Label>Thickness: {config.thickness}</Label>
        <Slider
          value={[config.thickness]}
          onValueChange={(val) => handleChange('thickness', val[0])}
          min={1}
          max={10}
          step={1}
        ></Slider>
      </div>

      <div>
        <Label>Length: {config.length}</Label>
        <Slider
          value={[config.length]}
          onValueChange={(val) => handleChange('length', val[0])}
          min={2}
          max={50}
          step={1}
        ></Slider>
      </div>

      <div>
        <Label>Gap: {config.gap}</Label>
        <Slider
          value={[config.gap]}
          onValueChange={(val) => handleChange('gap', val[0])}
          min={0}
          max={50}
          step={1}
        ></Slider>
      </div>

      <Label className="flex items-center justify-between">
        <span>Center dot</span>
        <Checkbox
          checked={config.centerDot}
          onCheckedChange={(checked) => handleChange('centerDot', !!checked)}
        />
      </Label>

      <Button onClick={save} className="w-full mt-4">
        Save
      </Button>
    </div>
  )
}

function App() {
  const params = new URLSearchParams(window.location.search)
  const isOverlay = params.get('overlay') === '1'
  return isOverlay ? <Overlay /> : <Settings />
}

export default App
