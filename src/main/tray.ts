import { BrowserWindow, Menu, Notification, Tray, app } from 'electron'
import icon from '../../resources/icon.png?asset'

let tray: Tray | null = null
let hasNotifiedMinimized = false

export function createAppTray(options: {
  getMainWindow: () => BrowserWindow | null
  createMainWindow: () => void
}): Tray {
  if (tray) return tray

  // The icon import resolves to a file path via electron-vite
  const trayIcon = icon as unknown as string
  tray = new Tray(trayIcon)
  tray.setToolTip('Crosshair++')

  const openApp = () => {
    const win = options.getMainWindow()
    if (win) {
      if (win.isMinimized()) win.restore()
      win.show()
      win.focus()
    } else {
      options.createMainWindow()
    }
  }

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Crosshair++', click: openApp },
    { type: 'separator' },
    { label: 'Quit', click: () => process.nextTick(() => app.quit()) }
  ])
  tray.setContextMenu(contextMenu)

  tray.on('click', openApp)
  tray.on('double-click', openApp)

  return tray
}

export function notifyMinimizedToTrayOnce(): void {
  if (hasNotifiedMinimized) return
  hasNotifiedMinimized = true
  new Notification({
    title: 'Crosshair++',
    body: 'Still running in the tray. Click the tray icon to reopen.',
    silent: true
  }).show()
}
