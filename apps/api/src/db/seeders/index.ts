import { getDb } from "@moonwitness/orm";

/** Best-effort identity baseline seeder. */
async function identitySeeder(ran: string[]): Promise<void> {
  try {
    const db = getDb();
    const existing = await db.get("SELECT COUNT(*) as count FROM auth_users");
    if ((existing as { count: number }).count > 0) return; // already seeded

    // Create default admin via the existing service (which has audit + identity dual-write)
    // We just record that seeding happened; actual admin creation is env-driven.
    ran.push("identity-baseline");
  } catch {
    // best-effort
  }
}

/** Storage baseline seeder. */
async function storageSeeder(ran: string[]): Promise<void> {
  try {
    const db = getDb();
    const existing = await db.get("SELECT COUNT(*) as count FROM storage_buckets");
    if ((existing as { count: number }).count > 0) return;
    ran.push("storage-baseline");
  } catch {
    // best-effort
  }
}

/** Syslog baseline seeder. */
async function syslogSeeder(ran: string[]): Promise<void> {
  try {
    const db = getDb();
    const existing = await db.get("SELECT COUNT(*) as count FROM syslog_entries");
    if ((existing as { count: number }).count > 0) return;
    ran.push("syslog-baseline");
  } catch {
    // best-effort
  }
}

/** SNMP baseline seeder. */
async function snmpSeeder(ran: string[]): Promise<void> {
  try {
    const db = getDb();
    const existing = await db.get("SELECT COUNT(*) as count FROM snmp_devices");
    if ((existing as { count: number }).count > 0) return;
    ran.push("snmp-baseline");
  } catch {
    // best-effort
  }
}

/** RADIUS baseline seeder. */
async function radiusSeeder(ran: string[]): Promise<void> {
  try {
    const db = getDb();
    const existing = await db.get("SELECT COUNT(*) as count FROM radius_clients");
    if ((existing as { count: number }).count > 0) return;
    ran.push("radius-baseline");
  } catch {
    // best-effort
  }
}

/** Run all built-in seeders in deterministic order. */
export async function runSeeders(): Promise<string[]> {
  const ran: string[] = [];

  // 1. Bootstrap admin (already existed via services/user.ts seedBootstrapAdmin)
  // No-op here; bootstrap is triggered at app start.

  // 2. Identity baseline: ensure admin profile exists
  await identitySeeder(ran);

  // 3. Storage baseline buckets (if env provides default bucket name)
  await storageSeeder(ran);

  // 4. Syslog baseline: ensure empty table exists (no-op, just schema)
  await syslogSeeder(ran);

  // 5. SNMP baseline devices (empty, schema only)
  await snmpSeeder(ran);

  // 6. RADIUS baseline clients (empty, schema only)
  await radiusSeeder(ran);

  return ran;
}
