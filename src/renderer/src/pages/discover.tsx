import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Crosshair } from '@/components/crosshair'
import type { CrosshairConfig, CrosshairLibraryItem } from '@/types/crosshair'
import { defaultConfig } from '@/types/crosshair'

const LS_KEY = 'crosshairLibrary'

function loadLibrary(): CrosshairLibraryItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

function saveLibrary(items: CrosshairLibraryItem[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(items))
}

function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

const presets: { name: string; config: CrosshairConfig }[] = [
  { name: 'Green Classic', config: { ...defaultConfig, style: 'classic', color: '#22C55E' } },
  { name: 'Tiny Dot', config: { ...defaultConfig, style: 'dot', thickness: 2, color: '#ffffff' } },
  { name: 'Circle ADS', config: { ...defaultConfig, style: 'circle', length: 12, gap: 2 } },
  {
    name: 'X Neon',
    config: { ...defaultConfig, style: 'x', color: '#00e5ff', thickness: 2, gap: 3 }
  }
]

function Discover() {
  const [library, setLibrary] = useState<CrosshairLibraryItem[]>([])
  const [current, setCurrent] = useState<CrosshairConfig>(defaultConfig)

  useEffect(() => {
    setLibrary(loadLibrary())
    const savedRaw = localStorage.getItem('currentConfig')
    if (savedRaw) {
      try {
        const saved = JSON.parse(savedRaw)
        setCurrent({ ...defaultConfig, ...saved })
      } catch {}
    }
  }, [])

  const addPresetToLibrary = (cfg: CrosshairConfig, name?: string) => {
    const item: CrosshairLibraryItem = {
      id: makeId(),
      name: name || `Crosshair ${library.length + 1}`,
      createdAt: Date.now(),
      config: cfg
    }
    const next = [item, ...library]
    setLibrary(next)
    saveLibrary(next)
  }

  const applyConfig = async (cfg: CrosshairConfig) => {
    localStorage.setItem('currentConfig', JSON.stringify(cfg))
    setCurrent(cfg)
    await window.electron.ipcRenderer.invoke('overlay:update-config', cfg)
  }

  const importPresetFile = async () => {
    const imported = (await window.electron.ipcRenderer.invoke(
      'config:import'
    )) as CrosshairConfig | null
    if (imported) addPresetToLibrary({ ...defaultConfig, ...imported }, 'Imported')
  }

  const exportItem = async (item: CrosshairLibraryItem) => {
    await window.electron.ipcRenderer.invoke('config:export', item.config)
  }

  const deleteItem = (id: string) => {
    const next = library.filter((i) => i.id !== id)
    setLibrary(next)
    saveLibrary(next)
  }

  const saveCurrentToLibrary = () => addPresetToLibrary(current, 'Current Config')

  const scaleConfigForPreview = (cfg: CrosshairConfig, size: number): CrosshairConfig => {
    const base = Math.max((cfg.length + cfg.gap) * 2 + cfg.thickness * 2, 64)
    const scale = Math.min(1, size / base)
    return {
      ...cfg,
      enabled: true,
      length: Math.max(1, Math.round(cfg.length * scale)),
      gap: Math.max(0, Math.round(cfg.gap * scale)),
      thickness: Math.max(1, Math.round(cfg.thickness * scale))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Discover Crosshairs</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={importPresetFile}>
            Import preset
          </Button>
          <Button onClick={saveCurrentToLibrary}>Save current to library</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Presets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {presets.map((p) => (
              <div key={p.name} className="flex flex-col items-center gap-2">
                <div
                  className="rounded-md border bg-background relative flex items-center justify-center"
                  style={{ width: 120, height: 120 }}
                >
                  <Crosshair mode="embed" config={scaleConfigForPreview(p.config, 120)} />
                </div>
                <div className="text-sm text-center">{p.name}</div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addPresetToLibrary(p.config, p.name)}
                  >
                    Add
                  </Button>
                  <Button size="sm" onClick={() => applyConfig(p.config)}>
                    Apply
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Library</CardTitle>
        </CardHeader>
        <CardContent>
          {library.length === 0 ? (
            <div className="text-muted-foreground text-sm">No saved crosshairs yet.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {library.map((item) => (
                <div key={item.id} className="space-y-2">
                  <div
                    className="rounded-md border bg-background relative flex items-center justify-center"
                    style={{ width: 160, height: 160 }}
                  >
                    <Crosshair mode="embed" config={scaleConfigForPreview(item.config, 160)} />
                  </div>
                  <div className="text-sm font-medium truncate" title={item.name}>
                    {item.name}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => applyConfig(item.config)}>
                      Apply
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => exportItem(item)}>
                      Export
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteItem(item.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Discover
