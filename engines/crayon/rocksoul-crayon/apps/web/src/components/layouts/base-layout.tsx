import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ApplicationShell, type AppNotification, type AppResource } from '@rocksoul/ui'
import { useLocation } from 'react-router-dom'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useMetadataNavigation } from '@/metadata-runtime'
import { api } from '@/lib/api-client'

interface BaseLayoutProps { children: ReactNode; title?: string; description?: string }

const groupFor = (label: string): AppResource['group'] => /system/i.test(label) ? 'System' : /settings|account/i.test(label) ? 'Account' : /workspace|ai/i.test(label) ? 'Workspace' : 'Resource'
const notificationVariant = (kind: string): AppNotification['variant'] => kind === 'review' ? 'review' : kind === 'reply' ? 'reply' : kind === 'case-update' ? 'case-update' : 'system'

/** Maps Crayon routes and SDK-backed state onto the public @rocksoul/ui shell. */
export function BaseLayout({ children, title, description }: BaseLayoutProps) {
  const location = useLocation()
  const { navigation } = useMetadataNavigation()
  const { state: userState } = useCurrentUser()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const resources = useMemo<AppResource[]>(() => navigation.flatMap((group) => group.items.map((item) => ({ id: item.name, label: item.label, href: item.path, group: groupFor(group.label), description: `${item.label} application resource.`, requiredPermission: 'authenticated' }))), [navigation])

  useEffect(() => {
    let active = true
    void api.notifications.list(1).then((result) => { if (active) setNotifications(result.items.map((item) => ({ id: item.id, title: item.title, body: item.message, state: item.readAt ? 'read' : 'unread', variant: notificationVariant(item.kind) }))) }).catch(() => { if (active) setNotifications([]) })
    return () => { active = false }
  }, [])

  const activeResource = resources.find((resource) => location.pathname === resource.href || location.pathname.startsWith(`${resource.href}/`))?.id ?? 'dashboard'
  const user = userState.status === 'ready' ? { name: userState.user.name, role: userState.user.role ?? 'user' } : { name: 'Guest', role: 'anonymous' }
  return <ApplicationShell activeResource={activeResource} breadcrumbs={[{ label: 'Rocksoul', href: '/dashboard' }, ...(title ? [{ label: title }] : [])]} user={user} permissions={['authenticated']} resources={resources} notifications={notifications}>
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      {title && <div className="px-4 lg:px-6"><h1 className="text-2xl font-bold tracking-tight">{title}</h1>{description && <p className="mt-2 text-muted-foreground">{description}</p>}</div>}
      {children}
    </div>
  </ApplicationShell>
}
