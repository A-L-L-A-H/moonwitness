export type ToolPolicy = 'ALLOW' | 'DENY' | 'ASK_USER';

export interface SecurityPolicyConfig {
  filesystem: ToolPolicy;
  terminal: ToolPolicy;
  network: ToolPolicy;
  browser: ToolPolicy;
  gitDestructive: ToolPolicy;
  mcp: ToolPolicy;
}

export const DEFAULT_SECURITY_POLICY: SecurityPolicyConfig = {
  filesystem: 'DENY',
  terminal: 'DENY',
  network: 'DENY',
  browser: 'DENY',
  gitDestructive: 'DENY',
  mcp: 'DENY',
};
