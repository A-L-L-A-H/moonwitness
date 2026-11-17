export interface RestoreResult {
  targetDbPath: string;
  plaintextHash: string;
  restoredAt: string;
}

export function restoreDatabaseFile(options: {
  encryptedBackupPath: string;
  targetDbPath: string;
  decryptionKey: string;
  expectedPlaintextHash?: string;
}): Promise<RestoreResult>;
