"use client"

import * as React from "react"
import { SidebarContext, type SidebarConfig } from "./sidebar-context-value"

export function SidebarConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = React.useState<SidebarConfig>({ variant: "inset", collapsible: "icon", side: "left" })
  const updateConfig = React.useCallback((newConfig: Partial<SidebarConfig>) => { setConfig(prev => ({ ...prev, ...newConfig })) }, [])
  return <SidebarContext.Provider value={{ config, updateConfig }}>{children}</SidebarContext.Provider>
}
