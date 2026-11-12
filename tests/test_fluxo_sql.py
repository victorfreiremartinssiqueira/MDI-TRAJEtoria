"""Teste isolado dos invariantes SQL; não substitui o teste do aplicativo Expo."""
from __future__ import annotations
import json
import sqlite3
from pathlib import Path
from datetime import datetime, timedelta
ROOT=Path(__file__).resolve().parents[1]
SEED=json.loads((ROOT/'assets/mock/seed.json').read_text())
TABLES=('usuarios','ongs','jovens','pecas','peca_fotos','consentimentos','selecao_itens','pedidos','pedido_itens','historico_pedidos','feedbacks','feedback_itens')

def mkdb():
    con=sqlite3.connect(':memory:');con.execute('PRAGMA foreign_keys=ON')
    con.executescript((ROOT/'database/schema.sql').read_text())
    for table in TABLES:
        for row in SEED[table]:
            con.execute(f"INSERT INTO {table} ({', '.join(row)}) VALUES ({','.join('?' for _ in row)})",tuple(row.values()))
    con.commit();return con

def test_order_flow():
    con=mkdb(); con.execute("INSERT INTO selecao_itens (jovem_id,peca_id,adicionado_em) VALUES (1,1,'2026-11-12')")
    con.execute("INSERT INTO selecao_itens (jovem_id,peca_id,adicionado_em) VALUES (1,2,'2026-11-12')")
    con.commit()
    # Invariant: Selection does not modify availability.
    assert con.execute('SELECT status FROM pecas WHERE id=1').fetchone()[0]=='disponivel'
    with con:
        cur=con.execute("INSERT INTO pedidos(jovem_id,data_pedido,status,endereco_cep,endereco_logradouro,endereco_numero,endereco_bairro,endereco_cidade,endereco_uf,contato_entrega,data_despacho_prevista) VALUES(1,'2026-11-12','solicitado','00000-000','Rua Exemplo','100','Bairro Fictício','São Paulo','SP','111','2026-11-19')")
        order_id=cur.lastrowid
        for pid in (1,2):
            assert con.execute("UPDATE pecas SET status='reservada' WHERE id=? AND status='disponivel'",(pid,)).rowcount==1
            con.execute("INSERT INTO pedido_itens(pedido_id,peca_id,situacao) VALUES (?,?,'reservado')",(order_id,pid))
        con.execute("INSERT INTO historico_pedidos(pedido_id,status,atualizado_em,responsavel_perfil) VALUES(?,'solicitado','2026-11-12','jovem')",(order_id,))
        con.execute('DELETE FROM selecao_itens WHERE jovem_id=1')
    assert con.execute('SELECT COUNT(*) FROM selecao_itens').fetchone()[0]==0
    assert con.execute('SELECT COUNT(*) FROM pedido_itens WHERE pedido_id=?',(order_id,)).fetchone()[0]==2
    assert con.execute("SELECT COUNT(*) FROM pecas WHERE id IN (1,2) AND status='reservada'").fetchone()[0]==2
    assert con.execute('PRAGMA foreign_key_check').fetchall()==[]
    con.close()

def test_rollback():
    con=mkdb();con.execute("INSERT INTO selecao_itens(jovem_id,peca_id,adicionado_em) VALUES(1,3,'2026-11-12')");con.commit()
    try:
        with con:
            con.execute("UPDATE pecas SET status='reservada' WHERE id=3")
            raise ValueError('Simulação de erro na confirmação')
    except ValueError:pass
    assert con.execute('SELECT status FROM pecas WHERE id=3').fetchone()[0]=='disponivel'
    assert con.execute('SELECT COUNT(*) FROM selecao_itens WHERE peca_id=3').fetchone()[0]==1
    con.close()

if __name__=='__main__':
    test_order_flow();test_rollback();print('PASSOU: seleção sem reserva, confirmação transacional e rollback SQL.')
