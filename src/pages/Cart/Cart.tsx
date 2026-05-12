import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import style from './Cart.module.css';

export default function Cart() {
  const navigate = useNavigate();
  const token = typeof window !== 'undefined' ? localStorage.getItem('dasin_token') : null;

  // 비로그인 상태에서는 장바구니 페이지 접근 시 로그인 페이지로 이동
  if (!token) {
    navigate('/login', { replace: true });
    return null;
  }

  const { items, removeFromCart, updateQuantity, totalCount } = useCart();

  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className={style.cartPage}>
        <h1 className={style.cartTitle}>장바구니</h1>
        <div className={style.cartEmpty}>
          <p>장바구니에 담긴 상품이 없습니다.</p>
          <Link to="/" className={style.cartEmptyLink}>
            상품 담으러 가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={style.cartPage}>
      <h1 className={style.cartTitle}>장바구니 ({totalCount}개)</h1>
      <ul className={style.cartList}>
        {items.map((item) => (
          <li key={item._id} className={style.cartItem}>
            <Link to={`/detail/${item._id}`} className={style.cartItemImageWrap}>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt="" className={style.cartItemImage} />
              ) : (
                <div className={style.cartItemImagePlaceholder} />
              )}
            </Link>
            <div className={style.cartItemBody}>
              <Link to={`/detail/${item._id}`} className={style.cartItemName}>
                {item.name}
              </Link>
              {item.selectedOptions && item.selectedOptions.length > 0 && (
                <div className={style.cartItemOptions}>
                  {item.selectedOptions.map((opt, idx) => (
                    <span key={idx} className={style.cartItemOption}>{opt}</span>
                  ))}
                </div>
              )}
              <div className={style.cartItemPrice}>{item.price.toLocaleString()}원</div>
              <div className={style.cartItemActions}>
                <div className={style.quantityWrap}>
                  <button
                    type="button"
                    className={style.quantityBtn}
                    onClick={() =>
                      updateQuantity(item._id, item.quantity - 1, item.selectedOptions)
                    }
                    aria-label="수량 줄이기"
                  >
                    −
                  </button>
                  <span className={style.quantityValue}>{item.quantity}</span>
                  <button
                    type="button"
                    className={style.quantityBtn}
                    onClick={() =>
                      updateQuantity(item._id, item.quantity + 1, item.selectedOptions)
                    }
                    aria-label="수량 늘리기"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className={style.removeBtn}
                  onClick={() => removeFromCart(item._id, item.selectedOptions)}
                >
                  삭제
                </button>
              </div>
            </div>
            <div className={style.cartItemSubtotal}>
              {(item.price * item.quantity).toLocaleString()}원
            </div>
          </li>
        ))}
      </ul>
      <div className={style.cartFooter}>
        <div className={style.cartTotal}>
          <span>총 결제금액</span>
          <strong>{totalPrice.toLocaleString()}원</strong>
        </div>
        <div className={style.cartFooterActions}>
          <Link to="/" className={style.continueShopping}>
            쇼핑 계속하기
          </Link>
          <button type="button" className={style.orderBtn} onClick={() => navigate('/order')}>
            결제하기
          </button>
        </div>
      </div>
    </div>
  );
}
