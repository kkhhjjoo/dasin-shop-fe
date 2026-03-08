import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import style from './Login.module.css';

const API_BASE = import.meta.env.VITE_API_BASE;

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 이미 로그인된 상태면 메인으로 보내기
  useEffect(() => {
    const token = localStorage.getItem('dasin_token');
    const storedUser = localStorage.getItem('dasin_user');
    if (token && storedUser) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleKakaoLogin = () => {
    window.location.href = `${API_BASE}/api/auth/kakao`;
  };

  const handleNaverLogin = () => {
    window.location.href = `${API_BASE}/api/auth/naver`;
  };

  const handleAppleLogin = () => {
    window.location.href = `${API_BASE}/auth/apple`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('이메일을 입력해 주세요.');
      return;
    }
    if (!password) {
      setError('비밀번호를 입력해 주세요.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || '로그인에 실패했습니다.');
        return;
      }

      if (data.token) {
        localStorage.setItem('dasin_token', data.token);
      }
      if (data.refreshToken) {
        localStorage.setItem('dasin_refresh', data.refreshToken);
      }
      if (data.user) {
        localStorage.setItem('dasin_user', JSON.stringify(data.user));
      }

      alert('로그인 되었습니다.');
      // 전체 페이지를 새로고침해서 App의 useEffect가 /api/me를 다시 호출하도록 함
      window.location.href = '/';
    } catch {
      setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={style['login-page']}>
      <div className={`container ${style['login-container']}`}>
        <form className={style['login-card']} onSubmit={handleSubmit}>
          <div className={style['login-field']}>
            <input type="email" className={style['login-input']} placeholder="이메일 입력" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className={style['login-field']}>
            <input type="password" className={style['login-input']} placeholder="비밀번호 입력" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <div className={style['login-coupon-bubble']}>
            <span role="img" aria-label="gift">
              🎁
            </span>{' '}
            회원가입하고, <span className={style['login-coupon-text']}>10% 할인쿠폰</span> 꼭 받으세요
          </div>

          <button type="button" className={`${style['login-social']} ${style['login-social--kakao']}`} onClick={handleKakaoLogin}>
            <span className={style['login-social-icon']}>💬</span>
            <span>카카오로 시작하기</span>
          </button>
          <button type="button" className={`${style['login-social']} ${style['login-social--naver']}`} onClick={handleNaverLogin}>
            <span className={`${style['login-social-icon']} ${style['login-social-icon--naver']}`}>N</span>
            <span>네이버로 시작하기</span>
          </button>
          <button type="button" className={`${style['login-social']} ${style['login-social--apple']}`} onClick={handleAppleLogin}>
            <span className={style['login-social-icon']}></span>
            <span>Apple로 시작하기</span>
          </button>

          {error && (
            <p className={style['login-error']} role="alert">
              {error}
            </p>
          )}

          <button type="submit" className={style['login-button']} disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>

          <div className={style['login-links']}>
            <button type="button" className={style['login-link-button']}>
              이메일 찾기
            </button>
            <span className={style['login-links-sep']}>|</span>
            <button type="button" className={style['login-link-button']}>
              비밀번호 찾기
            </button>
            <span className={style['login-links-sep']}>|</span>
            <Link to="/signup" className={style['login-link-button']}>
              회원가입
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
