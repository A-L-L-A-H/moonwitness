"use client"
import * as React from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/logo'
import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { resolveIcon, useMetadataNavigation } from '@/metadata-runtime'
import { useCurrentUser } from '@/hooks/use-current-user'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { navigation, state } = useMetadataNavigation()
  const { state: userState } = useCurrentUser()
  return <Sidebar {...props}><SidebarHeader><SidebarMenu><SidebarMenuItem><SidebarMenuButton size="lg" asChild><Link to="/dashboard"><div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Logo size={24} className="text-current" /></div><div className="grid flex-1 text-left text-sm leading-tight"><span className="truncate font-medium">Rocksoul</span><span className="truncate text-xs">Application workspace</span></div></Link></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarHeader><SidebarContent>{state === 'MENU_LOADING' && <p className="px-3 text-xs text-muted-foreground">Loading navigation…</p>}{state === 'MENU_ERROR' && <p role="status" className="px-3 text-xs text-muted-foreground">Resource navigation is unavailable.</p>}{navigation.map(group => <NavMain key={group.label} label={group.label} items={group.items.map(item => ({ title: item.label, url: item.path, icon: resolveIcon(item.icon), items: item.children?.map(child => ({ title: child.label, url: child.path })) }))} />)}</SidebarContent><SidebarFooter>{userState.status === 'loading' ? <p className="px-3 text-xs text-muted-foreground">Loading account…</p> : <NavUser user={userState.status === 'ready' ? userState.user : undefined} />}</SidebarFooter></Sidebar>
}
