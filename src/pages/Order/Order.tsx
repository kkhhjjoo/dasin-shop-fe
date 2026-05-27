import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCart, type CartItem } from '../../context/CartContext';
import style from './Order.module.css';
const API_BASE = import.meta.env.VITE_API_BASE || '';

interface BuyNowState {
  buyNow?: CartItem;
}

interface ImpResponse {
  success: boolean;
  imp_uid: string;
  merchant_uid: string;
  error_msg?: string;
}

declare global {
  interface Window {
    IMP: {
      init: (merchantId: string) => void;
      request_pay: (params: object, callback: (response: ImpResponse) => void) => void;
    };
  }
}

const PROVINCES = ['서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시', '대전광역시', '울산광역시', '세종특별자치시', '경기도', '강원특별자치도', '충청북도', '충청남도', '전북특별자치도', '전라남도', '경상북도', '경상남도', '제주특별자치도'];

export default function Order() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = typeof window !== 'undefined' ? localStorage.getItem('dasin_token') : null;

  if (!token) {
    navigate('/login', { replace: true });
    return null;
  }

  const { items: cartItems, clearCart } = useCart();

  // 상세 페이지에서 "구매하기"로 넘어온 경우: 장바구니가 아닌 단건 결제
  const buyNowItem = (location.state as BuyNowState | null)?.buyNow ?? null;
  const isBuyNow = Boolean(buyNowItem);
  const items: CartItem[] = isBuyNow && buyNowItem ? [buyNowItem] : cartItems;
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  useEffect(() => {
    if (window.IMP) {
      window.IMP.init('imp51227848');
    }
  }, []);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [memo, setMemo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePayment = () => {
    if (isSubmitting) return;
    if (!name.trim()) {
      alert('이름을 입력해 주세요.');
      return;
    }
    if (!phone.trim()) {
      alert('연락처를 입력해 주세요.');
      return;
    }
    if (!email.trim()) {
      alert('이메일을 입력해 주세요.');
      return;
    }
    if (!zipCode.trim()) {
      alert('우편번호를 입력해 주세요.');
      return;
    }
    if (!province) {
      alert('도 / 광역시를 선택해 주세요.');
      return;
    }
    if (!district.trim()) {
      alert('구/군/시를 입력해 주세요.');
      return;
    }
    if (!address.trim()) {
      alert('상세주소를 입력해 주세요.');
      return;
    }
    if (!API_BASE) {
      alert('주문 API 주소가 설정되지 않았습니다. 관리자에게 문의해 주세요.');
      return;
    }
    if (!window.IMP) {
      alert('결제 모듈을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }

    const merchantUid = `order_${Date.now()}`;
    setIsSubmitting(true);

    window.IMP.request_pay(
      {
        pg: 'html5_inicis',
        pay_method: 'card',
        merchant_uid: merchantUid,
        name: items.map((i) => i.name).join(', '),
        amount: totalPrice,
        buyer_name: name,
        buyer_tel: phone,
        buyer_email: email,
        buyer_postcode: zipCode,
        buyer_addr: `${province} ${district}`,
      },
      (response) => {
        if (response.success) {
          const createOrder = async () => {
            try {
              const payload = {
                items: items.map((item) => ({
                  productId: item._id,
                  quantity: item.quantity,
                  selectedOptions: item.selectedOptions || [],
                })),
                orderer: {
                  name: name.trim(),
                  phone: phone.trim(),
                  email: email.trim(),
                },
                shippingAddress: {
                  zipCode: zipCode.trim(),
                  province,
                  district: district.trim(),
                  address: address.trim(),
                  addressDetail: addressDetail.trim(),
                  memo: memo.trim(),
                },
                payment: {
                  method: 'card',
                  paidAt: new Date().toISOString(),
                  transactionId: response.imp_uid,
                },
              };

              const orderEndpoints = [`${API_BASE}/api/orders`, `${API_BASE}/orders`];
              let lastStatus = 0;
              let lastErrorMsg = '';
              let saved = false;
              let savedOrder: unknown = null;

              for (const endpoint of orderEndpoints) {
                const res = await fetch(endpoint, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify(payload),
                });
                const data = await res.json().catch(() => ({}));
                if (res.ok) {
                  saved = true;
                  savedOrder = data;
                  break;
                }
                lastStatus = res.status;
                lastErrorMsg = data?.error ? String(data.error) : '';
                if (res.status !== 404) break;
              }

              if (!saved) {
                alert(lastErrorMsg || `주문 저장에 실패했습니다. (${lastStatus || 'network'})`);
                return;
              }

              if (!isBuyNow) {
                clearCart();
              }
              navigate('/order/success', {
                replace: true,
                state: { order: savedOrder, merchantUid: response.merchant_uid },
              });
            } catch {
              alert('주문 저장 중 오류가 발생했습니다.');
            } finally {
              setIsSubmitting(false);
            }
          };

          createOrder();
        } else {
          alert(`결제에 실패했습니다.\n${response.error_msg}`);
          setIsSubmitting(false);
        }
      }
    );
  };

  if (items.length === 0) {
    return (
      <div className={style.orderPage}>
        <h1 className={style.pageTitle}>주문</h1>
        <div className={style.empty}>
          <p>{isBuyNow ? '주문할 상품 정보가 없습니다.' : '장바구니에 담긴 상품이 없습니다.'}</p>
          <Link to="/" className={style.emptyLink}>
            상품 담으러 가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={style.orderPage}>
      <h1 className={style.pageTitle}>주문 / 결제</h1>

      {/* 주문자 정보 */}
      <section className={style.section}>
        <h2 className={style.sectionTitle}>주문자 정보</h2>

        <div className={style.fieldWrap}>
          <input type="text" className={style.input} placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className={style.fieldWrap}>
          <div className={style.inputWithIcon}>
            <input type="tel" className={style.input} placeholder="연락처" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <span className={style.helpIcon} title="숫자만 입력해 주세요">
              ?
            </span>
          </div>
          <p className={style.fieldHint}>배송을 위해 정확한 전화번호를 입력하셔야 합니다.</p>
        </div>

        <div className={style.fieldWrap}>
          <input type="email" className={style.input} placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </section>

      {/* 한글 배송지 정보 */}
      <section className={style.section}>
        <h2 className={style.sectionTitle}>한글 배송지 정보</h2>

        <div className={style.fieldWrap}>
          <div className={style.zipRow}>
            <input type="text" className={style.input} placeholder="우편번호 5자리" maxLength={5} value={zipCode} onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))} />
            <button type="button" className={style.zipBtn}>
              주소 찾기
            </button>
          </div>
        </div>

        <div className={style.fieldWrap}>
          <div className={style.selectWrap}>
            <select className={style.select} value={province} onChange={(e) => setProvince(e.target.value)}>
              <option value="">도 / 광역시</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={style.fieldWrap}>
          <input type="text" className={style.input} placeholder="구/군/시" value={district} onChange={(e) => setDistrict(e.target.value)} />
        </div>

        <div className={style.fieldWrap}>
          <input type="text" className={style.input} placeholder="상세주소" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>

        <div className={style.fieldWrap}>
          <input type="text" className={style.input} placeholder="나머지 주소 (선택)" value={addressDetail} onChange={(e) => setAddressDetail(e.target.value)} />
        </div>

        <div className={style.fieldWrap}>
          <input type="text" className={style.input} placeholder="배송 메모 (선택)" value={memo} onChange={(e) => setMemo(e.target.value)} />
        </div>
      </section>

      {/* 주문 상품 요약 */}
      <section className={style.section}>
        <h2 className={style.sectionTitle}>주문 상품</h2>
        <ul className={style.itemList}>
          {items.map((item) => (
            <li key={item._id} className={style.item}>
              {item.imageUrl ? <img src={item.imageUrl} alt="" className={style.itemImage} /> : <div className={style.itemImagePlaceholder} />}
              <div className={style.itemBody}>
                <span className={style.itemName}>{item.name}</span>
                {item.selectedOptions && item.selectedOptions.length > 0 && <span className={style.itemOptions}>{item.selectedOptions.join(', ')}</span>}
                <span className={style.itemQty}>수량 {item.quantity}개</span>
              </div>
              <span className={style.itemSubtotal}>{(item.price * item.quantity).toLocaleString()}원</span>
            </li>
          ))}
        </ul>
        <div className={style.priceRow}>
          <span>상품 금액</span>
          <span>{totalPrice.toLocaleString()}원</span>
        </div>
        <div className={style.priceRow}>
          <span>배송비</span>
          <span>무료</span>
        </div>
        <div className={style.priceTotal}>
          <span>총 결제금액</span>
          <strong>{totalPrice.toLocaleString()}원</strong>
        </div>
      </section>

      <div className={style.actions}>
        {isBuyNow ? (
          <button type="button" className={style.backBtn} onClick={() => navigate(-1)}>
            상품 페이지로 돌아가기
          </button>
        ) : (
          <Link to="/cart" className={style.backBtn}>
            장바구니로 돌아가기
          </Link>
        )}
        <button type="button" className={style.payBtn} onClick={handlePayment} disabled={isSubmitting}>
          {isSubmitting ? '처리 중...' : '주문하기'}
        </button>
      </div>
    </div>
  );
}
