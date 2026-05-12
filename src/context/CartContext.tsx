import { createContext, useContext, useCallback, useMemo, useState, useEffect, type ReactNode } from 'react';
import toast from 'react-hot-toast';

export interface CartItem {
  _id: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  selectedOptions?: string[];
}

const BASE_STORAGE_KEY = 'dasin_cart';
const API_BASE = import.meta.env.VITE_API_BASE;

interface CartContextValue {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'> | CartItem) => void;
  removeFromCart: (productId: string, selectedOptions?: string[]) => void;
  updateQuantity: (productId: string, quantity: number, selectedOptions?: string[]) => void;
  totalCount: number;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function getUserCartKey() {
  try {
    const rawUser = localStorage.getItem('dasin_user');
    if (!rawUser) return BASE_STORAGE_KEY;
    const parsed = JSON.parse(rawUser);
    const idOrEmail = parsed?.id || parsed?._id || parsed?.email || parsed?.name;
    if (!idOrEmail) return BASE_STORAGE_KEY;
    return `${BASE_STORAGE_KEY}:${String(idOrEmail)}`;
  } catch {
    return BASE_STORAGE_KEY;
  }
}

function loadCart(): CartItem[] {
  try {
    const token = localStorage.getItem('dasin_token');
    // 비로그인 상태에서는 장바구니를 비워둔다.
    if (!token) return [];

    const key = getUserCartKey();
    const raw = localStorage.getItem(key);

    // 1) 유저별 장바구니가 이미 있으면 그대로 사용
    if (raw) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }

    // 2) 아직 유저별 장바구니가 없고, 예전 공용 장바구니가 있다면
    //    로그인한 유저의 첫 장바구니로 "승계"해 준다.
    if (key !== BASE_STORAGE_KEY) {
      const guestRaw = localStorage.getItem(BASE_STORAGE_KEY);
      if (guestRaw) {
        const guestParsed = JSON.parse(guestRaw);
        const guestItems = Array.isArray(guestParsed) ? guestParsed : [];
        if (guestItems.length > 0) {
          localStorage.setItem(key, JSON.stringify(guestItems));
          localStorage.removeItem(BASE_STORAGE_KEY);
          return guestItems;
        }
      }
    }

    return [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  try {
    const token = localStorage.getItem('dasin_token');
    // 비로그인 상태에서는 장바구니를 저장하지 않는다.
    if (!token) return;

    const key = getUserCartKey();
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  // 로그인 유저가 바뀐 경우를 대비해 키가 바뀌면 장바구니 다시 로드
  useEffect(() => {
    setItems(loadCart());
  }, []);

  // 로그인 후 서버 장바구니를 불러와 localStorage/상태에 동기화
  useEffect(() => {
    const token = localStorage.getItem('dasin_token');
    if (!token || !API_BASE) return;

    const fetchServerCart = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/cart`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (!data || !Array.isArray(data.items)) return;

        const serverItems: CartItem[] = data.items
          .map((it: any) => {
            const product = it?.product;
            if (!product || !product._id || product.price == null) return null;
            return {
              _id: String(product._id),
              name: String(product.name ?? ''),
              price: Number(product.price),
              imageUrl: product.imageUrl ? String(product.imageUrl) : undefined,
              quantity: Number(it.quantity ?? 1) || 1,
              selectedOptions: Array.isArray(it.selectedOptions)
                ? it.selectedOptions.map((o: unknown) => String(o))
                : undefined,
            } as CartItem;
          })
          .filter((v: CartItem | null): v is CartItem => v !== null);

        // 현재 로컬(유저별) 장바구니
        const key = getUserCartKey();
        let localItems: CartItem[] = [];
        try {
          const localRaw = localStorage.getItem(key);
          if (localRaw) {
            const parsed = JSON.parse(localRaw);
            if (Array.isArray(parsed)) {
              localItems = parsed;
            }
          }
        } catch {
          // ignore
        }

        if (serverItems.length > 0) {
          // 서버에 장바구니가 있으면 그것을 우선 사용
          setItems(serverItems);
          return;
        }

        // 서버가 비어 있고, 로컬(유저별) 장바구니가 있다면
        // 로컬을 기준으로 서버 장바구니를 초기화
        if (localItems.length > 0) {
          for (const it of localItems) {
            const body = {
              productId: it._id,
              quantity: it.quantity ?? 1,
              ...(it.selectedOptions && it.selectedOptions.length
                ? { selectedOptions: it.selectedOptions }
                : {}),
            };
            fetch(`${API_BASE}/api/cart`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(body),
            }).catch(() => {
              // ignore
            });
          }
          // 상태는 이미 loadCart()로 로컬 값을 들고 있으므로 그대로 둔다.
        }
      } catch {
        // ignore
      }
    };

    fetchServerCart();
  }, []);

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'> | CartItem) => {
    const token = localStorage.getItem('dasin_token');
    // 비로그인 상태에서는 장바구니를 사용할 수 없음
    if (!token) {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('로그인 후 장바구니를 사용할 수 있습니다.');
      }
      return;
    }

    const quantity = 'quantity' in item ? item.quantity : 1;
    const selectedOptions = 'selectedOptions' in item ? item.selectedOptions : undefined;

    setItems((prev) => {
      const existing = prev.find(
        (i) =>
          i._id === item._id &&
          JSON.stringify(i.selectedOptions ?? []) === JSON.stringify(selectedOptions ?? [])
      );
      if (existing) {
        return prev.map((i) =>
          i._id === item._id
            ? { ...i, quantity: i.quantity + quantity, ...(selectedOptions !== undefined ? { selectedOptions } : {}) }
            : i
        );
      }
      return [...prev, { ...item, quantity, ...(selectedOptions !== undefined ? { selectedOptions } : {}) }];
    });

    toast.success('아이템이 카트에 담겼습니다.');

    // 로그인된 경우 서버 장바구니에도 반영
    if (API_BASE) {
      const body = {
        productId: item._id,
        quantity,
        ...(selectedOptions && selectedOptions.length ? { selectedOptions } : {}),
      };
      fetch(`${API_BASE}/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      }).catch(() => {
        // ignore
      });
    }
  }, []);

  const removeFromCart = useCallback((productId: string, selectedOptions?: string[]) => {
    const token = localStorage.getItem('dasin_token');
    if (!token) {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('로그인 후 장바구니를 사용할 수 있습니다.');
      }
      return;
    }

    setItems((prev) =>
      prev.filter(
        (i) =>
          !(
            i._id === productId &&
            JSON.stringify(i.selectedOptions ?? []) === JSON.stringify(selectedOptions ?? [])
          )
      )
    );

    if (API_BASE) {
      const body = {
        productId,
        ...(selectedOptions && selectedOptions.length ? { selectedOptions } : {}),
      };
      fetch(`${API_BASE}/api/cart`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      }).catch(() => {
        // ignore
      });
    }
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, selectedOptions?: string[]) => {
    const token = localStorage.getItem('dasin_token');
    if (!token) {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('로그인 후 장바구니를 사용할 수 있습니다.');
      }
      return;
    }

    if (quantity < 1) {
      // 0 이하가 되면 장바구니에서 제거
      setItems((prev) =>
        prev.filter(
          (i) =>
            !(
              i._id === productId &&
              JSON.stringify(i.selectedOptions ?? []) === JSON.stringify(selectedOptions ?? [])
            )
        )
      );

      if (API_BASE) {
        const body = {
          productId,
          ...(selectedOptions && selectedOptions.length ? { selectedOptions } : {}),
        };
        fetch(`${API_BASE}/api/cart`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }).catch(() => {
          // ignore
        });
      }

      return;
    }

    setItems((prev) =>
      prev.map((i) =>
        i._id === productId &&
        JSON.stringify(i.selectedOptions ?? []) === JSON.stringify(selectedOptions ?? [])
          ? { ...i, quantity }
          : i
      )
    );

    if (API_BASE) {
      const body = {
        productId,
        quantity,
        ...(selectedOptions && selectedOptions.length ? { selectedOptions } : {}),
      };
      fetch(`${API_BASE}/api/cart`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      }).catch(() => {
        // ignore
      });
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    try {
      const key = getUserCartKey();
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }, []);

  const totalCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({ items, addToCart, removeFromCart, updateQuantity, totalCount, clearCart }),
    [items, addToCart, removeFromCart, updateQuantity, totalCount, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
