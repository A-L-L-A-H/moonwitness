"use client"

import * as React from 'react'
import { Bell, ChevronRight, Home } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { CommandSearch, SearchTrigger } from '@/components/command-search'
import { ModeToggle } from '@/components/mode-toggle'
import { BackendStatusBadge } from '@/components/backend-status-badge'
import { api } from '@/lib/api-client'
import { app } from '@/lib/app-client'

const labels: Record<string, string> = { dashboard: 'Dashboard', projects: 'Projects', users: 'Users', tasks: 'Tasks', chat: 'Chat', calendar: 'Calendar', ai: 'AI workspace', settings: 'Settings', account: 'Account', appearance: 'Appearance', billing: 'Billing', notifications: 'Notifications', connections: 'Connections', 'api-keys': 'API Keys' }

export function SiteHeader() {
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [unreadNotifications, setUnreadNotifications] = React.useState(0)
  const location = useLocation()
  const crumbs = location.pathname.split('/').filter(Boolean).map(segment => labels[segment] ?? segment)
  React.useEffect(() => {
    const down = (event: KeyboardEvent) => { if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) { event.preventDefault(); setSearchOpen(open => !open) } }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])
  React.useEffect(() => {
    let cancelled = false
    const refresh = () => { void api.notifications.list(1).then((result) => { if (!cancelled) setUnreadNotifications(result.unread) }).catch(() => { if (!cancelled) setUnreadNotifications(0) }) }
    refresh()
    const timer = window.setInterval(refresh, 30_000)
    const channel = typeof BroadcastChannel === 'undefined' ? undefined : new BroadcastChannel('rocksoul:notifications')
    if (channel) channel.onmessage = event => { if (event.data?.type === 'changed') refresh() }
    const onStorage = (event: StorageEvent) => { if (event.key === 'rocksoul:notifications:pending') refresh() }
    const onLocalNotificationChange = () => refresh()
    window.addEventListener('storage', onStorage)
    window.addEventListener('rocksoul:notifications-changed', onLocalNotificationChange)
    let subscription: { close: () => Promise<void> } | undefined
    const seenEventIds = new Set<string>()
    try {
      subscription = app.resources.for('notifications').watch('*', event => {
        if (event.eventType !== 'notification.created' || !event.payload || typeof event.payload !== 'object') return
        const payload = event.payload as { id?: string; kind?: string; title?: string; message?: string; readAt?: string | null }
        if (payload.id && !payload.readAt && !seenEventIds.has(payload.id) && !cancelled) { seenEventIds.add(payload.id); refresh() }
      })
    } catch { subscription = undefined }
    return () => { cancelled = true; window.clearInterval(timer); window.removeEventListener('storage', onStorage); window.removeEventListener('rocksoul:notifications-changed', onLocalNotificationChange); channel?.close(); if (subscription) void subscription.close() }
  }, [])
  return <><header className="flex h-(--header-height) shrink-0 items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"><div className="flex w-full items-center gap-2 px-4 lg:px-6"><SidebarTrigger className="-ml-1" /><Separator orientation="vertical" className="h-4" /><nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1 text-sm md:flex"><Link to="/dashboard" className="rounded p-1 text-muted-foreground hover:text-foreground"><Home className="size-4" aria-hidden="true" /><span className="sr-only">Dashboard</span></Link>{crumbs.map((crumb, index) => <React.Fragment key={`${crumb}-${index}`}><ChevronRight className="size-3 text-muted-foreground" aria-hidden="true" /><span className={index === crumbs.length - 1 ? 'truncate font-medium text-foreground' : 'truncate text-muted-foreground'}>{crumb}</span></React.Fragment>)}</nav><div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-1 sm:flex-none"><div className="block min-w-0 flex-1 sm:flex-none"><SearchTrigger onClick={() => setSearchOpen(true)} /></div><BackendStatusBadge /><Button asChild variant="ghost" size="icon" aria-label={unreadNotifications > 0 ? `${unreadNotifications} unread notifications` : 'Notifications'} className="relative"><Link to="/settings/notifications"><Bell className="size-4" aria-hidden="true" />{unreadNotifications > 0 && <span aria-hidden="true" className="absolute right-1 top-1 size-2 rounded-full bg-destructive" />}</Link></Button><ModeToggle variant="ghost" /></div></div></header><CommandSearch open={searchOpen} onOpenChange={setSearchOpen} /></>
}
