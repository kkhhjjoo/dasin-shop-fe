import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  type OrderStatusKo,
  normalizeOrderStatus,
  orderStatusToSlug,
  isCancellableStatus,
} from '../../utils/orderStatus';
import style from './Orders.module.css';

const API_BASE = import.meta.env.VITE_API_BASE;

/** 주문 내역 화면 탭(결제대기·결제완료는 목록에서 제외) */
const ORDER_TAB_STATUSES = [
  '상품준비중',
  '배송중',
  '배송완료',
  '취소',
  '환불',
] as const satisfies readonly OrderStatusKo[];

type TabValue = 'all' | (typeof ORDER_TAB_STATUSES)[number];

interface OrderItem {
  product?: string;
  productName?: string;
  productPrice?: number;
  quantity?: number;
  selectedOptions?: string[];
  itemTotal?: number;
}

interface OrderListItem {
  _id: string;
  items: OrderItem[];
  totalPrice?: number;
  discountAmount?: number;
  finalPrice?: number;
  status?: string;
  payment?: { method?: string; paidAt?: string; transactionId?: string };
  createdAt?: string;
  shippingAddress?: {
    zipCode?: string;
    province?: string;
    district?: string;
    address?: string;
    addressDetail?: string;
  };
}

const TABS: { value: TabValue; label: string }[] = [
  { value: 'all', label: '전체' },
  ...ORDER_TAB_STATUSES.map((value) => ({ value, label: value })),
];

export default function Orders() {
  const navigate = useNavigate();
  const token = typeof window !== 'undefined' ? localStorage.getItem('dasin_token') : null;

  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [statusTab, setStatusTab] = useState<TabValue>('all');

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    if (!API_BASE) {
      setError('API 주소가 설정되지 않았습니다.');
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || `주문 목록을 불러오지 못했습니다. (${res.status})`);
        }
        const data = await res.json();
        if (Array.isArray(data)) {
          setOrders(data);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : '주문 목록을 불러오지 못했습니다.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token, navigate]);

  const filteredOrders = useMemo(() => {
    if (statusTab === 'all') return orders;
    return orders.filter((o) => normalizeOrderStatus(o.status) === statusTab);
  }, [orders, statusTab]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    for (const v of ORDER_TAB_STATUSES) {
      counts[v] = 0;
    }
    for (const o of orders) {
      const k = normalizeOrderStatus(o.status);
      if ((ORDER_TAB_STATUSES as readonly string[]).includes(k)) {
        counts[k] = (counts[k] ?? 0) + 1;
      }
    }
    return counts;
  }, [orders]);

  const handleCancel = async (orderId: string) => {
    if (!token) return;
    if (!window.confirm('해당 주문을 취소하시겠습니까?')) return;

    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error || '주문 취소에 실패했습니다.');
        return;
      }
      const nextStatus = normalizeOrderStatus(data.status);
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: nextStatus } : o)),
      );
      toast.success('주문이 취소되었습니다.');
    } catch {
      toast.error('주문 취소 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div className={style.page}>
        <h1 className={style.pageTitle}>주문 내역</h1>
        <div className={style.stateBox}>주문 목록을 불러오는 중입니다...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={style.page}>
        <h1 className={style.pageTitle}>주문 내역</h1>
        <div className={style.stateBox}>{error}</div>
      </div>
    );
  }

  const hasNoOrders = orders.length === 0;

  return (
    <div className={style.page}>
      <h1 className={style.pageTitle}>주문 내역</h1>
      <p className={style.pageMeta}>
        {hasNoOrders
          ? '주문 0건'
          : statusTab === 'all'
            ? `전체 ${orders.length}건`
            : `「${statusTab}」 ${filteredOrders.length}건 · 전체 ${orders.length}건`}
      </p>

      <div className={style.tabRow} role="tablist" aria-label="주문 상태별 필터">
        {TABS.map((tab) => {
          const count = tab.value === 'all' ? tabCounts.all : tabCounts[tab.value] ?? 0;
          const active = statusTab === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={active}
              className={`${style.tabBtn} ${active ? style.tabBtnActive : ''}`}
              onClick={() => setStatusTab(tab.value)}
            >
              {tab.label}
              <span className={style.tabCount}>{count}</span>
            </button>
          );
        })}
      </div>

      {hasNoOrders ? (
        <div className={style.stateBox}>
          <p>아직 주문하신 내역이 없습니다.</p>
          <Link to="/" className={style.linkBtn}>
            상품 보러 가기
          </Link>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className={style.stateBox}>선택한 상태의 주문이 없습니다.</div>
      ) : (
        <ul className={style.orderList}>
          {filteredOrders.map((order) => {
            const orderNumber = order._id ? order._id.slice(-10).toUpperCase() : '-';
            const placed = order.createdAt ? new Date(order.createdAt).toLocaleString() : '';
            const normalized = normalizeOrderStatus(order.status);
            const statusLabel = normalized;
            const slug = orderStatusToSlug(normalized);
            const finalPrice = order.finalPrice ?? 0;
            const canCancel = isCancellableStatus(normalized);
            const summary = (order.items || [])
              .map((it) => `${it.productName} x${it.quantity}`)
              .slice(0, 2)
              .join(', ');
            const more =
              Array.isArray(order.items) && order.items.length > 2
                ? ` 외 ${order.items.length - 2}건`
                : '';

            return (
              <li key={order._id} className={style.orderItem}>
                <div className={style.orderHeader}>
                  <div>
                    <span className={style.orderDate}>{placed}</span>
                    <span className={style.orderNumber}>주문번호 {orderNumber}</span>
                  </div>
                  <span className={`${style.statusBadge} ${style[`status_${slug}`] ?? ''}`}>
                    {statusLabel}
                  </span>
                </div>

                <div className={style.orderBody}>
                  <p className={style.orderSummary}>
                    {summary}
                    {more}
                  </p>
                  {Array.isArray(order.items) && order.items.length > 0 && (
                    <ul className={style.itemList}>
                      {order.items.map((it, idx) => (
                        <li key={idx} className={style.item}>
                          <span className={style.itemName}>{it.productName}</span>
                          {Array.isArray(it.selectedOptions) && it.selectedOptions.length > 0 && (
                            <span className={style.itemOptions}>
                              {it.selectedOptions.join(', ')}
                            </span>
                          )}
                          <span className={style.itemQty}>x {it.quantity}</span>
                          <span className={style.itemPrice}>
                            {(it.itemTotal ?? 0).toLocaleString()}원
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className={style.orderFooter}>
                  <span className={style.priceLabel}>총 결제 금액</span>
                  <strong className={style.priceValue}>{finalPrice.toLocaleString()}원</strong>
                  {canCancel && (
                    <button
                      type="button"
                      className={style.cancelBtn}
                      onClick={() => handleCancel(order._id)}
                    >
                      주문 취소
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
