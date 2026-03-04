import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Nav from './components/Nav';
import ProductDetail from './components/ProductDetail';
import SignUp from './pages/SignUp';

function App() {
  return (
    <>
      <Header />
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
