import { useMemo } from 'react';
import type { ResourceDefinition, FieldOption } from '../metadata/contracts.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export interface KanbanRendererProps<T extends Record<string, unknown> = Record<string, unknown>> {
  resource: ResourceDefinition;
  data: T[];
  groupByField?: string;
  onCardClick?: (record: T) => void;
  onAiAction?: (actionId: string, record: T) => void;
}

export function KanbanRenderer<T extends Record<string, unknown>>({
  resource,
  data,
  groupByField = 'status',
  onCardClick,
  onAiAction,
}: KanbanRendererProps<T>) {
  const groupFieldDef = resource.fields.find((f) => f.name === groupByField);

  // Group columns from options or default statuses
  const columns: FieldOption[] = useMemo(() => {
    if (groupFieldDef?.options && groupFieldDef.options.length > 0) {
      return groupFieldDef.options;
    }
    return [
      { label: 'Pending', value: 'pending' },
      { label: 'In Progress', value: 'in progress' },
      { label: 'Completed', value: 'completed' },
    ];
  }, [groupFieldDef]);

  // Group records by column value
  const groupedData = useMemo(() => {
    const map = new Map<string, T[]>();
    columns.forEach((col) => map.set(String(col.value), []));

    data.forEach((item) => {
      const val = String(item[groupByField] || 'pending').toLowerCase();
      const existing = map.get(val);
      if (existing) {
        existing.push(item);
      } else {
        map.set(val, [item]);
      }
    });

    return map;
  }, [data, columns, groupByField]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start overflow-x-auto pb-4">
      {columns.map((col) => {
        const items = groupedData.get(String(col.value)) || [];

        return (
          <div
            key={String(col.value)}
            className="flex flex-col bg-muted/40 rounded-lg p-3 border min-w-[260px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{col.label}</span>
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  {items.length}
                </Badge>
              </div>
            </div>

            {/* Cards List */}
            <div className="flex flex-col gap-2.5 min-h-[150px]">
              {items.length === 0 ? (
                <div className="flex items-center justify-center h-24 border border-dashed rounded-md text-xs text-muted-foreground">
                  No {resource.pluralLabel.toLowerCase()}
                </div>
              ) : (
                items.map((item, idx) => (
                  <Card
                    key={String(item[resource.primaryKey] ?? idx)}
                    className="cursor-pointer hover:shadow-md transition-shadow bg-card"
                    onClick={() => onCardClick?.(item)}
                  >
                    <CardHeader className="p-3 pb-1">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm font-medium leading-snug line-clamp-2">
                          {String(item[resource.titleField] ?? item.title ?? item.name ?? 'Untitled')}
                        </CardTitle>
                        {item.priority != null && (
                          <Badge
                            variant={item.priority === 'critical' ? 'destructive' : 'outline'}
                            className="text-[10px] uppercase font-mono px-1 py-0 shrink-0"
                          >
                            {String(item.priority)}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-2">
                      {item.description != null && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {String(item.description)}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t text-[11px] text-muted-foreground">
                        <span>{String(item.assigneeId ?? item.ownerId ?? 'Unassigned')}</span>
                        {onAiAction && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-primary hover:bg-primary/10"
                            title="AI Plan"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAiAction('plan_task', item);
                            }}
                          >
                            <Sparkles className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
