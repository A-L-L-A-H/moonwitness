import { useCallback, useEffect, useState } from 'react'
import { ArrowRight, FolderKanban, ListTodo, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BaseLayout } from '@/components/layouts/base-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { app } from '@/lib/app-client'
import { apiErrorMessage } from '@/lib/api-error-state'

type RecordItem = { id: string; name?: string; title?: string; status?: string; updatedAt?: string }
type DashboardState = { status: 'loading' } | { status: 'ready'; projects: readonly RecordItem[]; projectTotal: number; tasks: readonly RecordItem[]; taskTotal: number } | { status: 'error'; message: string }

export default function Page() {
  const [state, setState] = useState<DashboardState>({ status: 'loading' })
  const load = useCallback(async () => {
    setState({ status: 'loading' })
    try {
      const [projects, tasks] = await Promise.all([app.projects.list({ limit: 5 }), app.tasks.list({ limit: 5 })])
      setState({ status: 'ready', projects: projects.items, projectTotal: projects.total, tasks: tasks.items, taskTotal: tasks.total })
    } catch (error) { setState({ status: 'error', message: apiErrorMessage(error) }) }
  }, [])
  useEffect(() => { void load() }, [load])
  return <BaseLayout title="Dashboard" description="Live operational snapshot from authorized platform resources."><div className="space-y-6 px-4 lg:px-6">{state.status === 'loading' ? <p role="status" aria-live="polite" className="text-sm text-muted-foreground">Loading dashboard data…</p> : state.status === 'error' ? <Card role="alert"><CardHeader><CardTitle>Dashboard unavailable</CardTitle><CardDescription>{state.message}</CardDescription></CardHeader><CardContent><Button onClick={() => void load()}><RefreshCw aria-hidden="true" />Retry</Button></CardContent></Card> : <><section className="grid gap-4 sm:grid-cols-2"><Metric title="Projects" value={state.projectTotal} description="Authorized project records" icon={FolderKanban} link="/projects" /><Metric title="Tasks" value={state.taskTotal} description="Authorized task records" icon={ListTodo} link="/tasks" /></section><section className="grid gap-4 lg:grid-cols-2"><Recent title="Recent projects" records={state.projects} link="/projects" /><Recent title="Recent tasks" records={state.tasks} link="/tasks" /></section></>}</div></BaseLayout>
}
function Metric({ title, value, description, icon: Icon, link }: { title: string; value: number; description: string; icon: typeof FolderKanban; link: string }) { return <Card><CardHeader className="flex flex-row items-center justify-between space-y-0"><div><CardDescription>{title}</CardDescription><CardTitle className="mt-2 text-3xl">{value}</CardTitle></div><Icon aria-hidden="true" className="size-5 text-muted-foreground" /></CardHeader><CardContent><Link className="inline-flex items-center gap-1 text-sm text-primary hover:underline" to={link}>Open {title.toLowerCase()} <ArrowRight aria-hidden="true" className="size-3" /></Link><p className="mt-2 text-xs text-muted-foreground">{description}</p></CardContent></Card> }
function Recent({ title, records, link }: { title: string; records: readonly RecordItem[]; link: string }) { return <Card><CardHeader><CardTitle>{title}</CardTitle><CardDescription>Live records available to this session.</CardDescription></CardHeader><CardContent>{records.length ? <ul className="space-y-3">{records.map(record => <li key={record.id} className="flex items-center justify-between gap-3 border-b pb-3 last:border-0"><span className="min-w-0 truncate text-sm font-medium">{record.name ?? record.title ?? record.id}</span><span className="shrink-0 text-xs text-muted-foreground">{record.status ?? '—'}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">No records are available.</p>}<Button asChild className="mt-4 min-h-10" variant="outline" size="sm"><Link to={link}>View all <ArrowRight aria-hidden="true" /></Link></Button></CardContent></Card> }
