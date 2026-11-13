import type { SQLiteDatabase } from 'expo-sqlite';
const identities = new WeakMap<SQLiteDatabase, { youngId: number; active: boolean }>();
export function sessionYoungId(db: SQLiteDatabase): number {
  const session = identities.get(db);
  if (!session?.active) throw new Error('Sessão encerrada. Acesse sua conta novamente.');
  return session.youngId;
}
export function createSessionDatabase(raw: SQLiteDatabase, youngId: number) {
  const identity = { youngId, active: true };
  const db = new Proxy(raw, {
    get(target, property) {
      const value = Reflect.get(target, property, target);
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) => {
        if (!identity.active) throw new Error('Sessão encerrada. Acesse sua conta novamente.');
        return value.apply(target, args);
      };
    },
  });
  identities.set(db, identity);
  return { db, close: () => { identity.active = false; } };
}
