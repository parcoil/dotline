import { useState, useEffect } from 'react'
import { CrosshairConfig } from '../types/crosshair'
import { Label } from '../components/ui/label'
import { Checkbox } from '../components/ui/checkbox'
import { Input } from '../components/ui/input'
import { Slider } from '../components/ui/slider'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { defaultConfig } from '../types/crosshair'
import { Switch } from '@/components/ui/switch'

function Editor() {
  const [config, setConfig] = useState<CrosshairConfig>(defaultConfig)

  useEffect(() => {
    const savedRaw = localStorage.getItem('currentConfig')
    if (savedRaw) {
      try {
        const saved = JSON.parse(savedRaw) as CrosshairConfig
        setConfig(saved)
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
    <div className=" max-w-lg mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enabled</Label>
            <Checkbox
              checked={config.enabled}
              onCheckedChange={(checked) => handleChange('enabled', !!checked)}
            />
          </div>

          <div>
            <Label htmlFor="color-picker">Color</Label>
            <Input
              id="color-picker"
              type="color"
              value={config.color}
              onChange={(e) => handleChange('color', e.target.value)}
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
              onValueChange={(val) => handleChange('opacity', val[0])}
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
              onValueChange={(val) => handleChange('thickness', val[0])}
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
              onValueChange={(val) => handleChange('length', val[0])}
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
              onValueChange={(val) => handleChange('gap', val[0])}
              min={0}
              max={50}
              step={1}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Center Dot</Label>
            <Switch
              checked={config.centerDot}
              onCheckedChange={(checked) => handleChange('centerDot', !!checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={save} className="w-full h-11 text-lg">
        Save Crosshair
      </Button>
    </div>
  )
}

export default Editor
