import { useEffect, useRef, useState } from 'react'
import { ResourcePage } from '@/metadata-runtime'
import { api } from '@/lib/api-client'

export default function OrganizationsPage() {
  const [contexts, setContexts] = useState<Awaited<ReturnType<typeof api.organizations.contexts>>>([])
  const [selectedContextId, setSelectedContextId] = useState<string>(() => typeof window === 'undefined' ? '' : sessionStorage.getItem('rocksoul:selected-organization') ?? '')
  const [switchError, setSwitchError] = useState<string>()
  const selectedContextRef = useRef(selectedContextId)

  useEffect(() => {
    let live = true
    void api.organizations.contexts().then(value => {
      if (!live) return
      setContexts(value)
      setSelectedContextId(current => {
        const selected = selectedContextRef.current || current
        const next = selected && value.some(item => String(item.id) === selected) ? selected : String(value.find(item => item.current)?.id ?? '')
        selectedContextRef.current = next
        return next
      })
    }).catch(() => { if (live) setContexts([]) })
    return () => { live = false }
  }, [])

  const switchContext = async (id: string) => {
    selectedContextRef.current = id
    setSelectedContextId(id)
    sessionStorage.setItem('rocksoul:selected-organization', id)
    setContexts(current => current.map(item => ({ ...item, current: String(item.id) === id ? 1 : 0 })))
    try { await api.organizations.switchContext(id); setSwitchError(undefined) }
    catch { setSwitchError('Organization context could not be persisted. Retry to synchronize the session.') }
  }

  return <>
    <div className="relative z-20 mx-4 mt-4 rounded-lg border bg-background p-4 md:mx-6">
      <h2 className="font-semibold">Organization context</h2>
      <p className="mt-1 text-sm text-muted-foreground">Switch only between organizations where your session has membership.</p>
      {switchError && <p role="alert" className="mt-2 text-sm text-destructive">{switchError}</p>}
      {contexts.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No memberships available.</p> : <div className="mt-3 flex flex-wrap gap-2">
        {contexts.map(context => {
          const contextId = String(context.id)
          const selected = selectedContextId === contextId
          return <button key={contextId} type="button" aria-pressed={selected} className={`relative z-30 rounded-md border px-3 py-2 text-sm ${selected ? 'border-primary bg-primary/10' : ''}`} onClick={() => void switchContext(contextId)}>{context.name} · {context.role}</button>
        })}
      </div>}
    </div>
    <ResourcePage model="organizations" />
  </>
}
