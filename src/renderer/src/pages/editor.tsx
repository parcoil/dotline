import { useEffect, useState } from "react"
import { CrosshairConfig } from "../../../types/crosshair"
import type { CrosshairLibraryItem } from "../../../types/crosshair"
import { Label } from "../components/ui/label"
import { Input } from "../components/ui/input"
import { Slider } from "../components/ui/slider"
import { Button } from "../components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card"
import { defaultConfig } from "../../../types/crosshair"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from "@/components/ui/select"
import { Crosshair } from "@/components/crosshair"
import { useLocation } from "react-router"
import { toast } from "sonner"

function Editor() {
  const location = useLocation()
  type EditorNavState = { initialConfig?: CrosshairConfig; itemId?: string; itemName?: string }
  const state = (location.state ?? {}) as EditorNavState
  const navInitial = state.initialConfig
  const editingItemId = state.itemId
  const editingItemName = state.itemName
  const editingExisting = !!editingItemId
  const [config, setConfig] = useState<CrosshairConfig>(navInitial ?? defaultConfig)
  const [saveName, setSaveName] = useState<string>("")

  useEffect(() => {
    if (!navInitial) {
      const savedRaw = localStorage.getItem("currentConfig")
      if (savedRaw) {
        try {
          const saved = JSON.parse(savedRaw) as Partial<CrosshairConfig>
          const merged = { ...defaultConfig, ...saved }
          setConfig(merged)
        } catch {}
      }
    }
  }, [])

  const handleChange = <K extends keyof CrosshairConfig>(
    key: K,
    value: CrosshairConfig[K]
  ): void => {
    setConfig((c) => ({ ...c, [key]: value }))
  }

  const save = async (): Promise<void> => {
    localStorage.setItem("currentConfig", JSON.stringify(config))
    await window.electron.ipcRenderer.invoke("overlay:update-config", config)
    toast.success("Applied current config")
  }

  const saveOverwriteOrNew = (): void => {
    if (editingExisting && editingItemId) {
      const library = loadLibrary()
      const idx = library.findIndex((i) => i.id === editingItemId)
      if (idx !== -1) {
        library[idx] = { ...library[idx], config }
        saveLibrary(library)
        toast.success(`Saved to "${editingItemName || library[idx].name}"`)
        return
      }
    }
    const library = loadLibrary()
    const item: CrosshairLibraryItem = {
      id: makeId(),
      name: saveName && saveName.trim() ? saveName.trim() : `Crosshair ${library.length + 1}`,
      createdAt: Date.now(),
      config
    }
    const next = [item, ...library]
    saveLibrary(next)
    setSaveName("")
    toast.success(`Saved "${item.name}" to library`)
  }

  const handleExport = async (): Promise<void> => {
    try {
      await window.electron.ipcRenderer.invoke("config:export", config)
      toast.success("Exported current config")
    } catch {
      toast.error("Failed to export config")
    }
  }

  const handleImport = async (): Promise<void> => {
    const imported = await window.electron.ipcRenderer.invoke("config:import")
    if (imported) {
      setConfig(imported as CrosshairConfig)
      localStorage.setItem("currentConfig", JSON.stringify(imported))
      await window.electron.ipcRenderer.invoke("overlay:update-config", imported as CrosshairConfig)
      toast.success("Imported config successfully")
    } else {
      toast.error("Import cancelled or failed")
    }
  }

  const LS_KEY = "crosshairLibrary"
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
  function saveLibrary(items: CrosshairLibraryItem[]): void {
    localStorage.setItem(LS_KEY, JSON.stringify(items))
  }
  function makeId(): string {
    return Math.random().toString(36).slice(2, 10)
  }
  const saveToLibrary = () => {
    const library = loadLibrary()
    const item: CrosshairLibraryItem = {
      id: makeId(),
      name: saveName && saveName.trim() ? saveName.trim() : `Crosshair ${library.length + 1}`,
      createdAt: Date.now(),
      config
    }
    const next = [item, ...library]
    saveLibrary(next)
    setSaveName("")
    toast.success(`Saved "${item.name}" to library`)
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
    <div className="max-w-3xl mx-auto space-y-4">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editor</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {editingExisting
              ? `Editing: ${editingItemName ?? "Saved crosshair"}`
              : "Editing: New crosshair"}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => setConfig(defaultConfig)}>
            Reset
          </Button>
          <Button onClick={save}>Apply to Current</Button>
          <Button variant="outline" onClick={saveOverwriteOrNew}>
            {editingItemName ? `Update "${editingItemName}"` : "Save to library"}
          </Button>
        </div>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <div
              className="rounded-md border bg-background relative flex items-center justify-center"
              style={{ width: 240, height: 240 }}
            >
              <Crosshair mode="embed" config={scaleConfigForPreview(config, 220)} />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Label>Style</Label>
            <Select value={config.style} onValueChange={(v) => handleChange("style", v as any)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="classic">Classic</SelectItem>
                <SelectItem value="dot">Dot</SelectItem>
                <SelectItem value="circle">Circle</SelectItem>
                <SelectItem value="x">X</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="color-picker">Color</Label>
            <Input
              id="color-picker"
              type="color"
              value={config.color}
              onChange={(e) => handleChange("color", e.target.value)}
              className="w-20 h-10 p-0 border-none cursor-pointer mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="gap-3 flex flex-col">
            <div className="flex justify-between">
              <Label>Opacity</Label>
              <span className="text-sm text-muted-foreground">{config.opacity.toFixed(2)}</span>
            </div>
            <Slider
              value={[config.opacity]}
              onValueChange={(val) => handleChange("opacity", val[0])}
              min={0}
              max={1}
              step={0.01}
            />
          </div>

          <div className="gap-3 flex flex-col">
            <div className="flex justify-between">
              <Label>Thickness</Label>
              <span className="text-sm text-muted-foreground">{config.thickness}</span>
            </div>
            <Slider
              value={[config.thickness]}
              onValueChange={(val) => handleChange("thickness", val[0])}
              min={1}
              max={10}
              step={1}
            />
          </div>

          <div className="gap-3 flex flex-col">
            <div className="flex justify-between">
              <Label>Length</Label>
              <span className="text-sm text-muted-foreground">{config.length}</span>
            </div>
            <Slider
              value={[config.length]}
              onValueChange={(val) => handleChange("length", val[0])}
              min={2}
              max={50}
              step={1}
            />
          </div>

          <div className="gap-3 flex flex-col">
            <div className="flex justify-between">
              <Label>Gap</Label>
              <span className="text-sm text-muted-foreground">{config.gap}</span>
            </div>
            <Slider
              value={[config.gap]}
              onValueChange={(val) => handleChange("gap", val[0])}
              min={0}
              max={50}
              step={1}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Outline</Label>
            <Switch
              checked={config.outline ?? false}
              onCheckedChange={(checked) =>
                setConfig((c) => {
                  const next = { ...c, outline: !!checked }
                  if (checked) {
                    if (!next.outlineColor) next.outlineColor = "#000000"
                    if (next.outlineThickness == null) next.outlineThickness = 1
                    if (next.outlineOpacity == null) next.outlineOpacity = 1
                  }
                  return next
                })
              }
            />
          </div>

          {config.outline && (
            <>
              <div>
                <Label>Outline Color</Label>
                <Input
                  type="color"
                  value={config.outlineColor ?? "#000000"}
                  onChange={(e) => handleChange("outlineColor", e.target.value)}
                  className="w-20 h-10 p-0 border-none cursor-pointer mt-1"
                />
              </div>

              <div className="gap-3 flex flex-col">
                <div className="flex justify-between">
                  <Label>Outline Thickness</Label>
                  <span className="text-sm text-muted-foreground">
                    {config.outlineThickness ?? 1}
                  </span>
                </div>
                <Slider
                  value={[config.outlineThickness ?? 1]}
                  onValueChange={(val) => handleChange("outlineThickness", val[0])}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>

              <div className="gap-3 flex flex-col">
                <div className="flex justify-between">
                  <Label>Outline Opacity</Label>
                  <span className="text-sm text-muted-foreground">
                    {config.outlineOpacity ?? 1}
                  </span>
                </div>
                <Slider
                  value={[config.outlineOpacity ?? 1]}
                  onValueChange={(val) => handleChange("outlineOpacity", val[0])}
                  min={0}
                  max={1}
                  step={0.01}
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-between">
            <Label>Center Dot</Label>
            <Switch
              checked={config.centerDot}
              onCheckedChange={(checked) => handleChange("centerDot", !!checked)}
            />
          </div>
          {config.centerDot && (
            <>
              <div className="gap-3 flex flex-col">
                <div className="flex justify-between">
                  <Label>Center Dot Size</Label>
                  <span className="text-sm text-muted-foreground">
                    {config.centerDotSize ?? Math.max(1, config.thickness / 2)}
                  </span>
                </div>
                <Slider
                  value={[config.centerDotSize ?? Math.max(1, config.thickness / 2)]}
                  onValueChange={(val) => handleChange("centerDotSize", val[0])}
                  min={1}
                  max={20}
                  step={1}
                />
              </div>

              <div>
                <Label>Center Dot Color</Label>
                <Input
                  type="color"
                  value={config.centerDotColor ?? config.color}
                  onChange={(e) => handleChange("centerDotColor", e.target.value)}
                  className="w-20 h-10 p-0 border-none cursor-pointer mt-1"
                />
              </div>

              <div className="gap-3 flex flex-col">
                <div className="flex justify-between">
                  <Label>Center Dot Opacity</Label>
                  <span className="text-sm text-muted-foreground">
                    {(config.centerDotOpacity ?? config.opacity).toFixed(2)}
                  </span>
                </div>
                <Slider
                  value={[config.centerDotOpacity ?? config.opacity]}
                  onValueChange={(val) => handleChange("centerDotOpacity", val[0])}
                  min={0}
                  max={1}
                  step={0.01}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Center Dot Shape</Label>
                <Select
                  value={config.centerDotShape ?? "circle"}
                  onValueChange={(v) => handleChange("centerDotShape", v as "circle" | "square")}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="circle">Circle</SelectItem>
                    <SelectItem value="square">Square</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex  gap-2 justify-center items-center">
        <Button onClick={handleImport} variant="outline" size="sm">
          Import
        </Button>
        <Button onClick={handleExport} variant="outline" size="sm">
          Export
        </Button>
        <Button onClick={save} size="sm">
          Apply to Current
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Save to Library</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Input
            placeholder="Give your crosshair a name"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
          />
          <Button onClick={saveToLibrary}>{editingExisting ? "Save as New" : "Save"}</Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default Editor
