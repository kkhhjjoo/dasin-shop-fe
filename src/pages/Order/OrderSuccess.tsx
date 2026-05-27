import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { normalizeOrderStatus } from '../../utils/orderStatus';
import style from './OrderSuccess.module.css';

const API_BASE = import.meta.env.VITE_API_BASE || '';

interface OrderItem {
  product?: string;
  productName?: string;
  productPrice?: number;
  quantity?: number;
  selectedOptions?: string[];
  itemTotal?: number;
}

interface OrderResponse {
  _id: string;
  items: OrderItem[];
  orderer?: { name?: string; phone?: string; email?: string };
  shippingAddress?: {
    zipCode?: string;
    province?: string;
    district?: string;
    address?: string;
    addressDetail?: string;
    memo?: string;
  };
  totalPrice?: number;
  discountAmount?: number;
  finalPrice?: number;
  status?: string;
  payment?: { method?: string; paidAt?: string; transactionId?: string };
  createdAt?: string;
}

interface SuccessState {
  order?: OrderResponse;
  merchantUid?: string;
}

export default function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = typeof window !== 'undefined' ? localStorage.getItem('dasin_token') : null;

  const stateData = (location.state as SuccessState | null) ?? null;
  const [order, setOrder] = useState<OrderResponse | null>(stateData?.order ?? null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    if (order || !API_BASE) return;

    const fetchLatest = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const list = await res.json().catch(() => null);
        if (Array.isArray(list) && list.length > 0) {
          setOrder(list[0]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, [order, token, navigate]);

  if (!order) {
    return (
      <div className={style.page}>
        <div className={style.card}>
          <h1 className={style.title}>주문이 완료되었습니다</h1>
          <p className={style.subtitle}>{loading ? '주문 정보를 불러오는 중입니다...' : '주문 정보를 찾을 수 없습니다.'}</p>
          <div className={style.actions}>
            <Link to="/" className={style.secondaryBtn}>
              홈으로
            </Link>
            <Link to="/orders" className={style.primaryBtn}>
              주문 내역 보기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const orderNumber = order._id ? order._id.slice(-10).toUpperCase() : '-';
  const finalPrice = order.finalPrice ?? 0;
  const totalPrice = order.totalPrice ?? 0;
  const discount = order.discountAmount ?? 0;
  const ship = order.shippingAddress;
  const fullAddress = ship ? [ship.province, ship.district, ship.address, ship.addressDetail].filter((v) => v && String(v).trim()).join(' ') : '';
  const paidAt = order.payment?.paidAt ? new Date(order.payment.paidAt).toLocaleString() : order.createdAt ? new Date(order.createdAt).toLocaleString() : '';
  const statusLabel = normalizeOrderStatus(order.status);

  return (
    <div className={style.page}>
      <div className={style.card}>
        <div className={style.checkmark}>✓</div>
        <h1 className={style.title}>주문이 완료되었습니다</h1>
        <p className={style.subtitle}>주문해 주셔서 감사합니다. 주문 내역은 마이 페이지에서 확인하실 수 있습니다.</p>

        <div className={style.summary}>
          <div className={style.row}>
            <span className={style.label}>주문번호</span>
            <span className={style.value}>{orderNumber}</span>
          </div>
          <div className={style.row}>
            <span className={style.label}>주문 상태</span>
            <span className={style.value}>{statusLabel}</span>
          </div>
          {paidAt && (
            <div className={style.row}>
              <span className={style.label}>결제 일시</span>
              <span className={style.value}>{paidAt}</span>
            </div>
          )}
          <div className={style.row}>
            <span className={style.label}>결제 금액</span>
            <strong className={style.totalValue}>{finalPrice.toLocaleString()}원</strong>
          </div>
          {discount > 0 && (
            <div className={style.subrow}>
              <span>
                상품 금액 {totalPrice.toLocaleString()}원 · 할인 -{discount.toLocaleString()}원
              </span>
            </div>
          )}
        </div>

        {Array.isArray(order.items) && order.items.length > 0 && (
          <div className={style.itemsSection}>
            <h2 className={style.sectionTitle}>주문 상품</h2>
            <ul className={style.itemList}>
              {order.items.map((it, idx) => (
                <li key={idx} className={style.item}>
                  <div className={style.itemBody}>
                    <span className={style.itemName}>{it.productName}</span>
                    {Array.isArray(it.selectedOptions) && it.selectedOptions.length > 0 && <span className={style.itemOptions}>{it.selectedOptions.join(', ')}</span>}
                    <span className={style.itemQty}>수량 {it.quantity}개</span>
                  </div>
                  <span className={style.itemSubtotal}>{(it.itemTotal ?? 0).toLocaleString()}원</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {fullAddress && (
          <div className={style.shipSection}>
            <h2 className={style.sectionTitle}>배송지</h2>
            <p className={style.shipName}>
              {order.orderer?.name} · {order.orderer?.phone}
            </p>
            <p className={style.shipAddress}>
              [{ship?.zipCode}] {fullAddress}
            </p>
            {ship?.memo && <p className={style.shipMemo}>메모: {ship.memo}</p>}
          </div>
        )}

        <div className={style.actions}>
          <Link to="/" className={style.secondaryBtn}>
            홈으로
          </Link>
          <Link to="/orders" className={style.primaryBtn}>
            주문 내역 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
