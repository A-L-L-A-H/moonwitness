import React from 'react'

export interface PageHeaderProps {
  title: string
  subtitle?: string
  badge?: string
  actions?: React.ReactNode
  tag?: string
}

export function PageHeader({ title, subtitle, badge, actions, tag }: PageHeaderProps) {
  return (
    <div className="relative mb-6 flex flex-col justify-between gap-4 border-b-2 border-black/80 pb-4 dark:border-white/80 md:flex-row md:items-end">
      <div>
        {tag && (
          <span className="mb-1 inline-block border border-black bg-[#D7FF00] px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest text-black uppercase dark:border-white">
            [{tag}]
          </span>
        )}
        <div className="flex items-center gap-3">
          <h1 className="font-mono text-3xl font-black tracking-tight text-neutral-900 uppercase dark:text-neutral-100 md:text-4xl">
            {title}
          </h1>
          {badge && (
            <span className="rounded-none border border-black bg-pink-500 px-2 py-0.5 font-mono text-xs font-bold text-white uppercase shadow-[2px_2px_0px_#000]">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-1 font-mono text-xs text-neutral-600 dark:text-neutral-400">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export interface MetricCardProps {
  label: string
  value: string | number
  change?: string
  positive?: boolean
  code?: string
}

export function MetricCard({ label, value, change, positive, code }: MetricCardProps) {
  return (
    <div className="relative border-2 border-black bg-[#FFFDF6] p-4 text-black shadow-[4px_4px_0px_#000] dark:border-white dark:bg-[#1A1B18] dark:text-white dark:shadow-[4px_4px_0px_#D7FF00]">
      {code && (
        <span className="absolute top-2 right-2 font-mono text-[9px] text-neutral-500">
          SYS::{code}
        </span>
      )}
      <div className="font-mono text-xs font-bold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
        {label}
      </div>
      <div className="mt-2 font-mono text-3xl font-black">{value}</div>
      {change && (
        <div className="mt-2 flex items-center gap-1 font-mono text-xs font-bold">
          <span className={positive ? 'text-emerald-500' : 'text-rose-500'}>
            {positive ? '▲' : '▼'} {change}
          </span>
          <span className="text-neutral-400">vs prev cycle</span>
        </div>
      )}
    </div>
  )
}

export interface PanelProps {
  title: string
  code?: string
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function Panel({ title, code, children, action, className = '' }: PanelProps) {
  return (
    <div className={`border-2 border-black bg-[#FFFDF6] shadow-[4px_4px_0px_#000] dark:border-white dark:bg-[#1A1B18] dark:shadow-[4px_4px_0px_#222] ${className}`}>
      <div className="flex items-center justify-between border-b-2 border-black bg-neutral-100 px-4 py-2 dark:border-white dark:bg-neutral-900">
        <div className="flex items-center gap-2">
          <span className="size-2.5 bg-black dark:bg-[#D7FF00]" />
          <span className="font-mono text-xs font-black tracking-wider uppercase">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {code && <span className="font-mono text-[10px] text-neutral-500">[{code}]</span>}
          {action}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

export interface StatusBadgeProps {
  status: 'ONLINE' | 'OFFLINE' | 'CRITICAL' | 'STANDBY' | 'SYNC'
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors: Record<string, string> = {
    ONLINE: 'bg-[#D7FF00] text-black border-black',
    OFFLINE: 'bg-neutral-600 text-white border-black',
    CRITICAL: 'bg-red-500 text-white border-black',
    STANDBY: 'bg-amber-400 text-black border-black',
    SYNC: 'bg-cyan-400 text-black border-black',
  }
  return (
    <span className={`inline-block border px-2 py-0.5 font-mono text-[10px] font-black uppercase ${colors[status] || 'bg-neutral-300'}`}>
      ● {status}
    </span>
  )
}

