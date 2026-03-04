import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE || ''

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleKakaoLogin = () => {
    window.location.href = `${API_BASE}/auth/kakao`
  }

  const handleNaverLogin = () => {
    window.location.href = `${API_BASE}/auth/naver`
  }

  const handleAppleLogin = () => {
    window.location.href = `${API_BASE}/auth/apple`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('이메일을 입력해 주세요.')
      return
    }
    if (!password) {
      setError('비밀번호를 입력해 주세요.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || '로그인에 실패했습니다.')
        return
      }

      if (data.token) {
        localStorage.setItem('dasin_token', data.token)
      }
      if (data.user) {
        localStorage.setItem('dasin_user', JSON.stringify(data.user))
      }

      alert('로그인 되었습니다.')
      navigate('/')
    } catch {
      setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="container login-container">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-field">
            <input
              type="email"
              className="login-input"
              placeholder="이메일 입력"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="login-field">
            <input
              type="password"
              className="login-input"
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="login-coupon-bubble">
            <span role="img" aria-label="gift">
              🎁
            </span>{' '}
            회원가입하고, <span className="login-coupon-text">10% 할인쿠폰</span> 꼭 받으세요
          </div>

          <button
            type="button"
            className="login-social login-social--kakao"
            onClick={handleKakaoLogin}
          >
            <span className="login-social-icon">💬</span>
            <span>카카오로 시작하기</span>
          </button>
          <button
            type="button"
            className="login-social login-social--naver"
            onClick={handleNaverLogin}
          >
            <span className="login-social-icon login-social-icon--naver">N</span>
            <span>네이버로 시작하기</span>
          </button>
          <button
            type="button"
            className="login-social login-social--apple"
            onClick={handleAppleLogin}
          >
            <span className="login-social-icon"></span>
            <span>Apple로 시작하기</span>
          </button>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>

          <div className="login-links">
            <button type="button" className="login-link-button">
              이메일 찾기
            </button>
            <span className="login-links-sep">|</span>
            <button type="button" className="login-link-button">
              비밀번호 찾기
            </button>
            <span className="login-links-sep">|</span>
            <Link to="/signup" className="login-link-button">
              회원가입
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

