import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api, ApiError } from '@/lib/api-client'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string>()
  const [complete, setComplete] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (password !== confirmation) return setError('Passwords do not match.')
    setSubmitting(true)
    setError(undefined)
    try {
      await api.auth.consumePasswordReset(token, password)
      api.setToken(null)
      setComplete(true)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Unable to reset your password.')
    } finally {
      setSubmitting(false)
    }
  }

  return <main className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10"><div className="flex w-full max-w-sm flex-col gap-6"><Link to="/" className="flex items-center gap-2 self-center font-medium"><div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-md"><Logo size={24} /></div>Rocksoul</Link><Card><CardHeader className="text-center"><CardTitle>{complete ? 'Password updated' : 'Choose a new password'}</CardTitle><CardDescription>{complete ? 'Your sessions were signed out. Sign in with your new password.' : 'Use at least 8 characters.'}</CardDescription></CardHeader><CardContent>{complete ? <Button className="w-full" onClick={() => navigate('/auth/sign-in', { replace: true })}>Back to sign in</Button> : <form className="grid gap-4" onSubmit={submit}><div className="grid gap-2"><Label htmlFor="reset-password">New password</Label><Input id="reset-password" type="password" minLength={8} maxLength={256} value={password} onChange={event => setPassword(event.target.value)} required autoComplete="new-password" /></div><div className="grid gap-2"><Label htmlFor="reset-confirmation">Confirm password</Label><Input id="reset-confirmation" type="password" minLength={8} maxLength={256} value={confirmation} onChange={event => setConfirmation(event.target.value)} required autoComplete="new-password" /></div>{!token && <p role="alert" className="text-sm text-destructive">This reset link is missing or invalid.</p>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button type="submit" className="w-full" disabled={submitting || !token}>{submitting ? 'Updating…' : 'Update password'}</Button><Button variant="outline" asChild className="w-full"><Link to="/auth/sign-in">Back to sign in</Link></Button></form>}</CardContent></Card></div></main>
}
