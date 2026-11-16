import { ArrowLeft, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ModelMetadata } from './contracts'

export function ResourceDetail({ metadata, record, onBack, onEdit }: { metadata: ModelMetadata; record: Record<string, unknown>; onBack: () => void; onEdit: () => void }) {
  const columns = metadata.ui?.table?.columns ?? []
  return <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-2"><Button variant="ghost" className="min-h-10" onClick={onBack}><ArrowLeft aria-hidden="true" className="mr-2 size-4" />Back to {metadata.ui?.pluralLabel}</Button><Button className="min-h-10" onClick={onEdit}><Pencil aria-hidden="true" className="mr-2 size-4" />Edit</Button></div><Card><CardHeader><CardTitle>{String(record[metadata.primaryKey] ?? metadata.ui?.label)}</CardTitle></CardHeader><CardContent><dl className="grid gap-4 sm:grid-cols-2">{columns.map(column => <div key={column.field} className="min-w-0"><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{column.label}</dt><dd className="mt-1 break-words text-sm">{formatDetail(record[column.field], column.renderType)}</dd></div>)}</dl></CardContent></Card></div>
}
function formatDetail(value: unknown, type?: string) { if (value === null || value === undefined || value === '') return '—'; if (type === 'boolean') return value ? 'Yes' : 'No'; if (type === 'date' || type === 'datetime') { const date = new Date(String(value)); return Number.isNaN(date.valueOf()) ? String(value) : date.toLocaleString() } if (type === 'currency') return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(value)); if (Array.isArray(value)) return value.join(', '); if (typeof value === 'object') return JSON.stringify(value); return String(value) }
