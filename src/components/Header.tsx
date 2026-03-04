import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className='header'>
      <div className='header-top'>
        <div className='container header-inner'>
          <Link to='/' className='logo'>
            DASHIN
          </Link>
          <nav className='header-nav'>
            <Link to='/login'>로그인</Link>
            <Link to='/signup'>
              회원가입 <span className='badge'>10%할인 쿠폰 즉시 지급</span>
            </Link>
            <a href='/order'>비회원주문조회</a>
            <a href='/wish'>즐겨찾기</a>
          </nav>
          <div className='header-utils'>
            <a href='/cart' className='cart-btn'>
              장바구니 <strong>0</strong>
            </a>
          </div>
        </div>
      </div>
      <div className='header-benefits'>
        <div className='container'>
          <span>회원가입 혜택</span>
          <span className='benefit'>무료배송 배송비쿠폰</span>
          <span className='benefit'>1% 적립금</span>
          <span className='benefit'>상품후기 적립금</span>
        </div>
      </div>
    </header>
  );
}
