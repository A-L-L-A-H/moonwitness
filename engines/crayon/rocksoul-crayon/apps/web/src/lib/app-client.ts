import { ApplicationRuntime, WebSocketTransport, createAepResourceAdapter, createAppClient } from '@rocksoul/sdk'
import { modelClient } from '@/lib/model-client'

const apiUrl = import.meta.env.VITE_API_URL || (['localhost', '127.0.0.1'].includes(window.location.hostname) ? 'http://localhost:3000' : window.location.origin)
const wsUrl = `${apiUrl.replace(/^http/, 'ws')}/aep`
let runtime: ApplicationRuntime | undefined
let runtimeToken: string | null = null
const getRuntime = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  if (!token) {
    runtime = undefined
    runtimeToken = null
    return undefined
  }
  if (runtime && runtimeToken === token) return runtime
  runtimeToken = token
  const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value))
  const hasText = (value: unknown) => typeof value === 'string' && value.trim().length > 0
  runtime = new ApplicationRuntime({
    transport: new WebSocketTransport({ url: `${wsUrl}?access_token=${encodeURIComponent(token)}` }),
    reconnect: { enabled: true },
    capabilities: [
      // These are the only capabilities the browser may attempt through AEP.
      // The server still performs the authoritative validation and authorization.
      { id: 'ai.chat', supported: true, validateInput: input => isRecord(input) && hasText(input.prompt) },
      { id: 'mail.send', supported: true, mutation: true, validateInput: input => isRecord(input) && hasText(input.to) && hasText(input.text) },
      { id: 'chat.send', supported: true, mutation: true, validateInput: input => isRecord(input) && hasText(input.conversationId) && hasText(input.content) },
      { id: 'notifications.watch', supported: true, validateInput: input => isRecord(input) && (input.cursor === undefined || hasText(input.cursor)) },
      ...['list', 'get', 'create', 'update', 'delete', 'validate', 'publish', 'run', 'cancel', 'executions'].map(operation => ({ id: `flow.${operation}`, supported: true, mutation: ['create', 'update', 'delete', 'publish', 'run', 'cancel'].includes(operation) })),
      { id: 'flow.nodes.list', supported: true },
      ...['endpoint.list', 'endpoint.create', 'endpoint.delete', 'subscription.create'].map(operation => ({ id: `webhooks.${operation}`, supported: true, mutation: !operation.endsWith('.list') })),
      ...['projects', 'tasks'].flatMap(resource => ['list', 'get', 'watch', 'create', 'update', 'delete'].map(operation => ({ id: `${resource}.${operation}`, supported: true, mutation: ['create', 'update', 'delete'].includes(operation) }))),
    ],
  })
  return runtime
}

/** Application Fabric entry point for UI feature code. */
export const app = createAppClient({ models: modelClient, runtimeProvider: getRuntime, nativeResourcesProvider: (): Record<string, ReturnType<typeof createAepResourceAdapter>> => {
  const runtime = getRuntime()
  return runtime ? { projects: createAepResourceAdapter(runtime, 'projects'), tasks: createAepResourceAdapter(runtime, 'tasks'), notifications: createAepResourceAdapter(runtime, 'notifications') } : {}
} })
