import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Nav from './components/Nav';
import ProductDetail from './components/ProductDetail';
import SignUp from './pages/SignUp';
import Login from './pages/Login';

const API_BASE = import.meta.env.VITE_API_BASE || '';

function App() {
  const [userName, setUserName] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 1) localStorage에 저장된 유저 정보가 있으면 바로 사용
    const storedUser = localStorage.getItem('dasin_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed && typeof parsed.name === 'string') {
          setUserName(parsed.name);
          return;
        }
      } catch {
        // ignore JSON parse error
      }
    }

    // 2) 없으면 토큰으로 /api/me 호출
    const token = localStorage.getItem('dasin_token');
    if (!token) return;

    const fetchMe = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (data && typeof data.name === 'string') {
          setUserName(data.name);
        }
      } catch {
        // ignore
      }
    };

    fetchMe();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('dasin_token');
    localStorage.removeItem('dasin_user');
    setUserName(null);
    navigate('/', { replace: true });
  };

  return (
    <>
      <Header userName={userName} onLogout={handleLogout} />
      <Routes>
        <Route
          path='/'
          element={
            <>
              <Nav />
              <main>
                <ProductDetail />
              </main>
            </>
          }
        />
        <Route
          path='/login'
          element={
            <main>
              <Login />
            </main>
          }
        />
        <Route
          path='/signup'
          element={
            <main>
              <SignUp />
            </main>
          }
        />
      </Routes>
    </>
  );
}

export default App;
