"use client"

import { CircleUser, LogIn, LogOut, Settings } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api-client'
import type { CurrentUser } from '@/hooks/use-current-user'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'

export function NavUser({ user }: { user?: CurrentUser }) {
  const { isMobile } = useSidebar()
  const navigate = useNavigate()
  const signOut = async () => {
    try { await api.request('/api/v1/auth/logout', { method: 'POST' }) } catch { /* local token removal is still required after a failed logout */ }
    api.setToken(null)
    navigate('/auth/sign-in')
  }
  if (!user) return <SidebarMenu><SidebarMenuItem><SidebarMenuButton asChild size="lg"><Link to="/auth/sign-in"><LogIn /><span>Sign in</span></Link></SidebarMenuButton></SidebarMenuItem></SidebarMenu>
  const initials = user.name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase()
  return <SidebarMenu><SidebarMenuItem><DropdownMenu><DropdownMenuTrigger asChild><SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"><div className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">{user.avatar || initials}</div><div className="grid flex-1 text-left text-sm leading-tight"><span className="truncate font-medium">{user.name}</span><span className="truncate text-xs text-muted-foreground">{user.email}</span></div></SidebarMenuButton></DropdownMenuTrigger><DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg" side={isMobile ? 'bottom' : 'right'} align="end" sideOffset={4}><DropdownMenuLabel className="font-normal"><p className="truncate font-medium">{user.name}</p><p className="truncate text-xs text-muted-foreground">{user.role ?? 'user'} · {user.status ?? 'Active'}</p></DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuGroup><DropdownMenuItem asChild><Link to="/settings/account"><CircleUser />Profile</Link></DropdownMenuItem><DropdownMenuItem asChild><Link to="/settings/appearance"><Settings />Preferences</Link></DropdownMenuItem></DropdownMenuGroup><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => void signOut()}><LogOut />Log out</DropdownMenuItem></DropdownMenuContent></DropdownMenu></SidebarMenuItem></SidebarMenu>
}
