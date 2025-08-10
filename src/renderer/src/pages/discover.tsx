import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Crosshair } from '@/components/crosshair'
import type { CrosshairConfig, CrosshairLibraryItem } from '@/types/crosshair'
import { defaultConfig } from '@/types/crosshair'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { presets } from '@/lib/presets'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Home, Paintbrush, Import, Save, Trash2, Pencil, Download } from 'lucide-react'

const LS_KEY = 'crosshairLibrary'

function loadLibrary(): CrosshairLibraryItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : []
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

  const CrosshairCard = ({
    name,
    config,
    actions,
    previewSize = 140,
    creator,
    style
  }: {
    name: string
    config: CrosshairConfig
    previewSize?: number
    creator?: string
    style?: string
    actions: React.ReactNode
  }) => (
    <Card className="group">
      <CardContent className="pt-4 space-y-2 flex flex-col items-center">
        <div
          className="rounded-md border bg-background relative flex items-center justify-center shadow-sm transition-shadow group-hover:shadow-md"
          style={{ width: previewSize, height: previewSize }}
        >
          <Crosshair mode="embed" config={scaleConfigForPreview(config, previewSize)} />
        </div>
        <p className="text-sm font-medium truncate w-full text-center">{name}</p>
        {creator && <p className="text-xs text-muted-foreground text-center">By {creator}</p>}
        {style && <p className="text-xs text-muted-foreground text-center">Type: {style}</p>}
        <div className="flex gap-2 mt-2">{actions}</div>
      </CardContent>
    </Card>
  )
  const TooltipButton = ({ children, label }: { children: React.ReactNode; label: string }) => (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  )
  return (
    <div className="space-y-8 px-4 md:px-0 max-w-[1200px] mx-auto">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Discover Crosshairs</h1>
          <p className="text-muted-foreground">Manage your saved crosshairs or explore presets</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={importPresetFile}>
            <Import className="w-4 h-4 mr-2" /> Import Preset
          </Button>
          <Button onClick={saveCurrentToLibrary}>
            <Save className="w-4 h-4 mr-2" /> Save Current
          </Button>
        </div>
      </header>

      <Tabs defaultValue="library">
        <TabsList>
          <TabsTrigger value="library">
            <Home className="w-4 h-4 mr-2" /> Library
          </TabsTrigger>
          <TabsTrigger value="presets">
            <Paintbrush className="w-4 h-4 mr-2" /> Presets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="library">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {library.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No saved crosshairs yet.
                </CardContent>
              </Card>
            ) : (
              library.map((item) => (
                <CrosshairCard
                  key={item.id}
                  name={item.name}
                  config={item.config}
                  actions={
                    <>
                      <Button size="sm" onClick={() => applyConfig(item.config)}>
                        Apply
                      </Button>
                      <TooltipButton label="Edit this crosshair">
                        <Button size="sm" variant="secondary" onClick={() => editItem(item.config)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </TooltipButton>
                      <TooltipButton label="Export this crosshair configuration">
                        <Button size="sm" variant="outline" onClick={() => exportItem(item)}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </TooltipButton>
                      <TooltipButton label="Delete this crosshair">
                        <Button size="sm" variant="destructive" onClick={() => deleteItem(item.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TooltipButton>
                    </>
                  }
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="presets">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {presets.map((preset) => (
              <CrosshairCard
                key={preset.name}
                name={preset.name}
                config={preset.config}
                previewSize={140}
                creator={preset.config.creator}
                style={preset.config.style}
                actions={
                  <>
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
                  </>
                }
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Discover
