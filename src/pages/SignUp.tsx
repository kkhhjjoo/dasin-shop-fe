import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE || ''

const emailRegex = /^[^\s@]+@[^\s@]+?\.[^\s@]+$/
const nameRegex = /^[가-힣a-zA-Z0-9\s]+$/

export default function SignUp() {
  const navigate = useNavigate()
  const [showWelcomeModal, setShowWelcomeModal] = useState(true)
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [name, setName] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [birthMonth, setBirthMonth] = useState('')
  const [birthDay, setBirthDay] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | ''>('')
  const [agreeAll, setAgreeAll] = useState(false)
  const [agreeAge, setAgreeAge] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [agreeMarketing, setAgreeMarketing] = useState(false)
  const [agreeMarketingEmail, setAgreeMarketingEmail] = useState(false)
  const [agreeMarketingSms, setAgreeMarketingSms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAgreeAll = (checked: boolean) => {
    setAgreeAll(checked)
    setAgreeAge(checked)
    setAgreeTerms(checked)
    setAgreePrivacy(checked)
    setAgreeMarketing(checked)
    setAgreeMarketingEmail(checked)
    setAgreeMarketingSms(checked)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('이메일을 입력해 주세요.')
      return
    }
    if (!emailRegex.test(email.trim())) {
      setError('이메일 형식이 올바르지 않습니다.')
      return
    }
    if (!nickname.trim()) {
      setError('닉네임을 입력해 주세요.')
      return
    }
    if (!password) {
      setError('비밀번호를 입력해 주세요.')
      return
    }
    if (password.length < 8) {
      setError('비밀번호는 8자 이상 입력해 주세요.')
      return
    }
    if (password.length > 64) {
      setError('비밀번호는 64자 이하로 입력해 주세요.')
      return
    }
    const simplePasswords = ['password', '1234', '12345', '123456', '12345678']
    if (simplePasswords.includes(password.toLowerCase())) {
      setError('너무 쉬운 비밀번호입니다. 다른 비밀번호를 사용해 주세요.')
      return
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    if (!name.trim()) {
      setError('이름을 입력해 주세요.')
      return
    }
    if (!nameRegex.test(name.trim())) {
      setError('이름에는 특수문자나 이모지를 사용할 수 없습니다.')
      return
    }
    if (!agreeAge || !agreeTerms || !agreePrivacy) {
      setError('필수 이용약관에 모두 동의해 주세요.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          nickname: nickname.trim(),
          password,
          passwordConfirm,
          name: name.trim(),
          birthYear: birthYear || undefined,
          birthMonth: birthMonth || undefined,
          birthDay: birthDay || undefined,
          gender: gender || '',
          address: '',
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 409) {
          setError('이미 존재하는 이메일입니다. 다른 이메일로 가입해 주세요.')
        } else {
          setError(data.error || '회원가입에 실패했습니다.')
        }
        return
      }
      alert('회원가입이 완료되었습니다.')
      navigate('/')
    } catch {
      setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="signup-page">
      <div className="container signup-container">
        <h1 className="signup-title">3초만에 간편가입!</h1>

        {/* 소셜 로그인 */}
        <div className="signup-social">
          <button type="button" className="social-btn social-btn--naver" title="네이버로 가입">
            <span className="social-icon social-icon--naver">N</span>
          </button>
          <button type="button" className="social-btn social-btn--kakao" title="카카오로 가입">
            <span className="social-icon social-icon--kakao" aria-hidden>💬</span>
          </button>
          <button type="button" className="social-btn social-btn--apple" title="Apple로 가입">
            <span className="social-icon social-icon--apple" aria-hidden></span>
          </button>
        </div>

        <form className="signup-form" onSubmit={handleSubmit}>
          {/* 이메일 */}
          <div className="form-row">
            <label className="form-label">
              이메일 <span className="required">*</span>
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="이메일 입력"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* 닉네임 */}
          <div className="form-row">
            <label className="form-label">
              닉네임 <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="닉네임 입력"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>

          {/* 비밀번호 */}
          <div className="form-row">
            <label className="form-label">
              비밀번호 <span className="required">*</span>
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              type="password"
              className="form-input form-input--mt"
              placeholder="비밀번호 다시 한번 입력"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
            />
          </div>

          {/* 이름 */}
          <div className="form-row">
            <label className="form-label">이름</label>
            <input
              type="text"
              className="form-input"
              placeholder="이름 입력"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* 생년월일 */}
          <div className="form-row">
            <label className="form-label">생년월일</label>
            <div className="form-date">
              <input
                type="text"
                className="form-input"
                placeholder="YYYY"
                maxLength={4}
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, ''))}
              />
              <span className="form-date-sep">/</span>
              <input
                type="text"
                className="form-input"
                placeholder="MM"
                maxLength={2}
                value={birthMonth}
                onChange={(e) => setBirthMonth(e.target.value.replace(/\D/g, ''))}
              />
              <span className="form-date-sep">/</span>
              <input
                type="text"
                className="form-input"
                placeholder="DD"
                maxLength={2}
                value={birthDay}
                onChange={(e) => setBirthDay(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>

          {/* 성별 */}
          <div className="form-row">
            <label className="form-label">성별</label>
            <div className="form-radio-group">
              <label className="form-radio">
                <input
                  type="radio"
                  name="gender"
                  checked={gender === 'male'}
                  onChange={() => setGender('male')}
                />
                <span>남자</span>
              </label>
              <label className="form-radio">
                <input
                  type="radio"
                  name="gender"
                  checked={gender === 'female'}
                  onChange={() => setGender('female')}
                />
                <span>여자</span>
              </label>
              <label className="form-radio">
                <input
                  type="radio"
                  name="gender"
                  checked={gender === ''}
                  onChange={() => setGender('')}
                />
                <span>선택 안 함</span>
              </label>
            </div>
          </div>

          {/* 이용약관 동의 */}
          <div className="form-row form-row--terms">
            <label className="form-label">
              이용약관 동의 <span className="required">*</span>
            </label>
            <div className="terms-box">
              <label className="terms-row terms-row--all">
                <input
                  type="checkbox"
                  checked={agreeAll}
                  onChange={(e) => handleAgreeAll(e.target.checked)}
                />
                <span>전체 동의합니다.</span>
              </label>
              <label className="terms-row">
                <input
                  type="checkbox"
                  checked={agreeAge}
                  onChange={(e) => setAgreeAge(e.target.checked)}
                />
                <span>본인은 만 14세 이상 입니다. (필수)</span>
              </label>
              <label className="terms-row">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <span>이용약관 동의 (필수)</span>
                <button type="button" className="terms-view">
                  내용보기
                </button>
              </label>
              <label className="terms-row">
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                />
                <span>개인정보처리방침 (필수)</span>
                <button type="button" className="terms-view">
                  내용보기
                </button>
              </label>
              <label className="terms-row">
                <input
                  type="checkbox"
                  checked={agreeMarketing}
                  onChange={(e) => {
                    setAgreeMarketing(e.target.checked)
                    if (!e.target.checked) {
                      setAgreeMarketingEmail(false)
                      setAgreeMarketingSms(false)
                    }
                  }}
                />
                <span>혜택/마케팅 수신동의 (선택)</span>
              </label>
              <div className="terms-sub">
                <label className="terms-row">
                  <input
                    type="checkbox"
                    checked={agreeMarketingEmail}
                    onChange={(e) => setAgreeMarketingEmail(e.target.checked)}
                  />
                  <span>이메일</span>
                </label>
                <label className="terms-row">
                  <input
                    type="checkbox"
                    checked={agreeMarketingSms}
                    onChange={(e) => setAgreeMarketingSms(e.target.checked)}
                  />
                  <span>문자</span>
                </label>
              </div>
            </div>
          </div>

          <p className="signup-notice">
            다신샵, 다이어트신을 통합계정 하나로 이용할 수 있습니다.
          </p>

          {error && (
            <p className="signup-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn-signup" disabled={loading}>
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>
      </div>

      {/* 웰컴쿠폰 모달 */}
      {showWelcomeModal && (
        <div className="modal-overlay" onClick={() => setShowWelcomeModal(false)}>
          <div className="modal-content signup-welcome-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              aria-label="닫기"
              onClick={() => setShowWelcomeModal(false)}
            >
              ×
            </button>
            <p className="modal-title">단 한 번만 받을 수 있는 혜택</p>
            <p className="modal-desc">웰컴쿠폰을 정말 포기하시나요?😢</p>
            <div className="modal-actions">
              <a href="#" className="btn-primary" onClick={() => setShowWelcomeModal(false)}>
                쿠폰 받기
              </a>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowWelcomeModal(false)}
              >
                혜택 포기하고 그냥 가입하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
