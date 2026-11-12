import * as SQLite from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';
import { SCHEMA_VERSION, INITIAL_SCHEMA_SQL } from './migrations/001_initial_schema';
import { seedInitialData } from './seeds/initialData';

export const DATABASE_NAME = 'trajetoria_v1.db';

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = versionRow?.user_version ?? 0;
  if (currentVersion > SCHEMA_VERSION) {
    throw new Error('Banco criado por uma versão mais recente do aplicativo.');
  }
  if (currentVersion < 1) {
    await db.execAsync(INITIAL_SCHEMA_SQL);
    await db.execAsync('PRAGMA user_version = 1');
  }
}

// Use este callback no SQLiteProvider do Expo Router:
// <SQLiteProvider databaseName={DATABASE_NAME} onInit={initializeDatabase}>...</SQLiteProvider>
export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  await migrateDatabase(db);
  await seedInitialData(db);
}

// Alternativa para uso sem SQLiteProvider:
export async function openTrajetoriaDatabase(): Promise<SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await initializeDatabase(db);
  return db;
}
