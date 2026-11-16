import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BaseLayout } from '@/components/layouts/base-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api-client'
import { app } from '@/lib/app-client'

const severityClass: Record<string, string> = { info: 'border-sky-500/40', success: 'border-emerald-500/40', warning: 'border-amber-500/50', error: 'border-destructive/50' }

export default function NotificationSettings() {
  const [items, setItems] = useState<Awaited<ReturnType<typeof api.notifications.list>>['items']>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [mutating, setMutating] = useState(false)
  const [aepLive, setAepLive] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const [kindFilter, setKindFilter] = useState(() => typeof window === 'undefined' ? 'all' : localStorage.getItem('rocksoul:notifications:kind') ?? 'all')
  const [channel, setChannel] = useState<BroadcastChannel>()
  const loadRequest = useRef(0)
  const load = async () => { const requestId = ++loadRequest.current; setLoading(true); setError(undefined); try { const result = await api.notifications.list(); let pending: typeof result.items[number] | undefined; try { const raw = localStorage.getItem('rocksoul:notifications:pending'); if (raw) pending = JSON.parse(raw) as typeof pending } catch { pending = undefined } const reconciled = pending && result.items.some(item => item.kind === pending?.kind && item.title === pending?.title && item.message === pending?.message); if (reconciled) localStorage.removeItem('rocksoul:notifications:pending'); const next = pending && !reconciled && !result.items.some(item => item.id === pending?.id) ? [pending, ...result.items] : result.items; if (requestId === loadRequest.current) setItems(next) } catch { if (requestId === loadRequest.current) setError('Notifications are temporarily unavailable.') } finally { if (requestId === loadRequest.current) setLoading(false) } }
  useEffect(() => { void load(); let attempts = 0; const reconciliation = window.setInterval(() => { attempts += 1; if (attempts >= 6) window.clearInterval(reconciliation); else void load() }, 500); const onStorage = (event: StorageEvent) => { if (event.key === 'rocksoul:notifications:pending') void load() }; window.addEventListener('storage', onStorage); if (typeof BroadcastChannel === 'undefined') return () => { window.clearInterval(reconciliation); window.removeEventListener('storage', onStorage) }; const nextChannel = new BroadcastChannel('rocksoul:notifications'); setChannel(nextChannel); nextChannel.onmessage = event => { if (event.data?.type === 'changed') void load() }; return () => { window.clearInterval(reconciliation); window.removeEventListener('storage', onStorage); nextChannel.close(); setChannel(undefined) } }, [])
  useEffect(() => {
    try {
      const subscription = app.resources.for('notifications').watch('*', event => {
        if (event.eventType !== 'notification.created' || !event.payload || typeof event.payload !== 'object') return
        const payload = event.payload as { id?: string; kind?: string; title?: string; message?: string; href?: string | null; createdAt?: string }
        if (!payload.id || !payload.title || !payload.message) return
        const id = payload.id; const title = payload.title; const message = payload.message
        setItems(current => current.some(item => item.id === id) ? current : [{ id, kind: payload.kind ?? 'info', title, message, href: payload.href ?? null, readAt: null, createdAt: payload.createdAt ?? new Date().toISOString() }, ...current])
        channel?.postMessage({ type: 'changed', source: 'aep' })
        setAepLive(true)
        setAnnouncement(`New ${payload.kind ?? 'notification'}: ${title}`)
      })
      subscription.onError(() => setAepLive(false))
      return () => { void subscription.close() }
    } catch { setAepLive(false) }
  }, [channel])
  const announceChange = () => { channel?.postMessage({ type: 'changed' }); window.dispatchEvent(new Event('rocksoul:notifications-changed')) }
  useEffect(() => { localStorage.setItem('rocksoul:notifications:kind', kindFilter) }, [kindFilter])
  const visibleItems = useMemo(() => {
    const seen = new Set<string>()
    return items.filter(item => kindFilter === 'all' || item.kind === kindFilter).filter(item => {
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })
  }, [items, kindFilter])
  const grouped = useMemo(() => visibleItems.reduce<Record<string, typeof visibleItems>>((groups, item) => { (groups[item.kind] ??= []).push(item); return groups }, {}), [visibleItems])
  const kinds = useMemo(() => [...new Set(items.map(item => item.kind))].sort(), [items])
  const markRead = async (id: string) => {
    const previous = items
    const readAt = new Date().toISOString()
    setError(undefined)
    setItems(current => current.map(item => item.id === id ? { ...item, readAt } : item))
    setMutating(true)
    try { await api.notifications.markRead(id); setAnnouncement('Notification marked as read.'); announceChange() }
    catch { setItems(previous); setError('The notification could not be updated. Retry.') }
    finally { setMutating(false) }
  }
  const markAllRead = async () => {
    const previous = items
    const readAt = new Date().toISOString()
    setError(undefined)
    setItems(current => current.map(item => ({ ...item, readAt: item.readAt ?? readAt })))
    setMutating(true)
    try { const result = await api.notifications.markAllRead(); setItems(current => current.map(item => ({ ...item, readAt: item.readAt ?? result.readAt }))); setAnnouncement('All notifications marked as read.'); announceChange() }
    catch { setItems(previous); setError('All notifications could not be updated. Retry.') }
    finally { setMutating(false) }
  }
  return <BaseLayout title="Notifications" description="Persistent notification and activity feed."><div className="px-4 lg:px-6"><Card className="max-w-3xl"><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle>Activity</CardTitle><CardDescription>{aepLive ? 'Live AEP updates enabled.' : 'Unread state, timestamps, and deep links are stored by the backend.'}</CardDescription></div><div className="flex flex-wrap items-center gap-2">{items.some(item => !item.readAt) && <Button size="sm" className="min-h-10 sm:min-h-8" variant="outline" disabled={mutating} onClick={() => void markAllRead()}>Mark all read</Button>}<label className="sr-only" htmlFor="notification-kind">Filter notifications</label><select id="notification-kind" className="min-h-10 rounded-md border bg-background px-2 text-sm sm:min-h-9" value={kindFilter} onChange={event => setKindFilter(event.target.value)}><option value="all">All severities</option>{kinds.map(kind => <option key={kind} value={kind}>{kind}</option>)}</select></div></div></CardHeader><CardContent className="space-y-5" aria-busy={loading || mutating}><div role="status" aria-live="polite" className="sr-only">{announcement}</div>{loading ? <p className="text-sm text-muted-foreground">Loading notifications…</p> : error ? <div role="alert" className="space-y-2"><p className="text-sm text-destructive">{error}</p><Button size="sm" className="min-h-10 sm:min-h-8" variant="outline" onClick={() => void load()}>Retry</Button></div> : items.length === 0 ? <p className="text-sm text-muted-foreground">No notifications yet.</p> : visibleItems.length === 0 ? <p className="text-sm text-muted-foreground">No notifications match this filter.</p> : Object.entries(grouped).map(([kind, group]) => <section key={kind} aria-labelledby={`notification-group-${kind}`} className="space-y-2"><h2 id={`notification-group-${kind}`} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{kind}</h2>{group.map(item => <div key={item.id} className={`rounded-md border p-3 ${severityClass[item.kind] ?? 'border-border'} ${item.readAt ? 'opacity-70' : 'bg-muted/30'}`}><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{item.title}</p><p className="text-sm text-muted-foreground">{item.message}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</p></div>{!item.readAt && <Button size="sm" className="min-h-10 sm:min-h-8" variant="outline" disabled={mutating} onClick={() => void markRead(item.id)}>Mark read</Button>}</div>{item.href && <Button asChild size="sm" variant="link" className="min-h-10 px-0 sm:min-h-8"><Link to={item.href}>Open activity</Link></Button>}</div>)}</section>)}</CardContent></Card></div></BaseLayout>
}
