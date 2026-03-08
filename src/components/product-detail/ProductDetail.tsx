import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ProductOptions from '../product-option/ProductOptions';
import DeliveryInfo from '../DeliveryInfo';
import ProductTabs from '../product-tabs/ProductTabs';

import styles from './product-detail.module.css';

const FLAVORS = ['★혼합 7종 15팩★', '오리지널 15팩', '청양바베큐 15팩', '탄두리 15팩', '마살라커리 15팩', '불닭 15팩', '닭갈비 15팩', '안동찜닭 15팩'];

interface ProductDetailItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  discountRate?: number;
  imageUrl?: string;
  badge?: string;
}
const API_BASE = import.meta.env.VITE_API_BASE;
export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [option1, setOption1] = useState('');
  const [option2, setOption2] = useState('');
  const [product, setProduct] = useState<ProductDetailItem | null>(null);
  const totalPrice = 0; // 옵션 선택 시 계산

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
                <strong className={styles.priceSale}>{salePrice.toLocaleString()}원</strong>
                {originalPrice != null && originalPrice > salePrice && <span className={styles.priceOriginal}>{originalPrice.toLocaleString()}원</span>}
                {discountRate != null && discountRate > 0 && <span className={styles.discountRate}>{discountRate}%</span>}
              </div>
            </div>

            <div className={styles.productMeta}>
              <p>적립금 예상적립금 0원 (실 결제금액의 1%) 로그인, 옵션 선택 후 적립금 확인 가능합니다.</p>
              <p>
                <strong>배송정보</strong> 묶음배송 (무료) · 다신배송_냉동 · 롯데택배
              </p>
            </div>

            <ProductOptions label="[필수옵션1] 15+15 특가" options={FLAVORS} value={option1} onChange={setOption1} />
            <ProductOptions label="[필수옵션2] 15+15 특가" options={FLAVORS} value={option2} onChange={setOption2} />

            <div className={styles.productTotal}>
              <span>총 상품금액</span>
              <strong>{totalPrice > 0 ? `${totalPrice.toLocaleString()}원` : '0원'}</strong>
            </div>

            <div className={styles.productActions}>
              <button type="button" className={styles.btnCart}>
                장바구니 담기
              </button>
              <button type="button" className={styles.btnBuy}>
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
