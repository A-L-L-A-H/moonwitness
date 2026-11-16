import { createClient, type Client } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';

// All modular schemas
import { baseSchema } from '@rocksoul/orm-base';
import { projectSchema } from '@rocksoul/orm-project';
import { taskSchema } from '@rocksoul/orm-task';
import { calendarSchema } from '@rocksoul/orm-calendar';
import { chatSchema } from '@rocksoul/orm-chat';
import { faqSchema } from '@rocksoul/orm-faq';
import { landingSchema } from '@rocksoul/orm-landing';
import { mailSchema } from '@rocksoul/orm-mail';
import { servicesSchema } from '@rocksoul/orm-services';
import { resourceSchema } from '@rocksoul/orm-resource';
import { caseSchema } from '@rocksoul/orm-case';
import { reviewSchema } from '@rocksoul/orm-review';
import { fileSchema } from '@rocksoul/orm-file';
import { notificationSchema } from '@rocksoul/orm-notification';
import { researchSchema } from '@rocksoul/orm-research';
import { annotationSchema } from '@rocksoul/orm-annotation';
import { activitySchema } from '@rocksoul/orm-activity';

/**
 * Agregasi seluruh schema modular (Odoo-like plug and play)
 */
export const appSchema = {
  ...baseSchema,
  ...projectSchema,
  ...taskSchema,
  ...calendarSchema,
  ...chatSchema,
  ...faqSchema,
  ...landingSchema,
  ...mailSchema,
  ...servicesSchema,
  ...resourceSchema,
  ...caseSchema,
  ...reviewSchema,
  ...fileSchema,
  ...notificationSchema,
  ...researchSchema,
  ...annotationSchema,
  ...activitySchema,
};

export type AppSchema = typeof appSchema;
export type Database = LibSQLDatabase<AppSchema>;

export interface DbConnection {
  client: Client;
  db: Database;
}

import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export function createDatabase(
  url: string = process.env.DATABASE_URL || 'file:./data/sqlite.db'
): DbConnection {
  const isFilePath = url.startsWith('file:') && !url.startsWith('file::');
  if (isFilePath) {
    const rawPath = url.replace('file:', '');
    const absPath = resolve(process.cwd(), rawPath);
    const dir = dirname(absPath);
    if (dir && !existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  const databaseUrl = isFilePath ? `file:${resolve(process.cwd(), url.replace('file:', ''))}` : url;
  const client = createClient({ url: databaseUrl });
  const db = drizzle(client, { schema: appSchema });
  return { client, db };
}
