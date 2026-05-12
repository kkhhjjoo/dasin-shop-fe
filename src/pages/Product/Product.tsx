import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import style from './Product.module.css';

const API_BASE = import.meta.env.VITE_API_BASE;

type SortType = 'rank' | 'newest' | 'price';

interface ProductItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  discountRate?: number;
  imageUrl?: string;
  badge?: string;
  category?: string;
  rank?: number;
}

const SORT_OPTIONS: { value: SortType; label: string }[] = [
  { value: 'rank', label: '인기순' },
  { value: 'newest', label: '등록순' },
  { value: 'price', label: '낮은가격순' },
];

const LIMIT = 6;

const Product = () => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [allProducts, setAllProducts] = useState<ProductItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortType>('rank');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; totalPages: number } | null>(null);
  const navigate = useNavigate();
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        params.set('sort', sort);
        params.set('page', String(page));
        params.set('limit', String(LIMIT));
        if (sort === 'price') params.set('order', 'asc');
        const res = await fetch(`${API_BASE}/api/products?${params}`);
        if (!res.ok) throw new Error('상품 목록을 불러오지 못했습니다.');
        const data = await res.json();
        const list = data.products ?? (Array.isArray(data) ? data : []);
        if (data.pagination) {
          setAllProducts(null);
          setProducts(list);
          setPagination(data.pagination);
        } else {
          setAllProducts(list);
          setPage(1);
          setProducts(list.slice(0, LIMIT));
          setPagination(list.length > 0 ? { page: 1, limit: LIMIT, total: list.length, totalPages: Math.ceil(list.length / LIMIT) } : null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    if (allProducts !== null) return;
    fetchProducts();
  }, [sort, page]);

  useEffect(() => {
    if (allProducts !== null && allProducts.length > 0) {
      setProducts(allProducts.slice((page - 1) * LIMIT, page * LIMIT));
      setPagination({ page, limit: LIMIT, total: allProducts.length, totalPages: Math.ceil(allProducts.length / LIMIT) });
    }
  }, [allProducts, page]);

  const handleSort = (value: SortType) => {
    setSort(value);
    setPage(1);
    setAllProducts(null);
  };

  if (loading && products.length === 0) {
    return (
      <div className={style.productPage}>
        <p className={style.productPageLoading}>상품을 불러오는 중...</p>
      </div>
    );
  }
  if (error && products.length === 0) {
    return (
      <div className={style.productPage}>
        <p className={style.productPageError}>{error}</p>
      </div>
    );
  }

  return (
    <div className={style.productPage}>
      <div className={style.productPageHeader}>
        <div className={style.productPageSort}>
          {SORT_OPTIONS.map((opt, i) => (
            <span key={opt.value}>
              {i > 0 && <span> | </span>}
              <button type="button" onClick={() => handleSort(opt.value)} data-active={sort === opt.value}>
                {opt.label}
              </button>
            </span>
          ))}
        </div>
      </div>

      {!products.length ? (
        <p className={style.productPageEmpty}>등록된 상품이 없습니다.</p>
      ) : (
        <>
        <ul className={style.productPageList}>
          {products.map((product) => (
            <li
              key={product._id}
              className={style.productCard}
              onClick={() => navigate(`/detail/${product._id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/detail/${product._id}`);
                }
              }}
            >
              <div className={style.productCardImageWrap}>
                {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className={style.productCardImage} /> : <div className={style.productCardImage} style={{ background: '#eee' }} />}
                {product.badge && <span className={style.productCardBadge}>{product.badge}</span>}
                <button
                  type="button"
                  className={style.productCardCartBtn}
                  aria-label="장바구니 담기"
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart({
                      _id: product._id,
                      name: product.name,
                      price: product.price,
                      imageUrl: product.imageUrl,
                    });
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                </button>
              </div>
              <div className={style.productCardBody}>
                <h3 className={style.productCardTitle}>{product.name}</h3>
                <div className={style.productCardPriceRow}>
                  {product.originalPrice != null && product.originalPrice > product.price && (
                    <span className={style.productCardOriginalPrice}>{product.originalPrice.toLocaleString()}원</span>
                  )}
                  <span className={style.productCardPrice}>{product.price.toLocaleString()}원</span>
                  {(product.discountRate != null && product.discountRate > 0) ||
                  (product.originalPrice != null && product.originalPrice > product.price) ? (
                    <span className={style.productCardDiscount}>
                      {product.discountRate != null && product.discountRate > 0
                        ? `${product.discountRate}%`
                        : `${Math.round((1 - product.price / product.originalPrice!) * 100)}%`}
                    </span>
                  ) : null}
                </div>
                {product.description && <p className={style.productCardDesc}>{product.description}</p>}
                <div className={style.productCardFooter}>
                  <span className={style.productCardReviews}>리뷰: -</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {pagination && (
          <nav className={style.pagination} aria-label="페이지 네비게이션">
            <button
              type="button"
              className={style.paginationBtn}
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              이전
            </button>
            <span className={style.paginationInfo}>
              {page} / {pagination.totalPages}
            </span>
            <button
              type="button"
              className={style.paginationBtn}
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            >
              다음
            </button>
          </nav>
        )}
        </>
      )}
    </div>
  );
};

export default Product;
