export interface BackupReport {
  dbName: string;
  backupFile: string;
  fullPath: string;
  sizeBytes: number;
  plaintextHash: string;
  encryptedHash: string;
  tables: string[];
  createdAt: string;
}

export interface BackupSuiteResult {
  manifest: {
    version: string;
    createdAt: string;
    algorithm: string;
    databases: BackupReport[];
  };
  manifestPath: string;
}

export function backupDatabaseFile(options: {
  sourceDbPath: string;
  outputDir: string;
  encryptionKey: string;
}): Promise<BackupReport>;

export function runBackupSuite(options: {
  databases: string[];
  outputDir: string;
  encryptionKey: string;
}): Promise<BackupSuiteResult>;
