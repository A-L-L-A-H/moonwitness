import { createContext, useContext } from 'react'
import { allStaticNavigation } from './navigation'
import type { NavigationGroup } from './contracts'

export interface MetadataRuntimeValue { readonly navigation: readonly NavigationGroup[]; readonly state: 'MENU_LOADING' | 'MENU_READY' | 'MENU_ERROR' }
export const MetadataRuntimeContext = createContext<MetadataRuntimeValue>({ navigation: allStaticNavigation, state: 'MENU_LOADING' })
export const useMetadataNavigation = () => useContext(MetadataRuntimeContext)
