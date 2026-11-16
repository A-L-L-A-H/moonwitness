import { createModelClient, type ModelQuery, type ModelTransport } from '@rocksoul/sdk'
import { api } from '@/lib/api-client'

const transport: ModelTransport = {
  request: (path, options = {}) => {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(options.query ?? {} as ModelQuery)) {
      if (value !== undefined && value !== null && value !== '') query.set(key, String(value))
    }
    const target = query.size ? `${path}?${query}` : path
    return api.request(target, options.method ? { method: options.method, body: options.body ? JSON.stringify(options.body) : undefined } : {})
  },
}

/** TRANSITIONAL TRANSPORT ADAPTER: the only resource metadata/CRUD entry point used by the UI runtime. */
export const modelClient = createModelClient(transport)
