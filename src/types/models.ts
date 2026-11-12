export type OrderStatus = 'solicitado' | 'em_separacao' | 'despachado' | 'entregue' | 'cancelado';
export type ItemStatus = 'disponivel' | 'reservada' | 'destinada' | 'inativa';
export interface Young { id:number; nome:string; tamanho_referencia:string; tamanhos_json:string; telefone:string | null; cep:string | null; logradouro:string | null; numero:string | null; complemento:string | null; bairro:string | null; cidade:string | null; uf:string | null; ong_nome:string; menor_de_idade:number; }
export interface Piece {id:number; nome:string; categoria:string; genero:string; tamanho:string; conservacao:string; descricao:string | null; status:ItemStatus; foto:string|null;}
export interface Order {id:number; data_pedido:string; status:OrderStatus; data_despacho_prevista:string; data_entrega_prevista:string|null; data_entrega_real:string|null; endereco_logradouro:string; endereco_numero:string; endereco_bairro:string; endereco_cidade:string; endereco_uf:string; endereco_cep:string; contato_entrega:string; feedback_id:number|null;}
export interface OrderPiece extends Piece { pedido_item_id:number; situacao:string; }
export interface OrderHistory {id:number;status:OrderStatus; atualizado_em:string;observacao:string|null}
export interface Address {cep:string; logradouro:string; numero:string; complemento:string; bairro:string; cidade:string; uf:string; contato:string;}
export interface FeedbackAnswers { [pedidoItemId: number]: boolean; }
