import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BaseLayout } from '@/components/layouts/base-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription as ModalDescription, DialogFooter, DialogHeader, DialogTitle as ModalTitle } from '@/components/ui/dialog'
import { useCurrentUser } from '@/hooks/use-current-user'
import { api, ApiError } from '@/lib/api-client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Session = { id: string; ipAddress: string | null; userAgent: string | null; expiresAt: string; createdAt: string; isCurrent: boolean }

export default function AccountSettings() {
  const { state, refresh } = useCurrentUser()
  const [revoking, setRevoking] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [securityError, setSecurityError] = useState<string>()
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState<string>()
  const [changingPassword, setChangingPassword] = useState(false)
  const [revokingSession, setRevokingSession] = useState<string>()

  const loadSessions = async () => {
    try { setSessions(await api.auth.listSessions()) } catch { setSecurityError('Unable to load active sessions.') }
  }

  useEffect(() => { if (state.status === 'ready') void loadSessions() }, [state.status])

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault()
    setPasswordMessage(undefined)
    setSecurityError(undefined)
    if (newPassword !== confirmPassword) return setSecurityError('New passwords do not match.')
    setChangingPassword(true)
    try {
      await api.auth.changePassword(currentPassword, newPassword)
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      setPasswordMessage('Password changed. Other sessions were signed out.')
      await loadSessions()
    } catch (caught) {
      setSecurityError(caught instanceof ApiError ? caught.message : 'Unable to change password.')
    } finally { setChangingPassword(false) }
  }

  const revokeSession = async (session: Session) => {
    setRevokingSession(session.id); setSecurityError(undefined)
    try {
      await api.auth.revokeSession(session.id)
      if (session.isCurrent) { api.setToken(null); window.location.assign('/auth/sign-in') }
      else await loadSessions()
    }
    catch (caught) { setSecurityError(caught instanceof ApiError ? caught.message : 'Unable to revoke session.') }
    finally { setRevokingSession(undefined) }
  }

  const revokeAll = async () => {
    if (revoking) return
    setRevoking(true)
    setSecurityError(undefined)
    try {
      await api.request('/api/v1/auth/logout-all', { method: 'POST' })
      api.setToken(null)
      window.location.assign('/auth/sign-in')
    } catch {
      setSecurityError('Unable to revoke all sessions. Please retry.')
    } finally {
      setRevoking(false)
      setConfirmOpen(false)
    }
  }

  return <BaseLayout title="Account" description="Review your account and security surfaces.">
    <div className="grid max-w-2xl gap-6 px-4 lg:px-6">
      {state.status === 'loading' ? <p className="text-sm text-muted-foreground">Loading account…</p> : state.status === 'error' ? <Card><CardHeader><CardTitle>Account unavailable</CardTitle><CardDescription>We could not load the current account.</CardDescription></CardHeader><CardContent><Button variant="outline" onClick={() => void refresh()}>Retry</Button></CardContent></Card> : state.status === 'anonymous' ? <Card><CardHeader><CardTitle>Signed out</CardTitle><CardDescription>Sign in to manage your account.</CardDescription></CardHeader><CardContent><Button asChild><Link to="/auth/sign-in">Sign in</Link></Button></CardContent></Card> : <>
        <Card><CardHeader><CardTitle>{state.user.name}</CardTitle><CardDescription>{state.user.email}</CardDescription></CardHeader><CardContent className="grid gap-2 text-sm"><p>Role: <span className="font-medium">{state.user.role ?? 'user'}</span></p><p>Status: <span className="font-medium">{state.user.status ?? 'Active'}</span></p><Button className="mt-3 w-fit" asChild><Link to="/settings/user">Edit profile</Link></Button></CardContent></Card>
        <Card><CardHeader><CardTitle>Password</CardTitle><CardDescription>Change your password. Other active sessions will be revoked.</CardDescription></CardHeader><CardContent><form className="grid gap-4" onSubmit={changePassword}><div className="grid gap-2"><Label htmlFor="current-password">Current password</Label><Input id="current-password" type="password" minLength={1} value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} required autoComplete="current-password" /></div><div className="grid gap-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" minLength={8} maxLength={256} value={newPassword} onChange={event => setNewPassword(event.target.value)} required autoComplete="new-password" /></div><div className="grid gap-2"><Label htmlFor="confirm-password">Confirm new password</Label><Input id="confirm-password" type="password" minLength={8} maxLength={256} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required autoComplete="new-password" /></div>{passwordMessage && <p role="status" className="text-sm text-muted-foreground">{passwordMessage}</p>}<Button className="w-fit" disabled={changingPassword}>{changingPassword ? 'Changing…' : 'Change password'}</Button></form></CardContent></Card>
        <Card><CardHeader><CardTitle>Active sessions</CardTitle><CardDescription>Review where your account is signed in and revoke individual sessions.</CardDescription></CardHeader><CardContent className="grid gap-3">{sessions.length === 0 ? <p className="text-sm text-muted-foreground">No active sessions found.</p> : sessions.map(session => <div key={session.id} className="flex items-center justify-between gap-3 rounded-md border p-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{session.isCurrent ? 'This device' : session.userAgent || 'Unknown device'}</p><p className="text-xs text-muted-foreground">{session.ipAddress || 'Unknown IP'} · Expires {new Date(session.expiresAt).toLocaleString()}</p></div><Button variant={session.isCurrent ? 'outline' : 'destructive'} size="sm" onClick={() => void revokeSession(session)} disabled={revokingSession === session.id}>{revokingSession === session.id ? 'Revoking…' : session.isCurrent ? 'Sign out' : 'Revoke'}</Button></div>)}{securityError && <p role="alert" className="text-sm text-destructive">{securityError}</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>More security</CardTitle><CardDescription>Manage API keys or sign out everywhere.</CardDescription></CardHeader><CardContent className="flex flex-wrap gap-2"><Button variant="outline" asChild><Link to="/settings/api-keys">Manage API keys</Link></Button><Button variant="destructive" onClick={() => setConfirmOpen(true)} disabled={revoking}>{revoking ? 'Revoking sessions…' : 'Sign out all devices'}</Button></CardContent></Card>
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}><DialogContent><DialogHeader><ModalTitle>Sign out all devices?</ModalTitle><ModalDescription>This revokes every active session for your account, including this device.</ModalDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={revoking}>Cancel</Button><Button variant="destructive" onClick={() => void revokeAll()} disabled={revoking}>{revoking ? 'Revoking sessions…' : 'Sign out all devices'}</Button></DialogFooter></DialogContent></Dialog>
      </>}
    </div>
  </BaseLayout>
}
