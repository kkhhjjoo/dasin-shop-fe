import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import style from './Header.module.css';

type HeaderProps = {
  userName?: string | null;
  isAdmin?: boolean;
  onLogout?: () => void;
};

export default function Header({ userName, isAdmin, onLogout }: HeaderProps) {
  const { totalCount } = useCart();
  const navigate = useNavigate();

  const handleClickLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const handleClickCart = () => {
    if (!userName) {
      navigate('/login');
      return;
    }
    navigate('/cart');
  };

  return (
    <header className={style.header}>
      <div className={style.headerTop}>
        <div className={`container ${style.headerInner}`}>
          <Link to='/' className={style.logo}>
            DASHIN
          </Link>
          <div className={style.headerRight}>
            <nav className={style.headerNav}>
              {isAdmin && (
                <Link to='/admin'>관리자</Link>
              )}
              {userName && (
                <Link to='/orders'>주문 내역</Link>
              )}
              {userName ? (
                <button
                  type='button'
                  className={style.headerLinkButton}
                  onClick={handleClickLogout}
                >
                  로그아웃
                </button>
              ) : (
                <Link to='/login'>로그인</Link>
              )}
              <Link to='/signup'>
                회원가입
              </Link>
            </nav>
            <div className={style.headerUtils}>
              {userName && (
                <span className={style.headerGreeting}>{userName}님 반갑습니다.</span>
              )}
              <button type="button" onClick={handleClickCart} className={style.cartBtn}>
                장바구니 <strong>{totalCount}</strong>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

