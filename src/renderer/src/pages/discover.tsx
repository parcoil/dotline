import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Crosshair } from '@/components/crosshair'
import type { CrosshairConfig, CrosshairLibraryItem } from '@/types/crosshair'
import { defaultConfig } from '@/types/crosshair'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { presets } from '@/lib/presets'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Home, Paintbrush } from 'lucide-react'

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

function Discover() {
  const navigate = useNavigate()
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

  const editItem = (cfg: CrosshairConfig) => {
    navigate('/editor', { state: { initialConfig: cfg } })
  }

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
    <div className="space-y-8 px-4 md:px-0 max-w-[1200px] mx-auto">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Discover Crosshairs</h1>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={importPresetFile}>
            Import Preset
          </Button>
          <Button onClick={saveCurrentToLibrary}>Save Current to Library</Button>
        </div>
      </header>
      <Tabs defaultValue="library">
        <TabsList className="w-56 ">
          <TabsTrigger
            value="library"
            className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground"
          >
            <Home className="w-4 h-4" /> Library
          </TabsTrigger>
          <TabsTrigger
            value="presets"
            className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground"
          >
            <Paintbrush className="w-4 h-4" /> Presets
          </TabsTrigger>
        </TabsList>
        <TabsContent value="library">
          <Card>
            <CardHeader>
              <CardTitle>Your Library</CardTitle>
            </CardHeader>
            <CardContent>
              {library.length === 0 ? (
                <p className="text-muted-foreground text-center text-sm py-8">
                  No saved crosshairs yet.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                  {library.map((item) => (
                    <div
                      key={item.id}
                      className="space-y-3"
                      tabIndex={0}
                      role="group"
                      aria-label={item.name}
                    >
                      <div
                        className="rounded-md border border-border bg-background relative flex items-center justify-center shadow-sm transition-shadow hover:shadow-md focus-visible:shadow-md outline-none"
                        style={{ width: 140, height: 140 }}
                      >
                        <Crosshair mode="embed" config={scaleConfigForPreview(item.config, 140)} />
                      </div>
                      <Tooltip>
                        <TooltipTrigger>
                          <p
                            className="text-sm font-medium truncate cursor-default"
                            title={item.name}
                          >
                            {item.name}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent>
                          <span>{item.name}</span>
                        </TooltipContent>
                      </Tooltip>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => applyConfig(item.config)}>
                          Apply
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => editItem(item.config)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => exportItem(item)}>
                          Export
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteItem(item.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="presets">
          {' '}
          <Card>
            <CardHeader>
              <CardTitle>Presets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {presets.map((preset) => (
                  <div
                    key={preset.name}
                    className="flex flex-col items-center gap-3"
                    tabIndex={0}
                    role="group"
                    aria-label={`Preset: ${preset.name}`}
                  >
                    <div
                      className="rounded-md border border-border bg-background relative flex items-center justify-center shadow-sm transition-shadow hover:shadow-md focus-visible:shadow-md outline-none"
                      style={{ width: 120, height: 120 }}
                    >
                      <Crosshair mode="embed" config={scaleConfigForPreview(preset.config, 120)} />
                    </div>
                    <p
                      className="text-sm font-semibold text-center truncate w-full"
                      title={preset.name}
                    >
                      {preset.name}
                    </p>
                    <p className="text-xs text-muted-foreground text-center truncate w-full">
                      Created by <span className="font-bold">{preset.config.creator}</span>
                    </p>
                    <p className="text-xs text-muted-foreground text-center truncate w-full">
                      Type: {''}
                      {preset.config.style}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addPresetToLibrary(preset.config, preset.name)}
                      >
                        Import
                      </Button>
                      <Button size="sm" onClick={() => applyConfig(preset.config)}>
                        Apply
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Discover
