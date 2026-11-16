import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BaseLayout } from '@/components/layouts/base-layout'
import { apiErrorMessage } from '@/lib/api-error-state'
import { app } from '@/lib/app-client'
import { normalizeMetadata, type ModelMetadata } from '@/metadata-runtime/contracts'
import { MetadataForm } from '@/metadata-runtime/MetadataForm'
import { CalendarSurface } from './CalendarSurface'
import { normalizeEvent, type CalendarEvent, type CalendarView } from './contracts'

const calendarAdapter = { model: 'calendar_events', titleField: 'title', dateField: 'date', timeField: 'time', durationField: 'duration' } as const

export function CalendarPage() {
  const [url, setUrl] = useSearchParams(); const [metadata, setMetadata] = useState<ModelMetadata>(); const [events, setEvents] = useState<readonly CalendarEvent[]>([]); const [selected, setSelected] = useState<CalendarEvent>(); const [mode, setMode] = useState<'create' | 'edit'>(); const [error, setError] = useState<string>(); const [loading, setLoading] = useState(true); const [submitting, setSubmitting] = useState(false)
  const loadRequest = useRef(0)
  const submittingRef = useRef(false)
  const requestedView = url.get('view'); const view: CalendarView = requestedView === 'week' || requestedView === 'day' || requestedView === 'agenda' ? requestedView : 'month'; const anchor = useMemo(() => { const value = url.get('date'); const date = value ? new Date(`${value}T00:00:00`) : new Date(); return Number.isNaN(date.valueOf()) ? new Date() : date }, [url]); const adapter = calendarAdapter
  const resource = useMemo(() => app.resources.for(adapter.model), [adapter.model])
  const load = useCallback(async () => { const requestId = ++loadRequest.current; setLoading(true); setError(undefined); try { const next = normalizeMetadata(await resource.metadata()); if (!next) throw new Error('Invalid calendar metadata'); const result = await resource.list({ limit: 100, search: url.get('search') || undefined }); if (requestId !== loadRequest.current) return; setMetadata(next); setEvents(result.items.map(record => normalizeEvent(next, adapter, record)).filter((event): event is CalendarEvent => Boolean(event))) } catch (caught) { if (requestId === loadRequest.current) setError(apiErrorMessage(caught)) } finally { if (requestId === loadRequest.current) setLoading(false) } }, [adapter, resource, url])
  useEffect(() => { void load() }, [load])
  useEffect(() => {
    try {
      const subscription = resource.watch('*', event => {
        if (!event.eventType.startsWith('resource.')) return
        void load()
      })
      return () => { void subscription.close() }
    } catch { return undefined }
  }, [load, resource])
  const updateUrl = (updates: Record<string, string>) => { const next = new URLSearchParams(url); Object.entries(updates).forEach(([key, value]) => next.set(key, value)); setUrl(next) }
  const save = async (value: Record<string, unknown>) => { if (submittingRef.current) return; submittingRef.current = true; const editing = mode === 'edit' && Boolean(selected); const previousEvents = events; if (editing && selected && metadata) { const optimistic = normalizeEvent(metadata, adapter, { ...selected.record, ...value, id: selected.id }); if (optimistic) setEvents(current => current.map(event => event.id === selected.id ? optimistic : event)) } setSubmitting(true); try { const saved = await (editing && selected ? resource.update(selected.id, value) : resource.create(value)); if (!editing && metadata) { const savedRecord = (saved ?? {}) as Record<string, unknown>; const optimistic = normalizeEvent(metadata, adapter, { ...value, ...savedRecord, id: savedRecord.id ?? `optimistic-${Date.now()}` }); if (optimistic) setEvents(current => [optimistic, ...current.filter(event => event.id !== optimistic.id)]) } setMode(undefined); if (editing) setSelected(undefined); toast.success(editing ? 'Event updated' : 'Event created'); if (editing) void load().catch(() => undefined) } catch (caught) { if (editing) setEvents(previousEvents); toast.error(apiErrorMessage(caught)) } finally { submittingRef.current = false; setSubmitting(false) } }
  const remove = async () => { if (!selected || submittingRef.current) return; submittingRef.current = true; setSubmitting(true); try { await resource.delete(selected.id); setSelected(undefined); toast.success('Event deleted'); await load() } catch (caught) { toast.error(apiErrorMessage(caught)) } finally { submittingRef.current = false; setSubmitting(false) } }
  const title = metadata?.ui?.pluralLabel ?? 'Calendar'; const visible = events.filter(event => !url.get('search') || event.title.toLowerCase().includes(url.get('search')!.toLowerCase()))
  return <BaseLayout title={title} description={metadata?.description ?? 'Live calendar events from the authorized event resource.'}><div className="space-y-4 px-4 md:px-6">{error ? <div className="rounded-lg border border-destructive/40 p-6" role="alert"><p>{error}</p><Button className="mt-3" variant="outline" onClick={() => void load()}>Retry</Button></div> : <><CalendarSurface view={view} anchor={anchor} events={visible} loading={loading} onView={next => updateUrl({ view: next })} onNavigate={date => updateUrl({ date: format(date, 'yyyy-MM-dd') })} onSelect={setSelected} onCreate={() => { setSelected(undefined); setMode('create') }} /><input className="min-h-10 rounded-md border px-3 text-sm sm:min-h-9" value={url.get('search') ?? ''} onChange={event => updateUrl({ search: event.target.value })} placeholder="Search events" aria-label="Search events" /></>}<Dialog open={Boolean(mode)} onOpenChange={open => !open && setMode(undefined)}><DialogContent><DialogHeader><DialogTitle>{mode === 'create' ? 'Create event' : 'Edit event'}</DialogTitle><DialogDescription>Event validation and persistence are handled by the resource API.</DialogDescription></DialogHeader>{metadata && <MetadataForm metadata={metadata} initialValue={mode === 'edit' ? selected?.record : undefined} submitting={submitting} serverError={error} onSubmit={save} onCancel={() => setMode(undefined)} />}</DialogContent></Dialog><Dialog open={Boolean(selected) && !mode} onOpenChange={open => !open && setSelected(undefined)}><DialogContent><DialogHeader><DialogTitle>{selected?.title}</DialogTitle><DialogDescription>{selected && `${selected.start.toLocaleString()} – ${selected.end.toLocaleTimeString()}`}</DialogDescription></DialogHeader><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setMode('edit')}>Edit</Button><Button variant="destructive" disabled={submitting} onClick={() => void remove()}>Delete</Button></div></DialogContent></Dialog></div></BaseLayout>
}
