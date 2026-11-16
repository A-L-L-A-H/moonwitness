export type AuthorizationAction = 'read' | 'create' | 'update' | 'delete' | 'manage';
export type RecordScope = 'all' | 'self' | 'none';
export type ResourceClass = 'BUSINESS' | 'SECURITY' | 'SYSTEM' | 'CONFIGURATION';

export interface AuthorizationPrincipal {
  readonly userId: string;
  readonly role: 'admin' | 'user';
  readonly apiKeyScopes?: readonly string[];
}

export interface AuthorizationDecision {
  readonly allowed: boolean;
  readonly scope: RecordScope;
  readonly reason: 'allowed' | 'unknown-resource' | 'forbidden' | 'scope-denied' | 'api-key-scope-denied';
}

interface ResourcePolicy {
  readonly classification: ResourceClass;
  readonly user: ReadonlySet<AuthorizationAction>;
  readonly userScope?: RecordScope;
  readonly admin: ReadonlySet<AuthorizationAction>;
  readonly adminScope?: RecordScope;
}

const actions = (...values: AuthorizationAction[]) => new Set(values);
const adminManage = actions('read', 'create', 'update', 'delete', 'manage');
const adminRead = actions('read');

/** Server-owned policy. Registry and UI metadata never grant access. */
export const resourcePolicies: Readonly<Record<string, ResourcePolicy>> = {
  flows: { classification: 'CONFIGURATION', user: actions('read', 'create', 'update', 'delete'), userScope: 'self', admin: adminManage, adminScope: 'all' },
  ai: { classification: 'BUSINESS', user: actions('create'), userScope: 'all', admin: adminManage, adminScope: 'all' },
  projects: { classification: 'BUSINESS', user: actions('read', 'create', 'update'), userScope: 'all', admin: adminManage, adminScope: 'all' },
  tasks: { classification: 'BUSINESS', user: actions('read', 'create', 'update'), userScope: 'all', admin: adminManage, adminScope: 'all' },
  resource_references: { classification: 'BUSINESS', user: actions('read', 'create', 'update'), userScope: 'all', admin: adminManage, adminScope: 'all' },
  research_cases: { classification: 'BUSINESS', user: actions('read', 'create', 'update'), userScope: 'all', admin: adminManage, adminScope: 'all' },
  review_items: { classification: 'BUSINESS', user: actions('read', 'create'), userScope: 'all', admin: adminManage, adminScope: 'all' },
  research_work_items: { classification: 'BUSINESS', user: actions('read', 'create'), userScope: 'all', admin: adminManage, adminScope: 'all' },
  annotations: { classification: 'BUSINESS', user: actions('read', 'create', 'update', 'delete'), userScope: 'all', admin: adminManage, adminScope: 'all' },
  users: { classification: 'SECURITY', user: actions('read', 'update'), userScope: 'self', admin: adminManage, adminScope: 'all' },
  organizations: { classification: 'CONFIGURATION', user: actions(), admin: adminManage, adminScope: 'all' },
  app_settings: { classification: 'CONFIGURATION', user: actions(), admin: adminManage, adminScope: 'all' },
  api_keys: { classification: 'SECURITY', user: actions(), admin: actions(), adminScope: 'none' },
  user_sessions: { classification: 'SECURITY', user: actions(), admin: actions(), adminScope: 'none' },
  system_logs: { classification: 'SYSTEM', user: actions(), admin: adminRead, adminScope: 'all' },
  calendars: { classification: 'BUSINESS', user: actions('read', 'create', 'update', 'delete'), userScope: 'self', admin: adminManage, adminScope: 'all' },
  calendar_events: { classification: 'BUSINESS', user: actions('read', 'create', 'update', 'delete'), userScope: 'self', admin: adminManage, adminScope: 'all' },
  chat_conversations: { classification: 'BUSINESS', user: actions('read', 'create', 'update'), userScope: 'self', admin: adminManage, adminScope: 'all' },
  chat_messages: { classification: 'BUSINESS', user: actions('read', 'create', 'update'), userScope: 'self', admin: adminManage, adminScope: 'all' },
  mails: { classification: 'BUSINESS', user: actions('read', 'create', 'update'), userScope: 'self', admin: adminManage, adminScope: 'all' },
  notifications: { classification: 'BUSINESS', user: actions('read'), userScope: 'self', admin: adminManage, adminScope: 'all' },
  faq_categories: { classification: 'CONFIGURATION', user: actions(), admin: adminManage, adminScope: 'all' },
  faqs: { classification: 'CONFIGURATION', user: actions(), admin: adminManage, adminScope: 'all' },
  landing_testimonials: { classification: 'CONFIGURATION', user: actions(), admin: adminManage, adminScope: 'all' },
  landing_leads: { classification: 'CONFIGURATION', user: actions(), admin: adminManage, adminScope: 'all' },
  landing_features: { classification: 'CONFIGURATION', user: actions(), admin: adminManage, adminScope: 'all' },
  pricing_plans: { classification: 'CONFIGURATION', user: actions(), admin: adminManage, adminScope: 'all' },
  pricing_features: { classification: 'CONFIGURATION', user: actions(), admin: adminManage, adminScope: 'all' },
  project_tasks: { classification: 'BUSINESS', user: actions(), admin: adminManage, adminScope: 'all' },
};

export const normalizeRole = (value: unknown): AuthorizationPrincipal['role'] | undefined => {
  return value === 'admin' || value === 'user' ? value : undefined;
};

export const scopeFor = (resource: string, action: AuthorizationAction) => `${resource}:${action}`;
export const isKnownScope = (scope: string) => scope === '*' || Object.keys(resourcePolicies).some(resource =>
  (['read', 'create', 'update', 'delete', 'manage'] as const).some(action => scope === scopeFor(resource, action))
);

export const scopesFor = (role: AuthorizationPrincipal['role']): readonly string[] => {
  const result: string[] = [];
  for (const [resource, policy] of Object.entries(resourcePolicies)) {
    const allowed = role === 'admin' ? policy.admin : policy.user;
    for (const action of allowed) result.push(scopeFor(resource, action));
  }
  return result;
};

export function authorize(principal: AuthorizationPrincipal | undefined, resource: string, action: AuthorizationAction, record?: Record<string, unknown>): AuthorizationDecision {
  if (!principal) return { allowed: false, scope: 'none', reason: 'forbidden' };
  const policy = resourcePolicies[resource];
  if (!policy) return { allowed: false, scope: 'none', reason: 'unknown-resource' };
  const allowed = principal.role === 'admin' ? policy.admin : policy.user;
  const scope = (principal.role === 'admin' ? policy.adminScope : policy.userScope) ?? 'none';
  if (!allowed.has(action)) return { allowed: false, scope, reason: 'forbidden' };
  if (principal.apiKeyScopes && !principal.apiKeyScopes.includes('*') && !principal.apiKeyScopes.includes(scopeFor(resource, action))) {
    return { allowed: false, scope, reason: 'api-key-scope-denied' };
  }
  const ownerId = resource === 'users' ? record?.id : (record?.userId ?? record?.createdBy ?? record?.senderId ?? record?.id);
  if (scope === 'self' && record && String(ownerId) !== principal.userId) return { allowed: false, scope, reason: 'scope-denied' };
  return { allowed: scope !== 'none', scope, reason: scope === 'none' ? 'forbidden' : 'allowed' };
}

export const isDiscoverable = (principal: AuthorizationPrincipal | undefined, resource: string) => {
  const decision = authorize(principal, resource, 'read');
  return decision.allowed && decision.scope === 'all';
};

export const protectedSelfFields = new Set(['id', 'role', 'isActive', 'passwordHash', 'orgId', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy']);
