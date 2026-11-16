import { useState, useMemo } from 'react';
import type { ResourceDefinition } from '../metadata/contracts.js';
import { FieldRenderer } from './FieldRenderer.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

export interface TableRendererProps<T extends Record<string, unknown> = Record<string, unknown>> {
  resource: ResourceDefinition;
  viewKey?: string;
  data: T[];
  loading?: boolean;
  onRefresh?: () => void;
  onRowClick?: (record: T) => void;
  onAiAction?: (actionId: string, record?: T) => void;
}

export function TableRenderer<T extends Record<string, unknown>>({
  resource,
  viewKey = 'list',
  data,
  loading = false,
  onRefresh,
  onRowClick,
  onAiAction,
}: TableRendererProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const view = resource.views[viewKey] || resource.views['list'] || Object.values(resource.views)[0];
  const fieldDefs = useMemo(() => {
    return view.fields
      .map((fieldName) => resource.fields.find((f) => f.name === fieldName))
      .filter(Boolean) as typeof resource.fields;
  }, [resource, view]);

  // Client-side search filtering
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((item) =>
      Object.values(item).some((val) =>
        String(val).toLowerCase().includes(term)
      )
    );
  }, [data, searchTerm]);

  // Client-side pagination
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  return (
    <div className="space-y-4" aria-busy={loading}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search aria-hidden="true" className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            aria-label={`Search ${resource.pluralLabel}`}
            placeholder={`Search ${resource.pluralLabel.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {onRefresh && (
            <Button variant="outline" size="sm" className="min-h-10 sm:min-h-8" onClick={onRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}

          {/* AI Quick Actions */}
          {resource.aiCapabilities && resource.aiCapabilities.length > 0 && onAiAction && (
            <Button
              variant="secondary"
              size="sm"
              className="min-h-10 bg-primary/10 text-primary hover:bg-primary/20 sm:min-h-8"
              onClick={() => onAiAction('analyze_all')}
            >
              <Sparkles className="h-4 w-4 mr-1 text-primary" />
              AI Insights
            </Button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <caption className="sr-only">{resource.pluralLabel} records</caption>
          <TableHeader>
            <TableRow>
              {fieldDefs.map((field) => (
                <TableHead key={field.name} style={{ width: field.width }}>
                  {field.label}
                </TableHead>
              ))}
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={fieldDefs.length + 1} className="h-24 text-center" role="status" aria-live="polite">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Loading {resource.pluralLabel.toLowerCase()}...
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={fieldDefs.length + 1} className="h-24 text-center text-muted-foreground">
                  No {resource.pluralLabel.toLowerCase()} found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, idx) => (
                <TableRow
                  key={String(row[resource.primaryKey] ?? idx)}
                  className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? 'button' : undefined}
                  aria-label={onRowClick ? `Open ${resource.label} ${String(row[resource.primaryKey] ?? idx)}` : undefined}
                  onClick={() => onRowClick?.(row)}
                  onKeyDown={(event) => { if (onRowClick && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onRowClick(row) } }}
                >
                  {fieldDefs.map((field) => (
                    <TableCell key={field.name}>
                      <FieldRenderer
                        value={row[field.name]}
                        definition={field}
                        mode="view"
                      />
                    </TableCell>
                  ))}
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {onAiAction && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-10 text-primary hover:bg-primary/10 sm:size-8"
                          aria-label={`AI analyze ${String(row[resource.primaryKey] ?? idx)}`}
                          title="AI Analyze"
                          onClick={() => onAiAction('analyze_row', row)}
                        >
                          <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-2 text-xs text-muted-foreground">
        <div>
          Showing {paginatedData.length > 0 ? (page - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(page * pageSize, filteredData.length)} of {filteredData.length} entries
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="size-10 sm:size-8"
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
          </Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="size-10 sm:size-8"
            aria-label="Next page"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
