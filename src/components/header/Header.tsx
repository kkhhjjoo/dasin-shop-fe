import { Link } from 'react-router-dom';
import style from './Header.module.css';

type HeaderProps = {
  userName?: string | null;
  isAdmin?: boolean;
  onLogout?: () => void;
};

export default function Header({ userName, isAdmin, onLogout }: HeaderProps) {
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
              {userName ? (
                <button
                  type='button'
                  className={style.headerLinkButton}
                  onClick={onLogout}
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
              <a href='/cart' className={style.cartBtn}>
                장바구니 <strong>0</strong>
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

