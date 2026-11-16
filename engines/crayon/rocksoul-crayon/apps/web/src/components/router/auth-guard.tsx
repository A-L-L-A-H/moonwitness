"use client"

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { api } from '@/lib/api-client'

export interface GuardProps {
  children?: React.ReactNode
}

/**
 * Checks whether the current client holds an active auth token.
 */
export function isAuthenticated(): boolean {
  return api.isAuthenticated()
}

/**
 * Route guard ensuring only authenticated users can access the route.
 * Redirects unauthenticated users to `/auth/sign-in` while preserving the intended
 * location in React Router navigation state (`location.state.from`).
 */
export function AuthGuard({ children }: GuardProps) {
  const location = useLocation()
  const authenticated = isAuthenticated()

  if (!authenticated) {
    return <Navigate to="/auth/sign-in" state={{ from: location }} replace />
  }

  return children ? <>{children}</> : <Outlet />
}

/**
 * Route guard ensuring already authenticated users are redirected away from guest-only
 * pages (such as `/auth/sign-in` and `/auth/sign-up`) to `/dashboard`.
 */
export function GuestGuard({ children }: GuardProps) {
  const authenticated = isAuthenticated()

  if (authenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return children ? <>{children}</> : <Outlet />
}

/**
 * Dynamic root redirect for `/`:
 * - Authenticated users -> `/dashboard`
 * - Unauthenticated users -> `/auth/sign-in`
 */
export function RootRedirect() {
  const authenticated = isAuthenticated()
  return <Navigate to={authenticated ? "/dashboard" : "/auth/sign-in"} replace />
}
