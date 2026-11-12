import type { SQLiteDatabase } from 'expo-sqlite';
import seedData from '../../../assets/mock/seed.json';

// Os dados são fictícios. Seeding apenas em banco vazio (primeira instalação).
// A ordem respeita as dependências de chaves estrangeiras.
const TABLES = [
  'usuarios', 'ongs', 'jovens', 'pecas', 'peca_fotos',
  'consentimentos', 'selecao_itens', 'pedidos', 'pedido_itens',
  'historico_pedidos', 'feedbacks', 'feedback_itens',
] as const;

export async function seedInitialData(db: SQLiteDatabase): Promise<void> {
  const count = await db.getFirstAsync<{ quantidade: number }>(
    'SELECT COUNT(*) AS quantidade FROM usuarios'
  );
  if ((count?.quantidade ?? 0) > 0) return;

  await db.withTransactionAsync(async () => {
    // Rechecagem, para tornar chamadas sucessivas mais seguras durante init.
    const check = await db.getFirstAsync<{ quantidade: number }>(
      'SELECT COUNT(*) AS quantidade FROM usuarios'
    );
    if ((check?.quantidade ?? 0) > 0) return;

    for (const table of TABLES) {
      const rows = seedData[table];
      for (const row of rows) {
        const values = Object.entries(row);
        const columns = values.map(([column]) => column);
        const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`;
        await db.runAsync(sql, values.map(([, value]) => value));
      }
    }
  });
}
