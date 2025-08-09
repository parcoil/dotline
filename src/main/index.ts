import { app, shell, BrowserWindow, ipcMain, screen, dialog } from 'electron'
import type { SaveDialogOptions, OpenDialogOptions } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { createAppTray, notifyMinimizedToTrayOnce } from './tray'
import { promises as fs } from 'fs'

type CrosshairStyle = 'classic' | 'dot' | 'circle' | 'x'

type CrosshairConfig = {
  enabled: boolean
  style: CrosshairStyle
  color: string
  opacity: number
  thickness: number
  length: number
  gap: number
  centerDot: boolean
}

let settingsWindow: BrowserWindow | null = null
let overlayWindow: BrowserWindow | null = null

function createSettingsWindow(): void {
  settingsWindow = new BrowserWindow({
    width: 1200,
    height: 710,
    minWidth: 1200,
    minHeight: 710,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  settingsWindow.on('ready-to-show', () => {
    settingsWindow?.show()
  })

  // Intercept close to hide to tray instead of quitting
  settingsWindow.on('close', (e) => {
    // Hide to tray instead of closing the app
    e.preventDefault()
    settingsWindow?.hide()
    notifyMinimizedToTrayOnce()
  })

  settingsWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    settingsWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    settingsWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createOverlayWindow(): void {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize

  overlayWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    show: false,
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: false,
    skipTaskbar: true,
    focusable: false,
    fullscreen: false,
    alwaysOnTop: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  overlayWindow.setAlwaysOnTop(true, 'screen-saver')
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  overlayWindow.on('ready-to-show', () => {
    overlayWindow?.setIgnoreMouseEvents(true, { forward: true })
    overlayWindow?.showInactive()
  })

  overlayWindow.on('close', (e) => {
    e.preventDefault()
    overlayWindow?.hide()
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    overlayWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?overlay=1`)
  } else {
    overlayWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      query: { overlay: '1' }
    })
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createSettingsWindow()
  createOverlayWindow()

  // Create tray to manage reopening after window hidden
  createAppTray({
    getMainWindow: () => settingsWindow,
    createMainWindow: () => createSettingsWindow()
  })

  // Overlay will initialize itself from localStorage; we only forward updates via IPC

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createSettingsWindow()
      createOverlayWindow()
    }
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// Handle window control actions from the renderer (Titlebar)
ipcMain.on('window-control', (event, action: 'minimize' | 'maximize' | 'close') => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return

  switch (action) {
    case 'minimize':
      win.minimize()
      break
    case 'maximize':
      if (win.isMaximized()) {
        win.unmaximize()
      } else {
        win.maximize()
      }
      break
    case 'close':
      win.close()
      break
    default:
      break
  }
})

// Overlay controls
ipcMain.handle('overlay:show', () => {
  overlayWindow?.showInactive()
  return true
})

ipcMain.handle('overlay:hide', () => {
  overlayWindow?.hide()
  return true
})

ipcMain.handle('overlay:update-config', (_event, config: CrosshairConfig) => {
  // Forward to overlay
  overlayWindow?.webContents.send('overlay:config', config)
  return true
})

// Import/Export configuration handlers
ipcMain.handle('config:export', async (_event, config: CrosshairConfig) => {
  const options: SaveDialogOptions = {
    title: 'Export Crosshair Config',
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
    defaultPath: 'crosshair.json'
  }
  const result = settingsWindow
    ? await dialog.showSaveDialog(settingsWindow, options)
    : await dialog.showSaveDialog(options)
  if (result.canceled || !result.filePath) return false
  await fs.writeFile(result.filePath, JSON.stringify(config, null, 2), 'utf-8')
  return true
})

ipcMain.handle('config:import', async () => {
  const options: OpenDialogOptions = {
    title: 'Import Crosshair Config',
    properties: ['openFile'],
    filters: [{ name: 'JSON Files', extensions: ['json'] }]
  }
  const result = settingsWindow
    ? await dialog.showOpenDialog(settingsWindow, options)
    : await dialog.showOpenDialog(options)
  if (result.canceled || result.filePaths.length === 0) return null
  try {
    const raw = await fs.readFile(result.filePaths[0], 'utf-8')
    const parsed = JSON.parse(raw)
    // Basic validation with fallback for style
    if (typeof parsed !== 'object' || parsed === null) return null
    const allowedStyles: CrosshairStyle[] = ['classic', 'dot', 'circle', 'x']
    const style: CrosshairStyle = allowedStyles.includes((parsed as any).style)
      ? (parsed as any).style
      : 'classic'
    if (
      typeof (parsed as any).enabled !== 'boolean' ||
      typeof (parsed as any).color !== 'string' ||
      typeof (parsed as any).opacity !== 'number' ||
      typeof (parsed as any).thickness !== 'number' ||
      typeof (parsed as any).length !== 'number' ||
      typeof (parsed as any).gap !== 'number' ||
      typeof (parsed as any).centerDot !== 'boolean'
    ) {
      return null
    }
    const cfg: CrosshairConfig = {
      enabled: (parsed as any).enabled,
      style,
      color: (parsed as any).color,
      opacity: (parsed as any).opacity,
      thickness: (parsed as any).thickness,
      length: (parsed as any).length,
      gap: (parsed as any).gap,
      centerDot: (parsed as any).centerDot
    }
    return cfg
  } catch {
    return null
  }
})
