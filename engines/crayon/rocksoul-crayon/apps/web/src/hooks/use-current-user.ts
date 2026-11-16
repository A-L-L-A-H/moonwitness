import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api-client'

export interface CurrentUser {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly avatar?: string | null
  readonly role?: string | null
  readonly status?: string | null
}

type UserState = { readonly status: 'loading' } | { readonly status: 'ready'; readonly user: CurrentUser } | { readonly status: 'anonymous' } | { readonly status: 'error' }

export function useCurrentUser() {
  const [state, setState] = useState<UserState>({ status: 'loading' })
  const refresh = useCallback(async () => {
    setState({ status: 'loading' })
    try {
      const result = await api.request<{ user: CurrentUser | null }>('/api/v1/auth/me')
      setState(result.user ? { status: 'ready', user: result.user } : { status: 'anonymous' })
    } catch (error) {
      setState(error instanceof Error && /authentication|unauthorized|invalid/i.test(error.message) ? { status: 'anonymous' } : { status: 'error' })
    }
  }, [])
  useEffect(() => { void refresh() }, [refresh])
  return { state, refresh }
}
