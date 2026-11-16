import fs from 'node:fs';
import path from 'node:path';
import { initDb } from './db.js';
const databaseUrl = process.env.SCHEDULER_DATABASE_URL || 'file:./data/scheduler.db';
const database = await initDb(databaseUrl);
const migration = fs.readFileSync(path.resolve('migrations/0000_scheduler.sql'), 'utf8');
for (const statement of migration.split(';').map(x => x.trim()).filter(Boolean)) await database.client.execute(statement);
database.close();
