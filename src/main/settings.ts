import { ipcMain, shell } from "electron"
import path from "path"
import os from "os"
import fs from "fs"

function openLogFolder(): { success: boolean; error?: string } {
  const logPath = path.join(
    process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"),
    "dotline",
    "logs"
  )
  if (fs.existsSync(logPath)) {
    shell.openPath(logPath)
    return { success: true }
  } else {
    console.warn("Dotline logs directory does not exist.")
    return { success: false, error: "Dotline directory does not exist." }
  }
}

ipcMain.handle("app:open-logs", openLogFolder)
