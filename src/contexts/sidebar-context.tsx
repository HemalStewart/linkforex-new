"use client"

import * as React from "react"

export interface SidebarConfig {
  variant: "sidebar" | "floating" | "inset"
  collapsible: "offcanvas" | "icon" | "none"
  side: "left" | "right"
}

export interface SidebarContextValue {
  config: SidebarConfig
  updateConfig: (config: Partial<SidebarConfig>) => void
}

export const SidebarContext = React.createContext<SidebarContextValue | null>(null)

export function SidebarConfigProvider({ children }: { children: React.ReactNode }) {
  const STORAGE_KEY = "linkforex-sidebar-config"
  const [config, setConfig] = React.useState<SidebarConfig>(() => {
    if (typeof window === "undefined") {
      return {
        variant: "inset",
        collapsible: "offcanvas",
        side: "left",
      }
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        return {
          variant: "inset",
          collapsible: "offcanvas",
          side: "left",
        }
      }

      const parsed = JSON.parse(raw)
      return {
        variant: parsed.variant || "inset",
        collapsible: parsed.collapsible || "offcanvas",
        side: parsed.side || "left",
      }
    } catch {
      return {
        variant: "inset",
        collapsible: "offcanvas",
        side: "left",
      }
    }
  })

  const updateConfig = React.useCallback((newConfig: Partial<SidebarConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }))
  }, [])

  React.useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  }, [config])

  return (
    <SidebarContext.Provider value={{ config, updateConfig }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebarConfig() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebarConfig must be used within a SidebarConfigProvider")
  }
  return context
}
