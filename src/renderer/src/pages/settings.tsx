import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'

function Settings() {
  const [rpcEnabled, setRpcEnabled] = useState<boolean>(true)

  useEffect(() => {
    const disabled = localStorage.getItem('discordRpcDisabled')
    setRpcEnabled(!(disabled === 'true'))
  }, [])

  const handleToggleRpc = async (checked: boolean) => {
    setRpcEnabled(checked)
    if (checked) {
      localStorage.removeItem('discordRpcDisabled')
      await window.electron.ipcRenderer.invoke('start-discord-rpc')
    } else {
      localStorage.setItem('discordRpcDisabled', 'true')
      await window.electron.ipcRenderer.invoke('stop-discord-rpc')
    }
  }

  const openLogs = async () => {
    await window.electron.ipcRenderer.invoke('app:open-logs')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Discord Rich Presence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label>Enable Discord RPC</Label>
            <Switch checked={rpcEnabled} onCheckedChange={(v) => handleToggleRpc(!!v)} />
          </div>
        </CardContent>
      </Card>

      {/* <Card>
        <CardHeader>
          <CardTitle>Logs</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Open the application logs folder.</p>
          </div>
          <Button variant="outline" onClick={openLogs}>
            Open Logs Folder
          </Button>
        </CardContent>
      </Card> */}
    </div>
  )
}

export default Settings
