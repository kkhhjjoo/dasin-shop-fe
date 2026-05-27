import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import ProductOptions from '../product-option/ProductOptions';
import DeliveryInfo from '../DeliveryInfo';
import ProductTabs from '../product-tabs/ProductTabs';
import styles from './product-detail.module.css';

interface ProductOptionGroup {
  label?: string;
  choices?: string[];
}

interface ProductDetailItem {
  _id: string;
  sku?: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  discountRate?: number;
  imageUrl?: string;
  badge?: string;
  options?: ProductOptionGroup[];
  variants?: { name?: string }[] | string[];
}
const API_BASE = import.meta.env.VITE_API_BASE || '';
export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [optionValues, setOptionValues] = useState<string[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [product, setProduct] = useState<ProductDetailItem | null>(null);
  const { addToCart } = useCart();

  const buildSelectedOptions = (): string[] => {
    if (optionGroups.length === 0) return [];
    return optionValues.map((v, i) => (optionGroups[i]?.label ? `${optionGroups[i].label}: ${v}` : v).trim()).filter(Boolean);
  };

  const handleAddToCart = () => {
    if (!product) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('dasin_token') : null;
    if (!token) {
      alert('로그인 후 장바구니를 사용할 수 있습니다.');
      navigate('/login');
      return;
    }
    if (hasOptionGroups && !allOptionsSelected) {
      alert('옵션을 모두 선택해 주세요.');
      return;
    }
    const opts = buildSelectedOptions();
    addToCart({
      _id: product._id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity: Math.max(1, quantity),
      ...(opts.length > 0 ? { selectedOptions: opts } : {}),
    });
  };

  const handleBuyNow = () => {
    if (!product) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('dasin_token') : null;
    if (!token) {
      alert('로그인 후 구매할 수 있습니다.');
      navigate('/login');
      return;
    }
    if (hasOptionGroups && !allOptionsSelected) {
      alert('옵션을 모두 선택해 주세요.');
      return;
    }
    const qty = Math.max(1, quantity);
    const selectedOptions = buildSelectedOptions();
    navigate('/order', {
      state: {
        buyNow: {
          _id: product._id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          quantity: qty,
          ...(selectedOptions.length > 0 ? { selectedOptions } : {}),
        },
      },
    });
  };

  const rawOptions = product?.options;
  const optionGroups = (() => {
    const fromOptions = (): { label: string; choices: string[] }[] => {
      if (!Array.isArray(rawOptions)) return [];
      return rawOptions
        .map((o) => ({
          label: typeof (o && (o as { label?: unknown }).label) === 'string' ? (o as { label: string }).label.trim() : '',
          choices: Array.isArray((o as { choices?: unknown })?.choices) ? (o as { choices: string[] }).choices.map((c) => String(c)) : [],
        }))
        .filter((g) => g.label.length > 0 || g.choices.length > 0);
    };
    let groups = fromOptions();
    if (groups.length > 0) return groups;
    const vars = product?.variants;
    if (!Array.isArray(vars) || vars.length === 0) return [];
    const choices = vars.map((v) => (v != null && typeof v === 'object' && 'name' in v ? String((v as { name?: string }).name ?? '') : String(v)).trim()).filter(Boolean);
    if (choices.length === 0) return [];
    return [{ label: '옵션', choices }];
  })();

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/products/${id}`);
        if (!res.ok) {
          throw new Error('상품 정보를 불러오지 못했습니다.');
        }
        const data = await res.json();
        setProduct(data);
        setQuantity(1);
        const opts = Array.isArray(data.options) && data.options.length > 0 ? data.options : [];
        const groupsCount = opts.length > 0 ? opts.length : Array.isArray(data.variants) && data.variants.length > 0 ? 1 : 0;
        setOptionValues(Array(groupsCount).fill(''));
      } catch (err) {
        console.error(err);
      } finally {
        // ignore
      }
    };
    fetchProduct();
  }, [id]);

  const imageSrc = product?.imageUrl || '/15+15.png';
  const title = product?.name || '[15+15 특가] 닭신 오븐구이 닭안심살 7종 골라담기';
  const salePrice = product?.price ?? 0;
  const originalPrice = product?.originalPrice;
  const discountRate = product?.discountRate ?? (originalPrice != null && originalPrice > 0 ? Math.round((1 - salePrice / originalPrice) * 100) : undefined);

  const hasOptionGroups = optionGroups.length > 0;
  const allOptionsSelected = !hasOptionGroups || optionValues.slice(0, optionGroups.length).every((v) => typeof v === 'string' && v.trim().length > 0);
  const totalPrice = product && allOptionsSelected ? product.price * Math.max(1, quantity) : 0;

  return (
    <div className={styles.productDetail}>
      <div className="container">
        <p className={styles.breadcrumb}>
          <a href="#">닭가슴살·치킨</a>
        </p>

        <div className={styles.productLayout}>
          <div className={styles.productGallery}>
            <div className={styles.productImagePlaceholder}>
              <img width={400} height={400} src={imageSrc} alt={title} />
            </div>
          </div>

          <div className={styles.productInfo}>
            <span className={styles.badgeFreeShip}>무료배송</span>
            <h1 className={styles.productTitle}>{title}</h1>
            <p className={styles.productSubtitle}>{product?.description || '(1팩 1,980원) 스팀오븐으로 구운 쫄깃하고 촉촉한 특수부위 닭안심살'}</p>

            <div className={styles.productPriceWrap}>
              <span className={styles.label}>판매가격</span>
              <div className={styles.priceRow}>
                {originalPrice != null && originalPrice > salePrice && <span className={styles.priceOriginal}>{originalPrice.toLocaleString()}원</span>}
                <strong className={styles.priceSale}>{salePrice.toLocaleString()}원</strong>
                {(discountRate != null && discountRate > 0) || (originalPrice != null && originalPrice > salePrice) ? <span className={styles.discountRate}>{discountRate != null && discountRate > 0 ? `${discountRate}%` : `${Math.round((1 - salePrice / originalPrice!) * 100)}%`}</span> : null}
              </div>
            </div>

            <div className={styles.productMeta}>
              <p>적립금 예상적립금 0원 (실 결제금액의 1%) 로그인, 옵션 선택 후 적립금 확인 가능합니다.</p>
              <p>
                <strong>배송정보</strong> 묶음배송 (무료) · 다신배송_냉동 · 롯데택배
              </p>
            </div>

            {optionGroups.length > 0 &&
              optionGroups.map((group, i) => (
                <ProductOptions
                  key={i}
                  label={group.label || `옵션 ${i + 1}`}
                  options={group.choices?.length ? group.choices : []}
                  value={optionValues[i] ?? ''}
                  onChange={(v) =>
                    setOptionValues((prev) => {
                      const next = [...prev];
                      next[i] = v;
                      return next;
                    })
                  }
                />
              ))}

            <div className={styles.productTotal}>
              <div className={styles.quantityRow}>
                <span>수량</span>
                <div className={styles.quantityControls}>
                  <button type="button" className={styles.quantityBtn} onClick={() => setQuantity((prev) => Math.max(1, prev - 1))} aria-label="수량 줄이기">
                    −
                  </button>
                  <span className={styles.quantityValue}>{quantity}</span>
                  <button type="button" className={styles.quantityBtn} onClick={() => setQuantity((prev) => prev + 1)} aria-label="수량 늘리기">
                    +
                  </button>
                </div>
              </div>
              <div className={styles.totalPriceRow}>
                <span>총 상품금액</span>
                <strong>{totalPrice > 0 ? `${totalPrice.toLocaleString()}원` : '0원'}</strong>
              </div>
            </div>

            <div className={styles.productActions}>
              <button type="button" className={styles.btnCart} onClick={handleAddToCart}>
                장바구니 담기
              </button>
              <button type="button" className={styles.btnBuy} onClick={handleBuyNow}>
                구매하기
              </button>
            </div>

            <DeliveryInfo />
          </div>
        </div>

        <ProductTabs />
      </div>
    </div>
  );
}
