import type { SQLiteDatabase } from 'expo-sqlite';
import { config } from '../../constants/theme';
import * as Crypto from 'expo-crypto';
import type { Address, FeedbackAnswers, Order, OrderHistory, OrderPiece, Piece, Young } from '../../types/models';
import { nextDispatch } from '../../utils/format';

const JOVEM = config.demoYoungId;
const now = () => new Date().toISOString();

export async function getYoung(db:SQLiteDatabase):Promise<Young> {
  const row=await db.getFirstAsync<Young>(`SELECT j.*,o.nome AS ong_nome FROM jovens j JOIN ongs o ON o.id=j.ong_id WHERE j.id=?`,JOVEM);
  if(!row) throw new Error('Cadastro não encontrado.'); return row;
}
export async function authenticate(db:SQLiteDatabase, username:string, password:string):Promise<boolean> {
  // Apenas protótipo acadêmico. Em produção, autenticar no servidor com hash de senha seguro.
  const row=await db.getFirstAsync<{identificacao:string;senha_hash:string}>(
    "SELECT identificacao,senha_hash FROM usuarios WHERE identificacao=? AND perfil='jovem' AND situacao='ativo'", username.trim().toLowerCase());
  // Hash de demonstração pré-cadastrado; nunca usar esse método como autenticação real.
  const hashed=await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,password);
  return !!row && hashed===row.senha_hash;
}
export async function hasConsent(db:SQLiteDatabase) {
  const row=await db.getFirstAsync<{id:number}>("SELECT id FROM consentimentos WHERE jovem_id=? AND versao_termo=? AND aceito=1 ORDER BY id DESC LIMIT 1",JOVEM,config.consentVersion);
  return !!row;
}
export async function saveConsent(db:SQLiteDatabase){
 await db.runAsync('INSERT INTO consentimentos(jovem_id,versao_termo,aceito,aceito_em) VALUES (?,?,1,?)',JOVEM,config.consentVersion,now());
}
export async function getPieces(db:SQLiteDatabase):Promise<Piece[]> {
  return await db.getAllAsync<Piece>(`SELECT p.*,(SELECT referencia FROM peca_fotos WHERE peca_id=p.id ORDER BY ordem LIMIT 1) foto FROM pecas p WHERE p.status='disponivel' ORDER BY p.id`);
}
export async function getPiece(db:SQLiteDatabase,id:number):Promise<Piece|null>{
 return await db.getFirstAsync<Piece>(`SELECT p.*,(SELECT referencia FROM peca_fotos WHERE peca_id=p.id ORDER BY ordem LIMIT 1) foto FROM pecas p WHERE p.id=?`,id);
}
export async function getPiecePhotos(db:SQLiteDatabase,id:number):Promise<{id:number;referencia:string;ordem:number}[]> {
 return db.getAllAsync<{id:number;referencia:string;ordem:number}>('SELECT id,referencia,ordem FROM peca_fotos WHERE peca_id=? ORDER BY ordem,id',id);
}
export async function getSelection(db:SQLiteDatabase):Promise<Piece[]>{
 return await db.getAllAsync<Piece>(`SELECT p.*,(SELECT referencia FROM peca_fotos WHERE peca_id=p.id ORDER BY ordem LIMIT 1) foto FROM selecao_itens s JOIN pecas p ON p.id=s.peca_id WHERE s.jovem_id=? ORDER BY s.adicionado_em,s.id`,JOVEM);
}
export async function addPieceToSelection(db:SQLiteDatabase,id:number):Promise<void>{
 await db.withTransactionAsync(async()=>{
  const item=await db.getFirstAsync<{status:string}>('SELECT status FROM pecas WHERE id=?',id);
  if(!item || item.status!=='disponivel') throw new Error('Esta peça não está mais disponível. Confira o catálogo.');
  const duplicate=await db.getFirstAsync<{id:number}>('SELECT id FROM selecao_itens WHERE jovem_id=? AND peca_id=?',JOVEM,id);
  if(duplicate)throw new Error('Esta peça já está em seu pedido.');
  const total=await db.getFirstAsync<{qtd:number}>('SELECT COUNT(*) AS qtd FROM selecao_itens WHERE jovem_id=?',JOVEM);
  if((total?.qtd??0)>=config.maxItemsPerOrder)throw new Error(`Você pode solicitar até ${config.maxItemsPerOrder} peças por pedido.`);
  await db.runAsync('INSERT INTO selecao_itens(jovem_id,peca_id,adicionado_em) VALUES (?,?,?)',JOVEM,id,now());
 });
}
export async function removePieceFromSelection(db:SQLiteDatabase,id:number){
 await db.runAsync('DELETE FROM selecao_itens WHERE jovem_id=? AND peca_id=?',JOVEM,id);
}
export async function listOrders(db:SQLiteDatabase):Promise<Order[]> {
 return await db.getAllAsync<Order>(`SELECT p.*,(SELECT f.id FROM feedbacks f WHERE f.pedido_id=p.id) AS feedback_id FROM pedidos p WHERE p.jovem_id=? ORDER BY p.data_pedido DESC,p.id DESC`,JOVEM);
}
export async function getOrder(db:SQLiteDatabase,id:number):Promise<Order|null>{
 return await db.getFirstAsync<Order>(`SELECT p.*,(SELECT f.id FROM feedbacks f WHERE f.pedido_id=p.id) AS feedback_id FROM pedidos p WHERE p.id=? AND p.jovem_id=?`,id,JOVEM);
}
export async function getOrderPieces(db:SQLiteDatabase,orderId:number):Promise<OrderPiece[]> {
 return await db.getAllAsync<OrderPiece>(`SELECT p.*,(SELECT referencia FROM peca_fotos WHERE peca_id=p.id ORDER BY ordem LIMIT 1) AS foto,i.id AS pedido_item_id,i.situacao FROM pedido_itens i JOIN pedidos ped ON ped.id=i.pedido_id JOIN pecas p ON p.id=i.peca_id WHERE i.pedido_id=? AND ped.jovem_id=? ORDER BY i.id`,orderId,JOVEM);
}
export async function getOrderHistory(db:SQLiteDatabase,orderId:number):Promise<OrderHistory[]>{
 return await db.getAllAsync<OrderHistory>(`SELECT h.* FROM historico_pedidos h JOIN pedidos p ON p.id=h.pedido_id WHERE h.pedido_id=? AND p.jovem_id=? ORDER BY h.atualizado_em`,orderId,JOVEM);
}
export async function confirmOrder(db:SQLiteDatabase,address:Address):Promise<number>{
 let createdId=0;
 const required=[address.cep,address.logradouro,address.numero,address.bairro,address.cidade,address.uf,address.contato];
 if(required.some(x=>!x.trim()))throw new Error('Preencha todos os campos obrigatórios de endereço e contato.');
 await db.withTransactionAsync(async()=>{
  const pieces=await db.getAllAsync<{peca_id:number; nome:string; status:string}>(`SELECT s.peca_id,p.nome,p.status FROM selecao_itens s JOIN pecas p ON p.id=s.peca_id WHERE s.jovem_id=? ORDER BY s.id`,JOVEM);
  if(pieces.length<1||pieces.length>config.maxItemsPerOrder)throw new Error(`Selecione de 1 a ${config.maxItemsPerOrder} peças antes de enviar.`);
  const unavailable=pieces.filter(p=>p.status!=='disponivel');
  if(unavailable.length)throw new Error(`Peça indisponível: ${unavailable.map(x=>x.nome).join(', ')}. Volte a Meu pedido e remova-a.`);
  const timestamp=now();
  const result=await db.runAsync(`INSERT INTO pedidos(jovem_id,data_pedido,status,endereco_cep,endereco_logradouro,endereco_numero,endereco_complemento,endereco_bairro,endereco_cidade,endereco_uf,contato_entrega,data_despacho_prevista) VALUES(?,?,'solicitado',?,?,?,?,?,?,?,?,?)`,JOVEM,timestamp,address.cep,address.logradouro,address.numero,address.complemento,address.bairro,address.cidade,address.uf,address.contato,nextDispatch());
  createdId=result.lastInsertRowId;
  for(const item of pieces){
   const updated=await db.runAsync("UPDATE pecas SET status='reservada' WHERE id=? AND status='disponivel'",item.peca_id);
   if(updated.changes!==1)throw new Error(`A peça ${item.nome} não está mais disponível. Retorne ao pedido para revisar.`);
   await db.runAsync("INSERT INTO pedido_itens(pedido_id,peca_id,situacao) VALUES(?,?,'reservado')",createdId,item.peca_id);
  }
  await db.runAsync("INSERT INTO historico_pedidos(pedido_id,status,atualizado_em,responsavel_perfil,observacao) VALUES(?,'solicitado',?,'jovem','Pedido enviado pelo aplicativo')",createdId,timestamp);
  await db.runAsync(`UPDATE jovens SET cep=?,logradouro=?,numero=?,complemento=?,bairro=?,cidade=?,uf=?,telefone=? WHERE id=?`,address.cep,address.logradouro,address.numero,address.complemento,address.bairro,address.cidade,address.uf,address.contato,JOVEM);
  await db.runAsync('DELETE FROM selecao_itens WHERE jovem_id=?',JOVEM);
 });
 return createdId;
}
export async function saveFeedback(db:SQLiteDatabase,orderId:number,answers:FeedbackAnswers,participated:boolean,comment:string):Promise<void>{
 await db.withTransactionAsync(async()=>{
  const order=await getOrder(db,orderId);
  if(!order||order.status!=='entregue')throw new Error('O feedback só é permitido para pedidos entregues.');
  if(order.feedback_id!==null)throw new Error('Você já avaliou este pedido.');
  const items=await getOrderPieces(db,orderId);
  if(!items.length||items.some(p=>typeof answers[p.pedido_item_id]!=='boolean'))throw new Error('Responda se cada peça serviu antes de enviar.');
  const result=await db.runAsync('INSERT INTO feedbacks(pedido_id,participou_entrevista,comentario,criado_em) VALUES (?,?,?,?)',orderId,participated?1:0,comment.trim(),now());
  for(const item of items){await db.runAsync('INSERT INTO feedback_itens(feedback_id,pedido_item_id,serviu) VALUES (?,?,?)',result.lastInsertRowId,item.pedido_item_id,answers[item.pedido_item_id]?1:0)}
 });
}
export async function getExistingFeedback(db:SQLiteDatabase,orderId:number){
 return await db.getFirstAsync<{id:number;participou_entrevista:number;comentario:string}>("SELECT id,participou_entrevista,comentario FROM feedbacks WHERE pedido_id=?",orderId);
}
