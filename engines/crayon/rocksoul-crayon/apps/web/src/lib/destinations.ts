const specializedResourcePaths: Readonly<Record<string, string>> = { calendar_events: '/calendar' }

export function resourcePath(model: string): string {
  return specializedResourcePaths[model] ?? `/${model}`
}

export function resourceDetailPath(model: string, id: string): string {
  const base = resourcePath(model)
  return base === '/calendar' ? base : `${base}/${encodeURIComponent(id)}`
}
