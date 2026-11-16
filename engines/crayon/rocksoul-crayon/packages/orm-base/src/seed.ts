import { hashPassword, hashApiKey } from './helpers/crypto.js';

export interface BaseSeedContext {
  now?: string;
  defaultPassword?: string;
}

export const initialUsersData = [
  { id: 1, name: "Sarah Johnson", email: "sarah.johnson@example.com", avatar: "SJ", role: "Admin", plan: "Enterprise", billing: "UPI", status: "Active", joinedDate: "2024-01-15", lastLogin: "2024-08-12" },
  { id: 2, name: "Michael Chen", email: "michael.chen@example.com", avatar: "MC", role: "Editor", plan: "Professional", billing: "Auto Debit", status: "Active", joinedDate: "2024-02-20", lastLogin: "2024-08-13" },
  { id: 3, name: "Emily Rodriguez", email: "emily.rodriguez@example.com", avatar: "ER", role: "Author", plan: "Basic", billing: "Paypal", status: "Pending", joinedDate: "2024-03-10", lastLogin: "2024-08-10" },
  { id: 4, name: "David Thompson", email: "david.thompson@example.com", avatar: "DT", role: "Maintainer", plan: "Enterprise", billing: "Auto Debit", status: "Active", joinedDate: "2024-01-25", lastLogin: "2024-08-13" },
  { id: 5, name: "Jessica Parker", email: "jessica.parker@example.com", avatar: "JP", role: "Subscriber", plan: "Basic", billing: "UPI", status: "Inactive", joinedDate: "2024-04-05", lastLogin: "2024-07-20" },
  { id: 6, name: "James Wilson", email: "james.wilson@example.com", avatar: "JW", role: "Editor", plan: "Professional", billing: "Auto Debit", status: "Active", joinedDate: "2024-02-15", lastLogin: "2024-08-11" },
  { id: 7, name: "Sophia Martinez", email: "sophia.martinez@example.com", avatar: "SM", role: "Author", plan: "Basic", billing: "Paypal", status: "Active", joinedDate: "2024-03-01", lastLogin: "2024-08-09" },
  { id: 8, name: "Daniel Taylor", email: "daniel.taylor@example.com", avatar: "DT", role: "Subscriber", plan: "Basic", billing: "UPI", status: "Pending", joinedDate: "2024-04-12", lastLogin: "2024-07-28" },
  { id: 9, name: "Olivia Anderson", email: "olivia.anderson@example.com", avatar: "OA", role: "Admin", plan: "Enterprise", billing: "Auto Debit", status: "Active", joinedDate: "2024-01-10", lastLogin: "2024-08-13" },
  { id: 10, name: "Alexander Thomas", email: "alexander.thomas@example.com", avatar: "AT", role: "Editor", plan: "Professional", billing: "Paypal", status: "Active", joinedDate: "2024-02-28", lastLogin: "2024-08-12" },
  { id: 11, name: "Emma Jackson", email: "emma.jackson@example.com", avatar: "EJ", role: "Maintainer", plan: "Enterprise", billing: "UPI", status: "Active", joinedDate: "2024-01-18", lastLogin: "2024-08-14" },
  { id: 12, name: "William White", email: "william.white@example.com", avatar: "WW", role: "Subscriber", plan: "Basic", billing: "Auto Debit", status: "Inactive", joinedDate: "2024-04-22", lastLogin: "2024-07-15" }
];

export async function seedBase(
  client: { execute: (query: { sql: string; args?: any[] } | string) => Promise<any> },
  context?: BaseSeedContext
): Promise<void> {
  const now = context?.now || new Date().toISOString();
  const defaultPasswordHash = await hashPassword(context?.defaultPassword || 'Password123!');

  console.log('🏢 [orm-base] Seeding Organizations...');
  await client.execute({
    sql: `
      INSERT OR IGNORE INTO organizations (id, name, code, currency, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, 1, ?, ?)
    `,
    args: ['org_rocksoul_default', 'Rocksoul Technologies Inc.', 'ROCKSOUl', 'USD', now, now],
  });

  console.log('👥 [orm-base] Seeding Users with rich profile data...');
  for (const u of initialUsersData) {
    await client.execute({
      sql: `
        INSERT OR REPLACE INTO users (
          id, org_id, name, email, password_hash, avatar, role, plan, billing, status, joined_date, last_login_at, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      `,
      args: [
        String(u.id),
        'org_rocksoul_default',
        u.name,
        u.email,
        defaultPasswordHash,
        u.avatar || '',
        u.role === 'Admin' ? 'admin' : 'user',
        u.plan || 'Basic',
        u.billing || 'Credit Card',
        u.status || 'Active',
        u.joinedDate || '2024-01-01',
        u.lastLogin || now,
        now,
        now,
      ],
    });
    await client.execute({
      sql: `
        INSERT OR IGNORE INTO organization_members (id, organization_id, user_id, role, created_at)
        VALUES (?, ?, ?, ?, ?)
      `,
      args: [`mem_seed_${u.id}`, 'org_rocksoul_default', String(u.id), u.role === 'Admin' ? 'owner' : 'member', now],
    });
  }

  console.log('⚙️ [orm-base] Seeding Application Settings...');
  const defaultSettings = [
    { id: 'set_appearance', userId: '1', orgId: 'org_rocksoul_default', category: 'appearance', key: 'theme_preferences', value: JSON.stringify({ theme: 'dark', fontFamily: 'Inter', fontSize: '14', sidebarWidth: 'default' }), isPublic: 1 },
    { id: 'set_notifications', userId: '1', orgId: 'org_rocksoul_default', category: 'notifications', key: 'notification_rules', value: JSON.stringify({ emailAlerts: true, pushNotifications: true, weeklyDigest: false }), isPublic: 0 },
    { id: 'set_billing', userId: '1', orgId: 'org_rocksoul_default', category: 'billing', key: 'company_billing', value: JSON.stringify({ currency: 'USD', autoRenew: true, invoiceEmail: 'billing@example.com' }), isPublic: 0 },
    { id: 'set_account', userId: '1', orgId: 'org_rocksoul_default', category: 'account', key: 'user_profile', value: JSON.stringify({ timezone: 'UTC+7', language: 'en', twoFactorEnabled: false }), isPublic: 0 },
  ];

  for (const s of defaultSettings) {
    await client.execute({
      sql: `
        INSERT OR REPLACE INTO app_settings (id, user_id, org_id, category, key, value, is_public, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [s.id, s.userId, s.orgId, s.category, s.key, s.value, s.isPublic, now, now],
    });
  }

  const developmentApiKey = process.env.ROCKSOUL_DEV_API_KEY;
  if (developmentApiKey) {
    console.log('🔑 [orm-base] Seeding explicitly configured development API key.');
    await client.execute({
      sql: `
        INSERT OR REPLACE INTO api_keys (
          id, name, key_prefix, key_hash, user_id, org_id, scopes, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      `,
      args: [
        'key_dev_configured',
        'Configured Development API Key',
        developmentApiKey.slice(0, 8),
        hashApiKey(developmentApiKey),
        '1',
        'org_rocksoul_default',
        JSON.stringify(['*']),
        now,
        now,
      ],
    });
  } else {
    console.log('🔑 [orm-base] No development API key configured; skipping credential seed.');
  }
}
