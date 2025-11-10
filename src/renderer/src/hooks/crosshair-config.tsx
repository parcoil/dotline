import React, { createContext, useCallback, useContext, useEffect, useState } from "react"
import { CrosshairConfig, defaultConfig } from "../../../types/crosshair"

type CrosshairConfigContextValue = {
  config: CrosshairConfig
  setConfig: (config: CrosshairConfig) => void
  toggleEnabled: () => void
}

const CrosshairConfigContext = createContext<CrosshairConfigContextValue | undefined>(undefined)

export function CrosshairConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<CrosshairConfig>(defaultConfig)

  useEffect(() => {
    const savedRaw = localStorage.getItem("currentConfig")
    if (savedRaw) {
      try {
        const saved = JSON.parse(savedRaw) as Partial<CrosshairConfig>
        const merged = { ...defaultConfig, ...saved }
        setConfigState(merged)
      } catch {}
    }
  }, [])

  const setConfig = useCallback((newConfig: CrosshairConfig) => {
    setConfigState(newConfig)
    localStorage.setItem("currentConfig", JSON.stringify(newConfig))
    window.electron.ipcRenderer.invoke("overlay:update-config", newConfig).catch(() => {})
  }, [])

  const toggleEnabled = useCallback(() => {
    setConfigState((c) => {
      const newConfig = { ...c, enabled: !c.enabled }
      localStorage.setItem("currentConfig", JSON.stringify(newConfig))
      window.electron.ipcRenderer.invoke("overlay:update-config", newConfig).catch(() => {})
      if (newConfig.enabled) {
        window.electron.ipcRenderer.invoke("overlay:show").catch(() => {})
      }
      return newConfig
    })
  }, [])

  useEffect(() => {
    const listener = () => {
      toggleEnabled()
    }
    window.electron.ipcRenderer.on("toggle-crosshair", listener)
    return () => {
      window.electron.ipcRenderer.removeListener("toggle-crosshair", listener)
    }
  }, [toggleEnabled])

  const value = React.useMemo<CrosshairConfigContextValue>(
    () => ({ config, setConfig, toggleEnabled }),
    [config, setConfig, toggleEnabled]
  )

  return <CrosshairConfigContext.Provider value={value}>{children}</CrosshairConfigContext.Provider>
}

export function useCrosshairConfig(): CrosshairConfigContextValue {
  const ctx = useContext(CrosshairConfigContext)
  if (!ctx) throw new Error("useCrosshairConfig must be used within CrosshairConfigProvider")
  return ctx
}
