import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { app } from '@/lib/app-client'
import { normalizeMenu, type NavigationGroup } from './contracts'
import { allStaticNavigation } from './navigation'
import { MetadataRuntimeContext } from './MetadataRuntimeContext'

export function MetadataRuntimeProvider({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState<readonly NavigationGroup[]>([]); const [state, setState] = useState<'MENU_LOADING' | 'MENU_READY' | 'MENU_ERROR'>('MENU_LOADING')
  useEffect(() => { let live = true; app.resources.menu().then(raw => { const normalized = normalizeMenu(raw); if (!normalized.length) throw new Error('invalid menu'); if (live) { setMenu(normalized); setState('MENU_READY') } }).catch(() => { if (live) setState('MENU_ERROR') }); return () => { live = false } }, [])
  const value = useMemo(() => ({ navigation: [...menu, ...allStaticNavigation], state }), [menu, state])
  return <MetadataRuntimeContext.Provider value={value}>{children}</MetadataRuntimeContext.Provider>
}
