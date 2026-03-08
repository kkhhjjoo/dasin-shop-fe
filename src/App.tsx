import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from './components/header/Header';
import Footer from './components/footer/Footer';
import Intro from './components/intro/Intro';

const API_BASE = import.meta.env.VITE_API_BASE;

function App() {
  const [user, setUser] = useState<{ name: string; user_type?: string } | null>(null);
  const [showIntro, setShowIntro] = useState(() => !sessionStorage.getItem('dasin_intro_seen'));
  const navigate = useNavigate();

  useEffect(() => {
    // 0) OAuth 콜백으로 URL에 token이 있으면 저장 후 제거
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const loginError = params.get('login_error');
    if (urlToken) {
      localStorage.setItem('dasin_token', urlToken);
      window.history.replaceState({}, '', window.location.pathname || '/');
    }
    if (loginError) {
      window.history.replaceState({}, '', window.location.pathname || '/');
    }

    // 1) localStorage에 저장된 유저 정보가 있으면 바로 사용
    const storedUser = localStorage.getItem('dasin_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed && typeof parsed.name === 'string') {
          setUser({ name: parsed.name, user_type: parsed.user_type });
          return;
        }
      } catch {
        // ignore JSON parse error
      }
    }

    // 2) 토큰으로 /api/me 호출 (URL에서 받은 토큰 포함)
    const token = urlToken || localStorage.getItem('dasin_token');
    if (!token) return;

    const fetchMe = async () => {
      try {
        let currentToken = token;
        let res = await fetch(`${API_BASE}/api/me`, {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        });

        // access token이 만료(401 등)이고 refreshToken이 있으면 재발급 시도
        if (!res.ok && res.status === 401) {
          const refreshToken = localStorage.getItem('dasin_refresh');
          if (refreshToken) {
            const refreshRes = await fetch(`${API_BASE}/api/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken }),
            });
            const refreshData = await refreshRes.json().catch(() => ({}));
            if (refreshRes.ok && refreshData.token) {
              currentToken = refreshData.token;
              localStorage.setItem('dasin_token', refreshData.token);
              if (refreshData.refreshToken) {
                localStorage.setItem('dasin_refresh', refreshData.refreshToken);
              }
              // 재시도
              res = await fetch(`${API_BASE}/api/me`, {
                headers: {
                  Authorization: `Bearer ${currentToken}`,
                },
              });
            } else {
              // refresh 실패 시 토큰 제거
              localStorage.removeItem('dasin_token');
              localStorage.removeItem('dasin_refresh');
              return;
            }
          }
        }

        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (data && typeof data.name === 'string') {
          setUser({ name: data.name, user_type: data.user_type });
          localStorage.setItem('dasin_user', JSON.stringify({ name: data.name, user_type: data.user_type }));
        }
      } catch {
        // ignore
      }
    };

    fetchMe();
  }, []);

  useEffect(() => {
    if (!showIntro) return;
    const timer = setTimeout(() => {
      setShowIntro(false);
      sessionStorage.setItem('dasin_intro_seen', '1');
    }, 1500);
    return () => clearTimeout(timer);
  }, [showIntro]);

  const handleLogout = () => {
    localStorage.removeItem('dasin_token');
    localStorage.removeItem('dasin_user');
    setUser(null);
    navigate('/', { replace: true });
  };

  if (showIntro) {
    return <Intro />;
  }

  return (
    <>
      <Header userName={user?.name ?? null} isAdmin={user?.user_type === 'admin'} onLogout={handleLogout} />
      <Outlet />
      <Footer />
    </>
  );
}

export default App;
