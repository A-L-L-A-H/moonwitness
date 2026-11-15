// Moonwitness Layout System -- Flow
import React from 'react';
import { cn } from '../lib/utils';

interface FlowProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: number;
}

export function Flow({ gap = 4, className = '', style = {}, children, ...props }: FlowProps) {
  return React.createElement('div', { className: cn('flex flex-wrap', 'gap-' + gap, className), style, ...props }, children);
}
