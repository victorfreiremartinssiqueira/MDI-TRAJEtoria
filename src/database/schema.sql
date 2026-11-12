-- TRAJEtória - SQLite v1.0 (jornada do jovem)
-- Modelo derivado das seções 7.1-7.3 e da figura 4 da documentação original.
-- Entidades operacionais (lotes, galpão, pacotes, entrega, patrocinadores)
-- serão acrescentadas por migrações futuras. Este esquema NÃO é backend compartilhado.

CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY,
  identificacao TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  perfil TEXT NOT NULL CHECK (perfil IN ('jovem','ong','operacao','admin')),
  situacao TEXT NOT NULL DEFAULT 'ativo' CHECK (situacao IN ('ativo','inativo'))
);

CREATE TABLE IF NOT EXISTS ongs (
  id INTEGER PRIMARY KEY,
  nome TEXT NOT NULL,
  contato TEXT,
  situacao TEXT NOT NULL DEFAULT 'ativa' CHECK (situacao IN ('ativa','inativa'))
);

CREATE TABLE IF NOT EXISTS jovens (
  id INTEGER PRIMARY KEY,
  usuario_id INTEGER NOT NULL UNIQUE,
  ong_id INTEGER NOT NULL,
  nome TEXT NOT NULL,
  tamanho_referencia TEXT NOT NULL,
  tamanhos_json TEXT NOT NULL DEFAULT '[]',
  genero TEXT,
  telefone TEXT,
  cep TEXT,
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  uf TEXT,
  situacao TEXT NOT NULL DEFAULT 'validado' CHECK (situacao IN ('indicado','validado','inativo')),
  menor_de_idade INTEGER NOT NULL DEFAULT 0 CHECK (menor_de_idade IN (0,1)),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
  FOREIGN KEY (ong_id) REFERENCES ongs(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS pecas (
  id INTEGER PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  genero TEXT NOT NULL,
  tamanho TEXT NOT NULL,
  conservacao TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'disponivel'
    CHECK (status IN ('disponivel','reservada','destinada','inativa')),
  data_entrada TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS peca_fotos (
  id INTEGER PRIMARY KEY,
  peca_id INTEGER NOT NULL,
  referencia TEXT NOT NULL,
  ordem INTEGER NOT NULL CHECK (ordem >= 0),
  UNIQUE (peca_id, ordem),
  FOREIGN KEY (peca_id) REFERENCES pecas(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS consentimentos (
  id INTEGER PRIMARY KEY,
  jovem_id INTEGER NOT NULL,
  versao_termo TEXT NOT NULL,
  aceito INTEGER NOT NULL CHECK (aceito IN (0,1)),
  aceito_em TEXT NOT NULL,
  FOREIGN KEY (jovem_id) REFERENCES jovens(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS selecao_itens (
  id INTEGER PRIMARY KEY,
  jovem_id INTEGER NOT NULL,
  peca_id INTEGER NOT NULL,
  adicionado_em TEXT NOT NULL,
  UNIQUE (jovem_id, peca_id),
  FOREIGN KEY (jovem_id) REFERENCES jovens(id) ON DELETE RESTRICT,
  FOREIGN KEY (peca_id) REFERENCES pecas(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS pedidos (
  id INTEGER PRIMARY KEY,
  jovem_id INTEGER NOT NULL,
  data_pedido TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'solicitado'
    CHECK (status IN ('solicitado','em_separacao','despachado','entregue','cancelado')),
  endereco_cep TEXT NOT NULL,
  endereco_logradouro TEXT NOT NULL,
  endereco_numero TEXT NOT NULL,
  endereco_complemento TEXT,
  endereco_bairro TEXT NOT NULL,
  endereco_cidade TEXT NOT NULL,
  endereco_uf TEXT NOT NULL,
  contato_entrega TEXT NOT NULL,
  data_despacho_prevista TEXT NOT NULL,
  data_entrega_prevista TEXT,
  data_entrega_real TEXT,
  FOREIGN KEY (jovem_id) REFERENCES jovens(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS pedido_itens (
  id INTEGER PRIMARY KEY,
  pedido_id INTEGER NOT NULL,
  peca_id INTEGER NOT NULL,
  situacao TEXT NOT NULL DEFAULT 'reservado'
    CHECK (situacao IN ('reservado','separado','despachado','entregue','devolvido','cancelado')),
  UNIQUE (pedido_id, peca_id),
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE RESTRICT,
  FOREIGN KEY (peca_id) REFERENCES pecas(id) ON DELETE RESTRICT
);

-- Uma peça física só pode estar alocada a um pedido ativo de cada vez.
-- Um item devolvido/cancelado pode ser reintroduzido em pedido futuro (T19).
CREATE UNIQUE INDEX IF NOT EXISTS ux_peca_alocacao_ativa
ON pedido_itens (peca_id)
WHERE situacao IN ('reservado','separado','despachado','entregue');

CREATE TABLE IF NOT EXISTS historico_pedidos (
  id INTEGER PRIMARY KEY,
  pedido_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('solicitado','em_separacao','despachado','entregue','cancelado')),
  atualizado_em TEXT NOT NULL,
  responsavel_perfil TEXT,
  observacao TEXT,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS feedbacks (
  id INTEGER PRIMARY KEY,
  pedido_id INTEGER NOT NULL UNIQUE,
  participou_entrevista INTEGER NOT NULL CHECK (participou_entrevista IN (0,1)),
  comentario TEXT,
  criado_em TEXT NOT NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS feedback_itens (
  id INTEGER PRIMARY KEY,
  feedback_id INTEGER NOT NULL,
  pedido_item_id INTEGER NOT NULL,
  serviu INTEGER NOT NULL CHECK (serviu IN (0,1)),
  UNIQUE (feedback_id, pedido_item_id),
  FOREIGN KEY (feedback_id) REFERENCES feedbacks(id) ON DELETE RESTRICT,
  FOREIGN KEY (pedido_item_id) REFERENCES pedido_itens(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_jovens_ong ON jovens(ong_id);
CREATE INDEX IF NOT EXISTS idx_pecas_filtro ON pecas(status, tamanho, categoria, genero);
CREATE INDEX IF NOT EXISTS idx_selecao_jovem ON selecao_itens(jovem_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_jovem ON pedidos(jovem_id, data_pedido);
CREATE INDEX IF NOT EXISTS idx_historico_pedido ON historico_pedidos(pedido_id, atualizado_em);
