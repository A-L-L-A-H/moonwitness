import { Link, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api, ApiError } from '@/lib/api-client'
import { useState } from 'react'

export function ForgotPasswordForm1({ className, ...props }: React.ComponentProps<'div'>) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string>()
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(undefined)
    try {
      const result = await api.auth.requestPasswordReset(email)
      setSent(true)
      if (result.resetToken) navigate(`/auth/reset-password?token=${encodeURIComponent(result.resetToken)}`)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Unable to request a password reset.')
    } finally {
      setSubmitting(false)
    }
  }

  return <div className={cn('flex flex-col gap-6', className)} {...props}><Card><CardHeader className="text-center"><CardTitle>Reset your password</CardTitle><CardDescription>Enter your email. If an account exists, reset instructions will be sent.</CardDescription></CardHeader><CardContent><form className="grid gap-4" onSubmit={submit}><div className="grid gap-2"><Label htmlFor="reset-email">Email</Label><Input id="reset-email" type="email" value={email} onChange={event => setEmail(event.target.value)} required maxLength={320} autoComplete="email" /></div>{sent && <p role="status" className="text-sm text-muted-foreground">If the account exists, check your email for reset instructions.</p>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button type="submit" className="w-full" disabled={submitting}>{submitting ? 'Requesting…' : 'Request reset link'}</Button><Button variant="outline" asChild className="w-full"><Link to="/auth/sign-in">Back to sign in</Link></Button></form></CardContent></Card></div>
}
