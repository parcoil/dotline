import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { CrosshairConfig } from "@/types/crosshair"
import { defaultConfig } from "@/types/crosshair"
import { Crosshair } from "@/components/crosshair"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

type DisplayInfo = {
  id: number
  label: string
  bounds: { x: number; y: number; width: number; height: number }
  scaleFactor: number
}

function Positioning(): React.ReactElement {
  const [config, setConfig] = useState<CrosshairConfig>(() => {
    const raw = localStorage.getItem("currentConfig")
    if (!raw) return defaultConfig
    try {
      return { ...defaultConfig, ...JSON.parse(raw) }
    } catch {
      return defaultConfig
    }
  })

  const [displays, setDisplays] = useState<DisplayInfo[]>([])

  useEffect((): void => {
    ;(async () => {
      const list = (await window.electron.ipcRenderer.invoke(
        "overlay:list-displays"
      )) as DisplayInfo[]
      setDisplays(list)
      const currentId = (await window.electron.ipcRenderer.invoke("overlay:get-display")) as
        | number
        | null
      if (currentId) {
        setConfig((c) => ({ ...c, overlayDisplayId: currentId }))
      }
    })()
  }, [])

  const handleChange = <K extends keyof CrosshairConfig>(
    key: K,
    value: CrosshairConfig[K]
  ): void => {
    setConfig((c) => ({ ...c, [key]: value }))
  }

  const saveAndApply = async (): Promise<void> => {
    localStorage.setItem("currentConfig", JSON.stringify(config))
    await window.electron.ipcRenderer.invoke("overlay:update-config", config)
    if (config.overlayDisplayId) {
      await window.electron.ipcRenderer.invoke("overlay:set-display", config.overlayDisplayId)
    }
  }

  const currentDisplay = useMemo(() => {
    if (!config.overlayDisplayId || displays.length === 0) return undefined
    return displays.find((d) => d.id === config.overlayDisplayId)
  }, [config.overlayDisplayId, displays])

  const previewConfig = useMemo(() => {
    return {
      ...config,
      enabled: true
    }
  }, [config])

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Positioning</h1>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => setConfig(defaultConfig)}>
            Reset
          </Button>
          <Button onClick={saveAndApply}>Apply</Button>
        </div>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Display</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Label>Target Display</Label>
            <Select
              value={config.overlayDisplayId ? String(config.overlayDisplayId) : undefined}
              onValueChange={async (v) => {
                const id = Number(v)
                handleChange("overlayDisplayId", id)
                await window.electron.ipcRenderer.invoke("overlay:set-display", id)
              }}
            >
              <SelectTrigger className="w-60">
                <SelectValue placeholder="Select a display" />
              </SelectTrigger>
              <SelectContent>
                {displays.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {currentDisplay && (
            <p className="text-sm text-muted-foreground">
              Bounds: {currentDisplay.bounds.width}×{currentDisplay.bounds.height} @ x
              {currentDisplay.scaleFactor}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Position</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="offsetX">Offset X (px)</Label>
              <Input
                id="offsetX"
                type="number"
                value={config.offsetX ?? 0}
                onChange={(e) => handleChange("offsetX", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="offsetY">Offset Y (px)</Label>
              <Input
                id="offsetY"
                type="number"
                value={config.offsetY ?? 0}
                onChange={(e) => handleChange("offsetY", Number(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Overlay Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="rounded-md border bg-background relative flex items-center justify-center overflow-hidden"
            style={{ width: 320, height: 240 }}
          >
            <Crosshair mode="embed" config={previewConfig} />
            <div className="absolute inset-0 grid place-items-center">
              <div className="w-2 h-2 rounded-full bg-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-center">
        <Button variant="outline" onClick={() => setConfig(defaultConfig)}>
          Reset
        </Button>
        <Button onClick={saveAndApply}>Apply</Button>
      </div>
    </div>
  )
}

export default Positioning
