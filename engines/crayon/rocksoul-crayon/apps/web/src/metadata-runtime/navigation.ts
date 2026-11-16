import type { NavigationGroup } from './contracts'

/** Implementation mappings only; model menu entries remain backend-authoritative. */
export const specializedNavigation: readonly NavigationGroup[] = [{ label: 'AI Workspaces', items: [
  { kind: 'SPECIALIZED_PAGE', name: 'ai-chat', label: 'AI Copilot', path: '/ai/chat', icon: 'Sparkles', order: 1 },
  { kind: 'SPECIALIZED_PAGE', name: 'ai-coding', label: 'Codex Workspace', path: '/ai/coding', icon: 'FileText', order: 2 },
  { kind: 'SPECIALIZED_PAGE', name: 'ai-browser', label: 'Browser Agent', path: '/ai/browser', icon: 'Box', order: 3 },
] }, { label: 'Applications', items: [
  { kind: 'SPECIALIZED_PAGE', name: 'chat', label: 'Chat', path: '/chat', icon: 'MessageCircle', order: 1 },
  { kind: 'SPECIALIZED_PAGE', name: 'calendar', label: 'Calendar', path: '/calendar', icon: 'Calendar', order: 2 },
  { kind: 'SPECIALIZED_PAGE', name: 'flows', label: 'Rocksoul Flow', path: '/flows', icon: 'Workflow', order: 3 },
  { kind: 'SPECIALIZED_PAGE', name: 'webhooks', label: 'Webhooks', path: '/webhooks', icon: 'Webhook', order: 4 },
] }]
export const systemNavigation: readonly NavigationGroup[] = [{ label: 'System', items: [
  { kind: 'SYSTEM_PAGE', name: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', order: 1 },
  { kind: 'SYSTEM_PAGE', name: 'settings', label: 'Settings', path: '/settings/user', icon: 'Settings', order: 2 },
] }]
export const allStaticNavigation = [...specializedNavigation, ...systemNavigation]
