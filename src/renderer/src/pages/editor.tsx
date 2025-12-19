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

const KEY_CODE_NAMES: Record<number, string> = {
  59: "F1", 60: "F2", 61: "F3", 62: "F4", 63: "F5", 64: "F6", 65: "F7", 66: "F8", 67: "F9", 68: "F10", 87: "F11", 88: "F12",
  2: "1", 3: "2", 4: "3", 5: "4", 6: "5", 7: "6", 8: "7", 9: "8", 10: "9", 11: "0",
  16: "Q", 17: "W", 18: "E", 19: "R", 20: "T", 21: "Y", 22: "U", 23: "I", 24: "O", 25: "P",
  30: "A", 31: "S", 32: "D", 33: "F", 34: "G", 35: "H", 36: "J", 37: "K", 38: "L",
  44: "Z", 45: "X", 46: "C", 47: "V", 48: "B", 49: "N", 50: "M",
  1: "Escape", 15: "Tab", 28: "Enter", 29: "LeftCtrl", 42: "LeftShift", 54: "RightShift", 56: "LeftAlt", 57: "Space", 58: "CapsLock",
  69: "NumLock", 70: "ScrollLock", 55: "Numpad*", 74: "Numpad-", 78: "Numpad+", 83: "NumpadPeriod",
  71: "Numpad7", 72: "Numpad8", 73: "Numpad9", 75: "Numpad4", 76: "Numpad5", 77: "Numpad6", 79: "Numpad1", 80: "Numpad2", 81: "Numpad3", 82: "Numpad0",
  98: "Up", 104: "PageUp", 99: "Right", 105: "PageDown", 100: "Left", 103: "End", 102: "Home", 101: "Down",
  110: "Insert", 111: "Delete",
  257: "Mouse1", 258: "Mouse2", 259: "Mouse3"
}

function getKeyName(keyCode: number | null): string {
  if (keyCode === null) return "Not set"
  return KEY_CODE_NAMES[keyCode] || `Key ${keyCode}`
}

function Editor() {
  const location = useLocation()
  type EditorNavState = { initialConfig?: CrosshairConfig; itemId?: string; itemName?: string }
  const state = (location.state ?? {}) as EditorNavState
  const navInitial = state.initialConfig
  const editingItemId = state.itemId
  const editingItemName = state.itemName
  const editingExisting = !!editingItemId
  const [config, setConfig] = useState<CrosshairConfig>(navInitial ?? defaultConfig)
  const [bindingKeybind, setBindingKeybind] = useState(false)
  const [saveName, setSaveName] = useState<string>("")

  useEffect(() => {
    const handleKeybindCaptured = (_: any, data: { keyCode: number }) => {
      const updated: CrosshairConfig = { ...config, toggleKeybind: data.keyCode }
      setConfig(updated)
      try {
        localStorage.setItem("currentConfig", JSON.stringify(updated))
        void window.electron.ipcRenderer.invoke("overlay:update-config", updated)
      } catch {}
      setBindingKeybind(false)
      toast.success(`Keybind set to ${getKeyName(data.keyCode)}`)
    }

    try {
      window.electron.ipcRenderer.on("keybind:captured", handleKeybindCaptured)
    } catch {}

    return () => {
      try {
        window.electron.ipcRenderer.removeListener("keybind:captured", handleKeybindCaptured)
      } catch {}
    }
  }, [])

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

  const handleStartBindKeybind = async (): Promise<void> => {
    setBindingKeybind(true)
    await window.electron.ipcRenderer.invoke("keybind:start-binding")
    toast.success("Press any key to bind it as the toggle hotkey...")
  }

  const handleClearKeybind = async (): Promise<void> => {
    handleChange("toggleKeybind", null)
    await window.electron.ipcRenderer.invoke("keybind:clear")
    toast.success("Keybind cleared")
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
    <div className="max-w-7xl mx-auto space-y-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 lg:sticky lg:top-4 lg:self-start">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <div
                  className="rounded-md border bg-white relative flex items-center justify-center"
                  style={{ width: 320, height: 320 }}
                >
                  <Crosshair mode="embed" config={scaleConfigForPreview(config, 300)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 flex gap-2 justify-center items-center">
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

          <Card className="mt-4">
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

        <div className="lg:col-span-7 space-y-4 overflow-y-auto max-h-screen pr-2">
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
                <SelectItem value="image">Image</SelectItem>
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

          <div className="flex items-center justify-between">
            <Label>Only On Click</Label>
            <Switch
              checked={config.onPress ?? false}
              onCheckedChange={(checked) => handleChange("onPress", !!checked)}
            />
          </div>

          {config.onPress && (
            <div className="gap-3 flex flex-col">
              <div className="flex justify-between">
                <Label>Wait Time After Release (ms)</Label>
                <span className="text-sm text-muted-foreground">{config.waitTime ?? 0}</span>
              </div>
              <Slider
                value={[config.waitTime ?? 0]}
                onValueChange={(val) => handleChange("waitTime", val[0])}
                min={0}
                max={3000}
                step={50}
              />
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <Label>Toggle Keybind</Label>
              <p className="text-sm text-muted-foreground mt-1">{getKeyName(config.toggleKeybind ?? null)}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={bindingKeybind ? "default" : "outline"}
                onClick={handleStartBindKeybind}
                disabled={bindingKeybind}
                size="sm"
              >
                {bindingKeybind ? "Listening..." : "Bind Key"}
              </Button>
              <Button
                variant="outline"
                onClick={handleClearKeybind}
                disabled={config.toggleKeybind === null}
                size="sm"
              >
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {config.style === "image" && (
        <Card>
          <CardHeader>
            <CardTitle>Image Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="image-url">Image URL</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="image-url"
                  type="text"
                  value={config.imageUrl ?? ""}
                  onChange={(e) => handleChange("imageUrl", e.target.value)}
                  placeholder="Enter image URL or upload"
                  className="flex-1"
                />
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const base64 = event.target?.result as string;
                        handleChange("imageUrl", base64);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("image-upload")?.click()}
                >
                  Upload
                </Button>
              </div>
            </div>
            <div className="gap-3 flex flex-col">
              <div className="flex justify-between">
                <Label>Image Size</Label>
                <span className="text-sm text-muted-foreground">{config.imageSize ?? 32}</span>
              </div>
              <Slider
                value={[config.imageSize ?? 32]}
                onValueChange={(val) => handleChange("imageSize", val[0])}
                min={8}
                max={128}
                step={1}
              />
            </div>
          </CardContent>
        </Card>
      )}

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

              <div className="flex items-center justify-between">
                <Label>Center Dot Outline</Label>
                <Switch
                  checked={!!config.centerDotOutline}
                  onCheckedChange={(checked) =>
                    setConfig((c) => {
                      const next = { ...c, centerDotOutline: !!checked }
                      if (checked) {
                        if (!next.centerDotOutlineColor) next.centerDotOutlineColor = "#000000"
                        if (next.centerDotOutlineThickness == null)
                          next.centerDotOutlineThickness = 1
                        if (next.centerDotOutlineOpacity == null) next.centerDotOutlineOpacity = 1
                      }
                      return next
                    })
                  }
                />
              </div>

              {config.centerDotOutline && (
                <>
                  <div>
                    <Label>Center Dot Outline Color</Label>
                    <Input
                      type="color"
                      value={config.centerDotOutlineColor ?? "#000000"}
                      onChange={(e) => handleChange("centerDotOutlineColor", e.target.value)}
                      className="w-20 h-10 p-0 border-none cursor-pointer mt-1"
                    />
                  </div>

                  <div className="gap-3 flex flex-col">
                    <div className="flex justify-between">
                      <Label>Center Dot Outline Thickness</Label>
                      <span className="text-sm text-muted-foreground">
                        {config.centerDotOutlineThickness ?? 1}
                      </span>
                    </div>
                    <Slider
                      value={[config.centerDotOutlineThickness ?? 1]}
                      onValueChange={(val) => handleChange("centerDotOutlineThickness", val[0])}
                      min={1}
                      max={10}
                      step={1}
                    />
                  </div>

                  <div className="gap-3 flex flex-col">
                    <div className="flex justify-between">
                      <Label>Center Dot Outline Opacity</Label>
                      <span className="text-sm text-muted-foreground">
                        {(config.centerDotOutlineOpacity ?? 1).toFixed(2)}
                      </span>
                    </div>
                    <Slider
                      value={[config.centerDotOutlineOpacity ?? 1]}
                      onValueChange={(val) => handleChange("centerDotOutlineOpacity", val[0])}
                      min={0}
                      max={1}
                      step={0.01}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

        </div>
      </div>
    </div>
  )
}

export default Editor
