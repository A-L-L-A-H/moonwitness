import type { FieldRendererProps } from '../metadata/registry.js';
import type { FieldDefinition, FieldOption } from '../metadata/contracts.js';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function FieldRenderer({
  value,
  onChange,
  definition,
  mode = 'view',
  className = '',
}: FieldRendererProps & { definition: FieldDefinition }) {
  // 1. View Mode (Display-only)
  if (mode === 'view') {
    if (value === null || value === undefined || value === '') {
      return <span className="text-muted-foreground text-xs italic">—</span>;
    }

    switch (definition.type) {
      case 'boolean':
      case 'switch':
        return (
          <Badge variant={value ? 'default' : 'secondary'}>
            {value ? 'Active' : 'Inactive'}
          </Badge>
        );

      case 'badge':
      case 'select': {
        const option = definition.options?.find((o: FieldOption) => String(o.value) === String(value));
        const label = option?.label || String(value);
        return (
          <Badge variant="outline" className="font-medium">
            {label}
          </Badge>
        );
      }

      case 'date':
      case 'datetime': {
        try {
          const formatted = new Date(String(value)).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
          return <span className="text-xs text-muted-foreground">{formatted}</span>;
        } catch {
          return <span>{String(value)}</span>;
        }
      }

      case 'code':
      case 'json':
        return (
          <pre className="text-xs font-mono bg-muted p-1 rounded max-w-[200px] truncate">
            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
          </pre>
        );

      default:
        return <span className={`text-sm ${className}`}>{String(value)}</span>;
    }
  }

  // 2. Edit Mode (Form controls)
  switch (definition.type) {
    case 'textarea':
    case 'markdown':
      return (
        <Textarea
          value={String(value ?? '')}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={definition.placeholder}
          disabled={definition.readOnly}
          className={className}
        />
      );

    case 'boolean':
    case 'switch':
      return (
        <Switch
          checked={Boolean(value)}
          onCheckedChange={(checked) => onChange?.(checked)}
          disabled={definition.readOnly}
        />
      );

    case 'select':
      return (
        <Select
          value={value ? String(value) : ''}
          onValueChange={(val) => onChange?.(val)}
          disabled={definition.readOnly}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={definition.placeholder || 'Select option...'} />
          </SelectTrigger>
          <SelectContent>
            {definition.options?.map((opt: FieldOption) => (
              <SelectItem key={String(opt.value)} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'number':
    case 'currency':
      return (
        <Input
          type="number"
          value={String(value ?? '')}
          onChange={(e) => onChange?.(Number(e.target.value))}
          placeholder={definition.placeholder}
          disabled={definition.readOnly}
          className={className}
        />
      );

    default:
      return (
        <Input
          type="text"
          value={String(value ?? '')}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={definition.placeholder}
          disabled={definition.readOnly}
          className={className}
        />
      );
  }
}
