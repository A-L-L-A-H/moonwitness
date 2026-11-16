import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { BaseLayout } from '@/components/layouts/base-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { api, ApiError } from '@/lib/api-client'
import { app } from '@/lib/app-client'
import type { CurrentUser } from '@/hooks/use-current-user'

export default function UserSettingsPage() {
  const [user, setUser] = useState<CurrentUser & Record<string, unknown>>(); const [name, setName] = useState(''); const [bio, setBio] = useState(''); const [location, setLocation] = useState(''); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState<string>()
  useEffect(() => { void api.request<{ user: CurrentUser & Record<string, unknown> }>('/api/v1/auth/me').then(result => { if (result.user) { setUser(result.user); setName(result.user.name); setBio(String(result.user.bio ?? '')); setLocation(String(result.user.location ?? '')) } }).catch(caught => setError(caught instanceof ApiError ? caught.message : 'Unable to load profile')).finally(() => setLoading(false)) }, [])
  const save = async (event: React.FormEvent) => { event.preventDefault(); if (!user) return; setSaving(true); setError(undefined); try { const updated = await app.resources.for('users').update(user.id, { name, bio, location }); setUser({ ...user, ...updated }); toast.success('Profile updated') } catch (caught) { setError(caught instanceof ApiError ? caught.message : 'Unable to update profile') } finally { setSaving(false) } }
  return <BaseLayout title="Profile" description="Manage your authoritative account profile."><div className="max-w-2xl px-4 lg:px-6">{loading ? <p className="text-sm text-muted-foreground">Loading profile…</p> : error && !user ? <div role="alert" className="rounded-lg border border-destructive/40 p-4 text-sm text-destructive">{error}</div> : user ? <form className="grid gap-6" onSubmit={save}><Card><CardHeader><CardTitle>Identity</CardTitle><CardDescription>Role and status are controlled by the server.</CardDescription></CardHeader><CardContent className="grid gap-4"><Input value={name} onChange={event => setName(event.target.value)} required aria-label="Name" placeholder="Name" /><Input value={user.email} readOnly aria-label="Email" /><div className="grid grid-cols-2 gap-3"><Input value={user.role ?? 'user'} readOnly aria-label="Role" /><Input value={user.status ?? 'Active'} readOnly aria-label="Status" /></div></CardContent></Card><Card><CardHeader><CardTitle>Profile details</CardTitle></CardHeader><CardContent className="grid gap-4"><Input value={location} onChange={event => setLocation(event.target.value)} aria-label="Location" placeholder="Location" /><Textarea value={bio} onChange={event => setBio(event.target.value)} aria-label="Bio" placeholder="Short bio" /></CardContent></Card>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</Button></form> : null}</div></BaseLayout>
}
