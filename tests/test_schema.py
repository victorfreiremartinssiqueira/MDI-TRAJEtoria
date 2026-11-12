"""Testa o esquema + os mesmos seeds JSON do pacote, sem depender do Expo."""
from __future__ import annotations
import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = ROOT / 'database' / 'schema.sql'
SEEDS = ROOT / 'assets' / 'mock' / 'seed.json'
TABLES = (
    'usuarios', 'ongs', 'jovens', 'pecas', 'peca_fotos',
    'consentimentos', 'selecao_itens', 'pedidos', 'pedido_itens',
    'historico_pedidos', 'feedbacks', 'feedback_itens'
)

def populate(db: sqlite3.Connection):
    seed = json.loads(SEEDS.read_text(encoding='utf8'))
    for table in TABLES:
        for item in seed[table]:
            cols = ', '.join(item)
            placeholders = ', '.join('?' for _ in item)
            db.execute(f'INSERT INTO {table} ({cols}) VALUES ({placeholders})', tuple(item.values()))
    db.commit()


def run_tests(db: sqlite3.Connection):
    assert db.execute('PRAGMA foreign_keys').fetchone()[0] == 1
    assert db.execute('SELECT COUNT(*) FROM pecas').fetchone()[0] == 15
    assert db.execute("SELECT COUNT(*) FROM pecas WHERE status='disponivel'").fetchone()[0] == 10
    assert db.execute('SELECT COUNT(*) FROM pedidos').fetchone()[0] == 3
    statuses = {r[0] for r in db.execute('SELECT status FROM pedidos')}
    assert statuses == {'em_separacao', 'despachado', 'entregue'}
    assert db.execute('SELECT COUNT(*) FROM consentimentos').fetchone()[0] == 0
    assert db.execute('SELECT COUNT(*) FROM feedbacks').fetchone()[0] == 0
    assert db.execute('PRAGMA foreign_key_check').fetchall() == []
    assert db.execute('SELECT COUNT(*) FROM sqlite_master WHERE type="table" AND name NOT LIKE "sqlite_%"').fetchone()[0] == 12

    # Impedir uma mesma peça simultaneamente em dois pedidos ativos.
    try:
        db.execute('INSERT INTO pedido_itens(pedido_id,peca_id,situacao) VALUES (3,9,\'reservado\')')
    except sqlite3.IntegrityError:
        db.rollback()
    else:
        raise AssertionError('Duplicação de peça alocada foi permitida!')

    # Um pedido de outro jovem não pode referir jovem inexistente.
    try:
        db.execute("""INSERT INTO pedidos(jovem_id,data_pedido,status,
          endereco_cep,endereco_logradouro,endereco_numero,endereco_bairro,
          endereco_cidade,endereco_uf,contato_entrega,data_despacho_prevista)
          VALUES(999,'2026-11-12','solicitado','000','Rua','1','B','SP','SP','000','2026-11-19')""")
    except sqlite3.IntegrityError:
        db.rollback()
    else:
        raise AssertionError('Chave estrangeira inválida foi aceita!')

    # Um pedido entregue recebe um feedback e avaliação individual.
    db.execute("INSERT INTO feedbacks(id,pedido_id,participou_entrevista,criado_em) VALUES(1,3,0,'2026-11-12T10:00:00-03:00')")
    db.execute('INSERT INTO feedback_itens(id,feedback_id,pedido_item_id,serviu) VALUES (1,1,5,1)')
    db.commit()
    assert db.execute('SELECT serviu FROM feedback_itens').fetchone()[0] == 1


def main():
    db = sqlite3.connect(':memory:')
    db.execute('PRAGMA foreign_keys=ON')
    db.executescript(SCHEMA.read_text(encoding='utf8'))
    populate(db)
    run_tests(db)
    db.close()
    print('PASSOU: 12 tabelas, 15 peças, 3 pedidos, FKs, unicidade e feedback.')

if __name__ == '__main__':
    main()
