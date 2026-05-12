/** DB·API에 저장되는 주문 상태 (한글, Order 모델 enum과 동일) */
export const ORDER_STATUS_VALUES = [
  '결제대기',
  '결제완료',
  '상품준비중',
  '배송중',
  '배송완료',
  '취소',
  '환불',
] as const;

export type OrderStatusKo = (typeof ORDER_STATUS_VALUES)[number];

/** 이전 영문 상태 → 한글 (기존 DB 문서 호환) */
const LEGACY_EN_TO_KO: Record<string, OrderStatusKo> = {
  pending: '결제대기',
  paid: '결제완료',
  preparing: '상품준비중',
  shipped: '배송중',
  delivered: '배송완료',
  cancelled: '취소',
  refunded: '환불',
};

export function normalizeOrderStatus(raw: string | undefined): OrderStatusKo {
  if (!raw) return '결제대기';
  if (LEGACY_EN_TO_KO[raw]) return LEGACY_EN_TO_KO[raw];
  if ((ORDER_STATUS_VALUES as readonly string[]).includes(raw)) return raw as OrderStatusKo;
  return '결제대기';
}

/** CSS 모듈용 짧은 키 (status_pending 등) */
export function orderStatusToSlug(status: OrderStatusKo): string {
  const map: Record<OrderStatusKo, string> = {
    결제대기: 'pending',
    결제완료: 'paid',
    상품준비중: 'preparing',
    배송중: 'shipped',
    배송완료: 'delivered',
    취소: 'cancelled',
    환불: 'refunded',
  };
  return map[status] ?? 'pending';
}

export function isCancellableStatus(status: OrderStatusKo): boolean {
  return status === '결제대기' || status === '결제완료';
}
