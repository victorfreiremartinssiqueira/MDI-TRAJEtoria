import type { Order, OrderStatus } from '../types/models';
import { statusSteps } from './format';

export const trackingMessages: Record<OrderStatus, string> = {
  solicitado: 'Sua solicitação foi registrada e aguarda preparação.',
  em_separacao: 'Seu pedido está sendo preparado pela nossa equipe.',
  despachado: 'Seu pacote foi despachado. Acompanhe as informações de entrega.',
  entregue: 'Sua entrega foi concluída!',
  cancelado: 'Este pedido foi cancelado. Consulte a equipe se precisar de ajuda.',
};
export function trackingStages(status: OrderStatus) {
  const current = statusSteps.indexOf(status);
  return statusSteps.map((step, index) => ({ status: step, completed: current >= 0 && index < current, current: index === current }));
}
export function canReviewOrder(order: Pick<Order, 'status' | 'feedback_id'>) {
  return order.status === 'entregue' && order.feedback_id === null;
}
export function validDeliveryDate(value: string | null): string | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? value.slice(0, 10) : null;
}
