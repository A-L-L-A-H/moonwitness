import { ApiError } from '@/lib/api-client'

export type ApiErrorState = 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'INVALID' | 'UNAVAILABLE'
function errorCode(error: unknown): string | undefined {
  if (error instanceof ApiError) return error.code
  if (typeof error !== 'object' || error === null) return undefined
  const cause = (error as { cause?: unknown }).cause
  if (typeof cause === 'object' && cause !== null && typeof (cause as { code?: unknown }).code === 'string') return (cause as { code: string }).code
  return undefined
}
export function apiErrorState(error: unknown): ApiErrorState {
  if (errorCode(error) === 'CONFLICT') return 'CONFLICT'
  if (!(error instanceof ApiError)) return 'UNAVAILABLE'
  if (error.status === 401) return 'UNAUTHORIZED'
  if (error.status === 403) return 'FORBIDDEN'
  if (error.status === 404) return 'NOT_FOUND'
  if (error.status === 422 || error.status === 400) return 'INVALID'
  return 'UNAVAILABLE'
}
export function apiErrorMessage(error: unknown): string {
  switch (apiErrorState(error)) {
    case 'UNAUTHORIZED': return 'Your session has expired. Sign in to continue.'
    case 'FORBIDDEN': return 'You do not have access to this resource.'
    case 'NOT_FOUND': return 'This resource no longer exists or is unavailable.'
    case 'CONFLICT': return 'This record changed while you were editing. The latest server version has been reloaded; review your changes and save again.'
    case 'INVALID': return 'The server rejected this request. Review the supplied data.'
    default: return 'The service is unavailable. Check your connection and try again.'
  }
}
