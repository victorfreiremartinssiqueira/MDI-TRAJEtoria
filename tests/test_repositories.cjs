const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const ts = require('typescript');
const root = process.cwd();
const cache = new Map();
function load(file) {
  const filename = path.resolve(root, file);
  if (cache.has(filename)) return cache.get(filename);
  const module = { exports: {} };
  cache.set(filename, module.exports);
  const source = fs.readFileSync(filename, 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const localRequire = name => {
    if (name === 'expo-crypto') return { CryptoDigestAlgorithm: { SHA256: 'sha256' }, digestStringAsync: async (algorithm, value) => require('node:crypto').createHash(algorithm).update(value).digest('hex') };
    if (name.startsWith('.')) {
      let target = path.resolve(path.dirname(filename), name);
      target += fs.existsSync(target + '.ts') ? '.ts' : '/index.ts';
      return load(target);
    }
    return require(name);
  };
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
  cache.set(filename, module.exports);
  return module.exports;
}
(async () => {
  const testFile = path.join(root, '.expo', 't07-order-' + Date.now() + '.db'); const sqlite = new DatabaseSync(testFile);
  const { INITIAL_SCHEMA_SQL } = load('src/database/migrations/001_initial_schema.ts');
  sqlite.exec(INITIAL_SCHEMA_SQL);
  const seed = JSON.parse(fs.readFileSync('assets/mock/seed.json', 'utf8'));
  const tables = ['usuarios','ongs','jovens','pecas','peca_fotos','consentimentos','selecao_itens','pedidos','pedido_itens','historico_pedidos','feedbacks','feedback_itens'];
  for (const table of tables) for (const row of seed[table]) {
    const keys = Object.keys(row);
    sqlite.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`).run(...Object.values(row));
  }
  const rawDb = {
    getFirstAsync: async (sql, ...args) => sqlite.prepare(sql).get(...args) ?? null,
    getAllAsync: async (sql, ...args) => sqlite.prepare(sql).all(...args),
    runAsync: async (sql, ...args) => { const result = sqlite.prepare(sql).run(...args); return { changes: Number(result.changes), lastInsertRowId: Number(result.lastInsertRowid) }; },
    withTransactionAsync: async fn => { sqlite.exec('BEGIN'); try { await fn(); sqlite.exec('COMMIT'); } catch (error) { sqlite.exec('ROLLBACK'); throw error; } },
  };
  const sessions = load('src/database/session.ts'); const firstSession = sessions.createSessionDatabase(rawDb, 1); const db = firstSession.db;
  const repo = load('src/database/repositories/index.ts');
  const { fetchCatalog } = load('src/services/catalogService.ts');
  const pieces = await fetchCatalog(db);
  assert(pieces.length > 5);
  assert(pieces.every(piece => piece.status === 'disponivel'));
  await assert.rejects(() => fetchCatalog(db, true), /carregar/);
  sqlite.exec('DELETE FROM selecao_itens');
  const unavailable = sqlite.prepare("SELECT id FROM pecas WHERE status <> 'disponivel' LIMIT 1").get();
  await assert.rejects(() => repo.addPieceToSelection(db, unavailable.id), /disponível/);
  await repo.addPieceToSelection(db, pieces[0].id);
  await assert.rejects(() => repo.addPieceToSelection(db, pieces[0].id), /já está/);
  for (const piece of pieces.slice(1, 5)) await repo.addPieceToSelection(db, piece.id);
  await assert.rejects(() => repo.addPieceToSelection(db, pieces[5].id), /até 5/);
  assert.equal((await repo.getSelection(db)).length, 5);
  for (const piece of pieces.slice(0, 5)) assert.equal((await repo.getPiece(db, piece.id)).status, 'disponivel');
  const { nextDispatch } = load('src/utils/format.ts');
  assert.equal(nextDispatch(new Date(2026, 10, 9, 12)), '2026-11-12');
  assert.equal(nextDispatch(new Date(2026, 10, 11, 12)), '2026-11-12');
  assert.equal(nextDispatch(new Date(2026, 10, 12, 8)), '2026-11-19');
  assert.equal(nextDispatch(new Date(2026, 10, 13, 12)), '2026-11-19');
  assert.equal(nextDispatch(new Date(2026, 10, 12, 8), 12), '2026-11-12');
  assert.equal(nextDispatch(new Date(2026, 10, 12, 12), 12), '2026-11-19');
  assert.equal(nextDispatch(new Date(2026, 11, 31, 12)), '2027-01-07');
  const address = { cep: '04567-890', logradouro: 'Rua de teste', numero: '123', complemento: 'Apto 2', bairro: 'Centro', cidade: 'São Paulo', uf: 'SP', contato: '(11) 98765-4321' };
  const originalOrders = sqlite.prepare('SELECT COUNT(*) AS count FROM pedidos').get().count;
  const originalStatuses = sqlite.prepare('SELECT id,status FROM pecas ORDER BY id').all();
  await assert.rejects(() => repo.confirmOrder(db, { ...address, logradouro: ' ' }), /obrigatórios/);
  assert.equal((await repo.getSelection(db)).length, 5);
  sqlite.exec('DELETE FROM selecao_itens');
  await assert.rejects(() => repo.confirmOrder(db, address), /Selecione de 1 a 5/);
  for (const piece of pieces.slice(0, 6)) sqlite.prepare("INSERT INTO selecao_itens(jovem_id,peca_id,adicionado_em) VALUES(1,?,'2026-11-13')").run(piece.id);
  await assert.rejects(() => repo.confirmOrder(db, address), /Selecione de 1 a 5/);
  sqlite.exec('DELETE FROM selecao_itens');
  for (const piece of pieces.slice(0, 2)) await repo.addPieceToSelection(db, piece.id);
  sqlite.prepare("UPDATE pecas SET status='reservada' WHERE id=?").run(pieces[1].id);
  await assert.rejects(() => repo.confirmOrder(db, address), error => error.message.includes(pieces[1].nome));
  assert.equal((await repo.getSelection(db)).length, 2);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM pedidos').get().count, originalOrders);
  sqlite.prepare("UPDATE pecas SET status='disponivel' WHERE id=?").run(pieces[1].id);
  sqlite.exec("CREATE TEMP TRIGGER fail_order_item BEFORE INSERT ON pedido_itens BEGIN SELECT RAISE(ABORT, 'simulated failure'); END;");
  await assert.rejects(() => repo.confirmOrder(db, address), /simulated failure/);
  assert.equal((await repo.getSelection(db)).length, 2);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM pedidos').get().count, originalOrders);
  assert.deepEqual(sqlite.prepare('SELECT id,status FROM pecas ORDER BY id').all(), originalStatuses);
  sqlite.exec('DROP TRIGGER fail_order_item');
  const orderId = await repo.confirmOrder(db, address);
  const order = await repo.getOrder(db, orderId);
  assert.equal(order.status, 'solicitado');
  assert.equal(order.endereco_logradouro, address.logradouro);
  assert.equal(order.contato_entrega, address.contato);
  assert.equal(order.data_previsao_entrega ?? order.data_entrega_prevista, null);
  assert.equal(order.data_despacho_prevista, nextDispatch());
  assert.equal((await repo.getOrderPieces(db, orderId)).length, 2);
  assert.equal((await repo.getOrderHistory(db, orderId))[0].status, 'solicitado');
  assert.equal((await repo.getSelection(db)).length, 0);
  assert.equal((await repo.getYoung(db)).telefone, address.contato);
  assert.equal((await repo.getYoung(db)).complemento, address.complemento);
  for (const piece of pieces.slice(0, 2)) assert.equal((await repo.getPiece(db, piece.id)).status, 'reservada');
  assert(!(await repo.getPieces(db)).some(piece => pieces.slice(0, 2).some(reserved => reserved.id === piece.id)));
  await assert.rejects(() => repo.confirmOrder(db, address), /Selecione de 1 a 5/);
  const persisted = new DatabaseSync(testFile);
  assert.equal(persisted.prepare('SELECT status FROM pedidos WHERE id=?').get(orderId).status, 'solicitado');
  assert.equal(persisted.prepare('SELECT COUNT(*) AS count FROM selecao_itens').get().count, 0);
  assert.equal(persisted.prepare('SELECT COUNT(*) AS count FROM pedido_itens WHERE pedido_id=?').get(orderId).count, 2);
  assert.equal(persisted.prepare('SELECT telefone FROM jovens WHERE id=1').get().telefone, address.contato);
  persisted.close();
  console.log('PASS T07: Thursday dates/cutoff/year rollover; edited address/contact saved; required/empty/six/unavailable rejection; rollback after insert failure; successful order/items/history/reservation; catalog exclusion; persistence and cleared selection; repeated submission rejected.');
  await assert.rejects(() => repo.getSelection(rawDb), /Sessão encerrada/);
  const { config } = load('src/constants/theme.ts');
  const firstYoung = await repo.authenticate(rawDb, config.demoUser, config.demoPassword);
  assert.equal(firstYoung.id, 1);
  const originalUser = sqlite.prepare('SELECT * FROM usuarios WHERE id=?').get(firstYoung.usuario_id);
  sqlite.prepare("INSERT INTO usuarios(id,identificacao,senha_hash,perfil,situacao) VALUES(99,'second.test',?,'jovem','ativo')").run(originalUser.senha_hash);
  sqlite.exec("INSERT INTO jovens(id,usuario_id,ong_id,nome,tamanho_referencia,situacao) VALUES(99,99,1,'Segundo jovem','P','validado')");
  const secondYoung = await repo.authenticate(rawDb, 'second.test', config.demoPassword);
  assert.equal(secondYoung.id, 99);
  const second = sessions.createSessionDatabase(rawDb, secondYoung.id);
  assert.equal((await repo.getYoung(second.db)).nome, 'Segundo jovem');
  assert.equal((await repo.listOrders(second.db)).length, 0);
  assert.equal(await repo.getOrder(second.db, orderId), null);
  assert.equal((await repo.getOrderPieces(second.db, orderId)).length, 0);
  assert.equal(await repo.hasConsent(second.db), false);
  await repo.saveConsent(second.db);
  assert.equal(await repo.hasConsent(second.db), true);
  assert.equal(await repo.hasConsent(db), false);
  const availableForSecond = (await repo.getPieces(second.db))[0];
  await repo.addPieceToSelection(second.db, availableForSecond.id);
  assert.equal((await repo.getSelection(second.db)).length, 1);
  assert.equal((await repo.getSelection(db)).length, 0);
  second.close();
  await assert.rejects(() => repo.getSelection(second.db), /Sessão encerrada/);
  const relogin = await repo.authenticate(rawDb, 'second.test', config.demoPassword);
  const restored = sessions.createSessionDatabase(rawDb, relogin.id);
  assert.equal(await repo.hasConsent(restored.db), true);
  assert.equal((await repo.getSelection(restored.db)).length, 1);
  sqlite.exec("UPDATE jovens SET situacao='inativo' WHERE id=99");
  assert.equal(await repo.authenticate(rawDb,'second.test',config.demoPassword),null);
  sqlite.exec("UPDATE jovens SET situacao='validado' WHERE id=99; UPDATE ongs SET situacao='inativa' WHERE id=1;");
  assert.equal(await repo.authenticate(rawDb,'second.test',config.demoPassword),null);
  assert.equal(await repo.authenticate(rawDb,config.demoUser,'invalid'),null);
  restored.close(); firstSession.close();
  console.log('PASS: real account identity, active NGO/validated young, scoped orders/selection/consent, closed-session rejection, login after logout preserves data.');
  sqlite.close();
  console.log('PASS: service loading/error, available-only catalog, unavailable/duplicate/limit rejection, five-item selection, no reservation on add.');
})().catch(error => { console.error(error); process.exitCode = 1; });


