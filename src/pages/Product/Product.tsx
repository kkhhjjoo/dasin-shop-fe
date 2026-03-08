import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

const Product = () => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortType>('rank');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        params.set('sort', sort);
        if (sort === 'price') params.set('order', 'asc');
        const res = await fetch(`${API_BASE}/api/products?${params}`);
        if (!res.ok) throw new Error('상품 목록을 불러오지 못했습니다.');
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [sort]);

  const handleSort = (value: SortType) => setSort(value);

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
        <ul className={style.productPageList}>
          {products.map((product, index) => (
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
                <button type="button" className={style.productCardCartBtn} aria-label="장바구니 담기" onClick={(e) => e.stopPropagation()}>
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
                  <span className={style.productCardPrice}>{product.price.toLocaleString()}원</span>
                  {product.originalPrice != null && product.originalPrice > product.price && <span className={style.productCardOriginalPrice}>{product.originalPrice.toLocaleString()}원</span>}
                  {product.discountRate != null && product.discountRate > 0 && <span className={style.productCardDiscount}>{product.discountRate}%</span>}
                </div>
                {product.description && <p className={style.productCardDesc}>{product.description}</p>}
                <div className={style.productCardFooter}>
                  <span className={style.productCardReviews}>리뷰: -</span>
                  <button type="button" className={style.productCardDelivery}>
                    다신배송
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Product;
