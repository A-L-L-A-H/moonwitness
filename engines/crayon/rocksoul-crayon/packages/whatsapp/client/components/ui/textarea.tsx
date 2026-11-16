import * as React from 'react';
import { cn } from '../../lib/utils.js';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-[#374248] bg-[#111b21] px-3 py-2 text-sm text-[#e9edef] placeholder:text-[#8696a0] focus-visible:outline-none focus-visible:border-[#00a884] disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';
