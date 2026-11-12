import { config } from '../constants/theme';
import type { OrderStatus } from '../types/models';
export const statusLabels: Record<OrderStatus,string> = {
 solicitado:'Solicitado', em_separacao:'Em separação', despachado:'Despachado', entregue:'Entregue', cancelado:'Cancelado'
};
export const statusSteps: OrderStatus[] = ['solicitado','em_separacao','despachado','entregue'];
export function datePT(value?:string|null) {
  if(!value) return 'A definir pela operação';
  const iso = value.slice(0,10); const [y,m,d]=iso.split('-').map(Number);
  const day = new Date(y,m-1,d);
  return new Intl.DateTimeFormat('pt-BR', { day:'2-digit', month:'long', year:'numeric' }).format(day);
}
export function dateShort(value?:string|null) {
 if(!value)return 'A definir';const parts=value.slice(0,10).split('-');return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
export function nextDispatch(from=new Date()):string {
 const d=new Date(from.getFullYear(),from.getMonth(),from.getDate());
 let days=(config.dispatchDay-d.getDay()+7)%7;
 // Sem horário de corte confirmado: pedidos registrados na quinta entram no ciclo seguinte.
 if (days===0) days=7;
 d.setDate(d.getDate()+days);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
export function initials(name:string){return name.split(' ').slice(0,2).map(x=>x[0]).join('').toUpperCase()}
