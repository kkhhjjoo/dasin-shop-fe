import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import style from './Admin.module.css';
import {
  ORDER_STATUS_VALUES,
  type OrderStatusKo,
  normalizeOrderStatus,
} from '../../utils/orderStatus';
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

declare global {
  interface Window {
    cloudinary?: {
      createUploadWidget: (options: { cloudName: string; uploadPreset: string }, callback: (error: unknown, result: { event: string; info?: { secure_url: string } }) => void) => { open: () => void };
    };
  }
}

type TabId = 'dashboard' | 'products' | 'orders' | 'users';

interface ProductOptionGroup {
  label: string;
  choices: string[];
}

interface ProductItem {
  _id: string;
  sku?: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  discountRate?: number;
  imageUrl?: string;
  badge?: string;
  rank?: number;
  category?: string;
  variants?: { name: string }[];
  options?: ProductOptionGroup[];
}

const emptyProductForm = {
  sku: '',
  name: '',
  description: '',
  price: '' as number | '',
  originalPrice: '' as number | '',
  discountRate: '' as number | '',
  imageUrl: '',
  badge: '',
  category: '닭가슴살',
  rank: '' as number | '',
  options: [] as ProductOptionGroup[],
};

interface UserItem {
  _id: string;
  email: string;
  name: string;
  user_type: 'customer' | 'admin';
  createdAt: string;
}

interface OrderItem {
  _id: string;
  user?: { email?: string; name?: string };
  orderer?: { name?: string; phone?: string; email?: string };
  finalPrice?: number;
  status: string;
  createdAt?: string;
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'dashboard', label: '대시보드' },
  { id: 'products', label: '상품 관리' },
  { id: 'orders', label: '주문 관리' },
  { id: 'users', label: '회원 관리' },
];

const ORDER_BADGE_BY_STATUS: Record<OrderStatusKo, string> = {
  결제대기: style.badgeOrderPending,
  결제완료: style.badgeOrderPaid,
  상품준비중: style.badgeOrderPreparing,
  배송중: style.badgeOrderShipped,
  배송완료: style.badgeOrderDelivered,
  취소: style.badgeOrderCancelled,
  환불: style.badgeOrderRefunded,
};

function formatDisplaySku(value: string | undefined, rowIndex?: number): string {
  const s = value != null ? String(value).trim() : '';
  const isObjectId = /^[a-f0-9]{24}$/i.test(s);
  if (!s || isObjectId) {
    const num = (rowIndex ?? 0) + 1;
    return `SKU-${String(num).padStart(3, '0')}`;
  }
  return s.toUpperCase().startsWith('SKU-') ? s : `SKU-${s}`;
}

const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');
const ADMIN_PAGE_SIZE = 6;

export default function Admin() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | OrderStatusKo>('all');
  const [error, setError] = useState<string | null>(null);
  const [productPage, setProductPage] = useState(1);

  const [productModalOpen, setProductModalOpen] = useState<'create' | 'edit' | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [productSubmitLoading, setProductSubmitLoading] = useState(false);
  const [productFormError, setProductFormError] = useState<string | null>(null);

  const cloudinaryWidgetRef = useRef<{ open: () => void } | null>(null);
  const filteredOrders = orders.filter((o) =>
    orderStatusFilter === 'all' ? true : normalizeOrderStatus(o.status) === orderStatusFilter,
  );

  useEffect(() => {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET || cloudinaryWidgetRef.current) return;
    const initWidget = () => {
      if (typeof window.cloudinary?.createUploadWidget !== 'function') return;
      cloudinaryWidgetRef.current = window.cloudinary!.createUploadWidget(
        {
          cloudName: CLOUDINARY_CLOUD_NAME,
          uploadPreset: CLOUDINARY_UPLOAD_PRESET,
        },
        (error, result) => {
          if (error) return;
          if (result?.event === 'success' && result.info?.secure_url) {
            setProductForm((prev) => ({ ...prev, imageUrl: result.info!.secure_url }));
          }
        }
      );
    };
    if (window.cloudinary) {
      initWidget();
    } else {
      const id = setInterval(() => {
        if (window.cloudinary) {
          clearInterval(id);
          initWidget();
        }
      }, 100);
      return () => clearInterval(id);
    }
  }, []);

  const openCloudinaryWidget = () => {
    if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET && cloudinaryWidgetRef.current) {
      cloudinaryWidgetRef.current.open();
    }
  };

  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const handleChangeOrderStatus = async (orderId: string, nextStatus: OrderStatusKo) => {
    const token = localStorage.getItem('dasin_token');
    if (!token) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    const prevOrders = orders;
    setOrders((list) =>
      list.map((o) => (o._id === orderId ? { ...o, status: nextStatus } : o)),
    );
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOrders(prevOrders);
        toast.error(data?.error || '주문 상태 변경에 실패했습니다.');
        return;
      }
      const saved = normalizeOrderStatus(data?.status);
      setOrders((list) =>
        list.map((o) => (o._id === orderId ? { ...o, status: saved } : o)),
      );
      toast.success(`주문 상태가 '${saved}'(으)로 변경되었습니다.`);
    } catch {
      setOrders(prevOrders);
      toast.error('주문 상태 변경 중 오류가 발생했습니다.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const fetchProducts = () =>
    fetch(`${API_BASE}/api/products?limit=1000`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('상품 목록 조회 실패'))))
      .then((data: { products?: ProductItem[] } | ProductItem[]) => {
        const list = Array.isArray(data) ? data : (data.products ?? []);
        setProducts(list);
        setProductPage((p) => (p > 1 && (p - 1) * ADMIN_PAGE_SIZE >= list.length ? Math.max(1, Math.ceil(list.length / ADMIN_PAGE_SIZE)) : p));
      });

  useEffect(() => {
    if (activeTab === 'products' || activeTab === 'dashboard') {
      setLoadingProducts(true);
      setError(null);
      fetchProducts()
        .catch((err) => setError(err.message))
        .finally(() => setLoadingProducts(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'orders' || activeTab === 'dashboard') {
      setLoadingOrders(true);
      setError(null);
      const token = localStorage.getItem('dasin_token');
      const headers = token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined;

      const fetchOrders = async () => {
        try {
          const adminRes = await fetch(`${API_BASE}/api/orders/admin/all`, { headers });
          const adminData = await adminRes.json().catch(() => ({}));
          if (adminRes.ok) {
            setOrders(Array.isArray(adminData) ? adminData : []);
            return;
          }

          // 관리자 권한이 없거나 실패 시 내 주문 목록으로 fallback
          const myRes = await fetch(`${API_BASE}/api/orders`, { headers });
          const myData = await myRes.json().catch(() => ({}));
          if (!myRes.ok) {
            throw new Error(myData.error || adminData.error || `주문 목록 조회 실패 (${adminRes.status})`);
          }
          setOrders(Array.isArray(myData) ? myData : []);
        } catch (err) {
          setError(err instanceof Error ? err.message : '주문 목록 조회 실패');
        } finally {
          setLoadingOrders(false);
        }
      };

      fetchOrders();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'users' || activeTab === 'dashboard') {
      setLoadingUsers(true);
      setError(null);
      fetch(`${API_BASE}/api/users`)
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error('회원 목록 조회 실패'))))
        .then((data: UserItem[]) => setUsers(Array.isArray(data) ? data : []))
        .catch((err) => setError(err.message))
        .finally(() => setLoadingUsers(false));
    }
  }, [activeTab]);

  const openCreateProduct = () => {
    setProductForm(emptyProductForm);
    setProductFormError(null);
    setProductModalOpen('create');
    setEditingProduct(null);
  };

  const openEditProduct = async (p: ProductItem) => {
    setEditingProduct(p);
    setProductFormError(null);
    setProductModalOpen('edit');
    try {
      const res = await fetch(`${API_BASE}/api/products/${p._id}`);
      const data = await res.json().catch(() => ({}));
      const item = res.ok ? data : p;
      const opts = Array.isArray(item.options)
        ? item.options.map((o: { label?: string; choices?: string[] }) => ({
            label: typeof o?.label === 'string' ? o.label : '',
            choices: Array.isArray(o?.choices) ? [...o.choices] : [],
          }))
        : [];
      setProductForm({
        sku: (item.sku && String(item.sku).trim()) ? String(item.sku).trim() : (item._id ? `SKU-${item._id}` : ''),
        name: item.name ?? '',
        description: item.description ?? '',
        price: item.price ?? '',
        originalPrice: item.originalPrice ?? '',
        discountRate: item.discountRate ?? '',
        imageUrl: item.imageUrl ?? '',
        badge: item.badge ?? '',
        category: item.category ?? '닭가슴살',
        rank: item.rank ?? '',
        options: opts,
      });
    } catch {
      const opts = Array.isArray(p.options) ? p.options.map((o) => ({ label: o?.label ?? '', choices: Array.isArray(o?.choices) ? [...o.choices] : [] })) : [];
      setProductForm({
        sku: (p.sku && String(p.sku).trim()) ? String(p.sku).trim() : (p._id ? `SKU-${p._id}` : ''),
        name: p.name ?? '',
        description: p.description ?? '',
        price: p.price ?? '',
        originalPrice: p.originalPrice ?? '',
        discountRate: p.discountRate ?? '',
        imageUrl: p.imageUrl ?? '',
        badge: p.badge ?? '',
        category: p.category ?? '닭가슴살',
        rank: p.rank ?? '',
        options: opts,
      });
    }
  };

  const closeProductModal = () => {
    setProductModalOpen(null);
    setEditingProduct(null);
    setProductForm(emptyProductForm);
    setProductFormError(null);
  };

  const addOptionGroup = () => {
    setProductForm((f) => ({ ...f, options: [...(f.options || []), { label: '', choices: [''] }] }));
  };
  const removeOptionGroup = (groupIndex: number) => {
    setProductForm((f) => ({ ...f, options: (f.options || []).filter((_, i) => i !== groupIndex) }));
  };
  const setOptionGroupLabel = (groupIndex: number, label: string) => {
    setProductForm((f) => {
      const next = [...(f.options || [])];
      if (!next[groupIndex]) return f;
      next[groupIndex] = { ...next[groupIndex], label };
      return { ...f, options: next };
    });
  };
  const setOptionGroupChoices = (groupIndex: number, choices: string[]) => {
    setProductForm((f) => {
      const next = [...(f.options || [])];
      if (!next[groupIndex]) return f;
      next[groupIndex] = { ...next[groupIndex], choices };
      return { ...f, options: next };
    });
  };
  const addChoice = (groupIndex: number) => {
    setProductForm((f) => {
      const next = [...(f.options || [])];
      if (!next[groupIndex]) return f;
      next[groupIndex] = { ...next[groupIndex], choices: [...(next[groupIndex].choices || []), ''] };
      return { ...f, options: next };
    });
  };
  const removeChoice = (groupIndex: number, choiceIndex: number) => {
    setProductForm((f) => {
      const next = [...(f.options || [])];
      if (!next[groupIndex]) return f;
      const choices = (next[groupIndex].choices || []).filter((_, i) => i !== choiceIndex);
      next[groupIndex] = { ...next[groupIndex], choices };
      return { ...f, options: next };
    });
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductFormError(null);
    const skuTrim = String(productForm.sku).trim();
    const name = String(productForm.name).trim();
    const price = productForm.price === '' ? NaN : Number(productForm.price);
    if (!skuTrim) {
      setProductFormError('SKU(상품 ID)를 입력해 주세요.');
      return;
    }
    if (!name) {
      setProductFormError('상품명을 입력해 주세요.');
      return;
    }
    if (Number.isNaN(price) || price < 0) {
      setProductFormError('가격을 올바르게 입력해 주세요.');
      return;
    }
    setProductSubmitLoading(true);
    try {
      const optionsPayload = (productForm.options || []).map((o) => ({ label: String(o.label || '').trim(), choices: (o.choices || []).map((c) => String(c).trim()).filter(Boolean) })).filter((o) => o.label || o.choices.length > 0);
      const body = {
        sku: skuTrim,
        name: productForm.name.trim(),
        description: productForm.description || '',
        price: Number(productForm.price),
        originalPrice: productForm.originalPrice === '' ? undefined : Number(productForm.originalPrice),
        discountRate: productForm.discountRate === '' ? undefined : Number(productForm.discountRate),
        imageUrl: productForm.imageUrl || '',
        badge: productForm.badge || '',
        category: productForm.category || '닭가슴살',
        rank: productForm.rank === '' ? undefined : Number(productForm.rank),
        options: optionsPayload,
      };
      if (productModalOpen === 'create') {
        const res = await fetch(`${API_BASE}/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setProductFormError(data.error || '등록에 실패했습니다.');
          return;
        }
        await fetchProducts();
        closeProductModal();
      } else if (productModalOpen === 'edit' && editingProduct) {
        const url = `${API_BASE}/api/products/${editingProduct._id}`;
        const res = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setProductFormError(data.error || `수정에 실패했습니다. (${res.status})`);
          return;
        }
        await fetchProducts();
        closeProductModal();
      }
    } catch (err) {
      setProductFormError(err instanceof Error ? err.message : '요청 실패');
    } finally {
      setProductSubmitLoading(false);
    }
  };

  const handleDeleteProduct = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('이 상품을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || '삭제 실패');
        return;
      }
      await fetchProducts();
    } catch {
      alert('요청 실패');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('이 회원을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || '삭제 실패');
        return;
      }
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch {
      alert('요청 실패');
    }
  };

  return (
    <div className={style.adminPage}>
      <h1 className={style.adminPageTitle}>관리자</h1>

      <div className={style.tabs}>
        {TABS.map((tab) => (
          <button key={tab.id} type="button" className={activeTab === tab.id ? `${style.tab} ${style.tabActive}` : style.tab} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className={style.error}>{error}</div>}

      {activeTab === 'dashboard' && (
        <>
          <div className={style.dashboardGrid}>
            <div className={style.dashboardCard}>
              <div className={style.dashboardCardValue}>{loadingProducts ? '-' : products.length}</div>
              <div className={style.dashboardCardLabel}>등록 상품 수</div>
            </div>
            <div className={style.dashboardCard}>
              <div className={style.dashboardCardValue}>{loadingUsers ? '-' : users.length}</div>
              <div className={style.dashboardCardLabel}>가입 회원 수</div>
            </div>
            <div className={style.dashboardCard}>
              <div className={style.dashboardCardValue}>{loadingOrders ? '-' : orders.length}</div>
              <div className={style.dashboardCardLabel}>전체 주문 수</div>
            </div>
          </div>
          <p className={style.empty}>상품 관리·회원 관리는 위 탭에서 확인하세요.</p>
        </>
      )}

      {activeTab === 'products' && (
        <>
          <div className={style.productSectionHeader}>
            <h3 className={style.sectionTitle}>상품 목록</h3>
            <button type="button" className={style.btnPrimary} onClick={openCreateProduct}>
              상품 추가
            </button>
          </div>
          {loadingProducts ? (
            <p className={style.loading}>불러오는 중...</p>
          ) : !products.length ? (
            <p className={style.empty}>등록된 상품이 없습니다.</p>
          ) : (
            <>
            <div className={style.tableWrap}>
              <table className={style.table}>
                <thead>
                  <tr>
                    <th>상품 ID(SKU)</th>
                    <th>순위</th>
                    <th>이미지</th>
                    <th>상품명</th>
                    <th>원가 / 할인가</th>
                    <th>카테고리</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {products.slice((productPage - 1) * ADMIN_PAGE_SIZE, productPage * ADMIN_PAGE_SIZE).map((p, i) => (
                    <tr key={p._id} className={style.productRowClickable}>
                      <td className={style.skuCell}>{formatDisplaySku(p.sku ?? p._id, (productPage - 1) * ADMIN_PAGE_SIZE + i)}</td>
                      <td>{p.rank ?? (productPage - 1) * ADMIN_PAGE_SIZE + i + 1}</td>
                      <td>{p.imageUrl ? <img src={p.imageUrl} alt="" className={style.productImage} /> : <span style={{ color: '#999' }}>-</span>}</td>
                      <td className={style.productName}>{p.name}</td>
                      <td className={style.priceCell}>
                        {p.originalPrice != null && p.originalPrice > (p.price ?? 0) ? (
                          <>
                            <span className={style.priceOriginal}>{p.originalPrice?.toLocaleString()}원</span>
                            <strong className={style.priceSale}>{p.price?.toLocaleString()}원</strong>
                          </>
                        ) : (
                          <strong className={style.priceSale}>{p.price?.toLocaleString()}원</strong>
                        )}
                      </td>
                      <td>{p.category ?? '-'}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className={style.tableActions}>
                          <button
                            type="button"
                            className={style.btnSecondary}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditProduct(p);
                            }}
                          >
                            수정
                          </button>
                          <button type="button" className={style.btnDanger} onClick={(e) => handleDeleteProduct(e, p._id)}>
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {Math.ceil(products.length / ADMIN_PAGE_SIZE) > 0 && (
              <nav className={style.pagination} aria-label="상품 목록 페이지">
                <button
                  type="button"
                  className={style.paginationBtn}
                  disabled={productPage <= 1}
                  onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                >
                  이전
                </button>
                <span className={style.paginationInfo}>
                  {productPage} / {Math.ceil(products.length / ADMIN_PAGE_SIZE)}
                </span>
                <button
                  type="button"
                  className={style.paginationBtn}
                  disabled={productPage >= Math.ceil(products.length / ADMIN_PAGE_SIZE)}
                  onClick={() => setProductPage((p) => Math.min(Math.ceil(products.length / ADMIN_PAGE_SIZE), p + 1))}
                >
                  다음
                </button>
              </nav>
            )}
            </>
          )}
        </>
      )}

      {activeTab === 'users' && (
        <>
          <h3 className={style.sectionTitle}>회원 목록</h3>
          {loadingUsers ? (
            <p className={style.loading}>불러오는 중...</p>
          ) : !users.length ? (
            <p className={style.empty}>등록된 회원이 없습니다.</p>
          ) : (
            <div className={style.tableWrap}>
              <table className={style.table}>
                <thead>
                  <tr>
                    <th>이메일</th>
                    <th>이름</th>
                    <th>구분</th>
                    <th>가입일</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td>{u.email}</td>
                      <td>{u.name}</td>
                      <td>
                        <span className={u.user_type === 'admin' ? `${style.badge} ${style.badgeAdmin}` : `${style.badge} ${style.badgeCustomer}`}>{u.user_type === 'admin' ? '관리자' : '일반'}</span>
                      </td>
                      <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('ko-KR') : '-'}</td>
                      <td>
                        <button type="button" className={style.btnDanger} onClick={() => handleDeleteUser(u._id)}>
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === 'orders' && (
        <>
          <div className={style.productSectionHeader}>
            <h3 className={style.sectionTitle}>주문 목록</h3>
            <select
              className={style.orderFilterSelect}
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value as 'all' | OrderStatusKo)}
            >
              <option value="all">전체 상태</option>
              {ORDER_STATUS_VALUES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {loadingOrders ? (
            <p className={style.loading}>불러오는 중...</p>
          ) : !filteredOrders.length ? (
            <p className={style.empty}>조건에 맞는 주문이 없습니다.</p>
          ) : (
            <div className={style.tableWrap}>
              <table className={style.table}>
                <thead>
                  <tr>
                    <th>주문번호</th>
                    <th>주문자</th>
                    <th>연락처</th>
                    <th>결제금액</th>
                    <th>상태</th>
                    <th>상태 변경</th>
                    <th>주문일</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((o) => {
                    const current = normalizeOrderStatus(o.status);
                    const isLocked = current === '취소' || current === '환불';
                    return (
                      <tr key={o._id}>
                        <td>{o._id.slice(-8).toUpperCase()}</td>
                        <td>{o.orderer?.name || o.user?.name || '-'}</td>
                        <td>{o.orderer?.phone || '-'}</td>
                        <td>{typeof o.finalPrice === 'number' ? `${o.finalPrice.toLocaleString()}원` : '-'}</td>
                        <td>
                          <span
                            className={`${style.badge} ${ORDER_BADGE_BY_STATUS[current] || ''}`}
                          >
                            {current}
                          </span>
                        </td>
                        <td>
                          <select
                            className={style.orderStatusSelect}
                            value={current}
                            disabled={isLocked || updatingOrderId === o._id}
                            onChange={(e) =>
                              handleChangeOrderStatus(o._id, e.target.value as OrderStatusKo)
                            }
                          >
                            {ORDER_STATUS_VALUES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>{o.createdAt ? new Date(o.createdAt).toLocaleString('ko-KR') : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {productModalOpen && (
        <div className={style.modalOverlay} onClick={closeProductModal} role="presentation">
          <div className={style.modal} onClick={(e) => e.stopPropagation()} role="dialog">
            <div className={style.modalHeader}>
              <h2 className={style.modalTitle}>{productModalOpen === 'create' ? '새 상품 등록' : '상품 수정'}</h2>
              <button type="button" className={style.modalClose} onClick={closeProductModal} aria-label="닫기">
                ×
              </button>
            </div>
            <form onSubmit={handleProductSubmit}>
              <div className={style.formGrid}>
                {productFormError && <div className={style.error}>{productFormError}</div>}

                <div className={style.formRow}>
                  <label htmlFor="product-sku">상품 ID (SKU) *</label>
                  <input
                    id="product-sku"
                    value={productForm.sku}
                    onChange={(e) => setProductForm((f) => ({ ...f, sku: e.target.value }))}
                    placeholder="예: DASHIN-001"
                    required
                  />
                </div>

                <div className={style.formRowPair}>
                  <div className={style.formRow}>
                    <label htmlFor="product-name">상품명 *</label>
                    <input id="product-name" value={productForm.name} onChange={(e) => setProductForm((f) => ({ ...f, name: e.target.value }))} placeholder="상품명 입력" required />
                  </div>
                  <div className={style.formRow}>
                    <label htmlFor="product-price">가격(원) *</label>
                    <input id="product-price" type="number" min={0} value={productForm.price === '' ? '' : productForm.price} onChange={(e) => setProductForm((f) => ({ ...f, price: e.target.value === '' ? '' : Number(e.target.value) }))} placeholder="0" required />
                  </div>
                </div>

                <div className={style.formRow}>
                  <label htmlFor="product-desc">설명</label>
                  <textarea id="product-desc" value={productForm.description} onChange={(e) => setProductForm((f) => ({ ...f, description: e.target.value }))} placeholder="설명" />
                </div>

                <div className={style.formRowPair}>
                  <div className={style.formRow}>
                    <label htmlFor="product-original">정가(원)</label>
                    <input id="product-original" type="number" min={0} value={productForm.originalPrice === '' ? '' : productForm.originalPrice} onChange={(e) => setProductForm((f) => ({ ...f, originalPrice: e.target.value === '' ? '' : Number(e.target.value) }))} placeholder="0" />
                  </div>
                  <div className={style.formRow}>
                    <label htmlFor="product-discount">할인율(%)</label>
                    <input id="product-discount" type="number" min={0} max={100} value={productForm.discountRate === '' ? '' : productForm.discountRate} onChange={(e) => setProductForm((f) => ({ ...f, discountRate: e.target.value === '' ? '' : Number(e.target.value) }))} placeholder="0" />
                  </div>
                </div>

                <div className={`${style.formRow} ${style.formImageWrap}`}>
                  <label>이미지</label>
                  {CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET ? (
                    <div
                      className={style.cloudinaryUploadZone}
                      onClick={openCloudinaryWidget}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openCloudinaryWidget();
                        }
                      }}
                    >
                      <div className={style.uploadZoneInner}>
                        <span className={style.uploadCloudIcon} aria-hidden>
                          ☁
                        </span>
                        <p className={style.uploadZoneText}>파일을 여기에 드래그하거나</p>
                        <p className={style.uploadZoneOr}>또는</p>
                        <button
                          type="button"
                          className={style.btnBrowse}
                          onClick={(e) => {
                            e.stopPropagation();
                            openCloudinaryWidget();
                          }}
                        >
                          Browse
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className={style.uploadZoneHint}>Cloudinary를 사용하려면 .env에 VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_UPLOAD_PRESET을 설정하세요.</p>
                  )}
                  <input id="product-image" type="url" value={productForm.imageUrl} onChange={(e) => setProductForm((f) => ({ ...f, imageUrl: e.target.value }))} placeholder="이미지 URL 직접 입력" className={style.formImageUrlInput} />
                  {productForm.imageUrl ? (
                    <img
                      src={productForm.imageUrl}
                      alt=""
                      className={style.formImagePreview}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : null}
                </div>

                <div className={style.formRowPair}>
                  <div className={style.formRow}>
                    <label htmlFor="product-badge">배지</label>
                    <input id="product-badge" value={productForm.badge} onChange={(e) => setProductForm((f) => ({ ...f, badge: e.target.value }))} placeholder="예: 식단대전" />
                  </div>
                  <div className={style.formRow}>
                    <label htmlFor="product-category">카테고리</label>
                    <select id="product-category" value={productForm.category} onChange={(e) => setProductForm((f) => ({ ...f, category: e.target.value }))}>
                      <option value="닭가슴살">닭가슴살</option>
                      <option value="현미밥">현미밥</option>
                      <option value="김밥">김밥</option>
                      <option value="주먹밥">주먹밥</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>
                </div>

                <div className={style.formRow}>
                  <label htmlFor="product-rank">순위</label>
                  <input id="product-rank" type="number" min={1} value={productForm.rank === '' ? '' : productForm.rank} onChange={(e) => setProductForm((f) => ({ ...f, rank: e.target.value === '' ? '' : Number(e.target.value) }))} placeholder="1" />
                </div>

                <div className={style.formRow}>
                  <div className={style.optionSectionHeader}>
                    <label>상품 옵션 (필수옵션 등)</label>
                    <button type="button" className={style.btnSecondary} onClick={addOptionGroup}>
                      옵션 그룹 추가
                    </button>
                  </div>
                  {(productForm.options || []).map((group, gi) => (
                    <div key={gi} className={style.optionGroup}>
                      <div className={style.optionGroupHead}>
                        <input
                          type="text"
                          value={group.label}
                          onChange={(e) => setOptionGroupLabel(gi, e.target.value)}
                          placeholder="예: [필수옵션1] 15+15 특가"
                          className={style.optionLabelInput}
                        />
                        <button type="button" className={style.btnDanger} onClick={() => removeOptionGroup(gi)} aria-label="이 옵션 그룹 삭제">
                          그룹 삭제
                        </button>
                      </div>
                      <div className={style.choicesList}>
                        {(group.choices || []).map((choice, ci) => (
                          <div key={ci} className={style.choiceRow}>
                            <input
                              type="text"
                              value={choice}
                              onChange={(e) => {
                                const next = [...(group.choices || [])];
                                next[ci] = e.target.value;
                                setOptionGroupChoices(gi, next);
                              }}
                              placeholder="선택지"
                              className={style.choiceInput}
                            />
                            <button type="button" className={style.btnSecondary} onClick={() => removeChoice(gi, ci)} aria-label="선택지 삭제">
                              삭제
                            </button>
                          </div>
                        ))}
                        <button type="button" className={style.btnSecondary} onClick={() => addChoice(gi)}>
                          선택지 추가
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={style.modalFooter}>
                <button type="submit" className={style.modalSubmit} disabled={productSubmitLoading}>
                  {productSubmitLoading ? '저장 중...' : productModalOpen === 'create' ? '등록' : '수정'}
                </button>
                <button type="button" className={style.btnSecondary} onClick={closeProductModal}>
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
