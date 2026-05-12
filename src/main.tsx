import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import Login from './pages/login/Login';
import SignUp from './pages/sign-up/SignUp';
import NotFound from './pages/NotFound';
import './index.css';
import ProductDetail from './components/product-detail/ProductDetail';
import Admin from './pages/Admin/Admin';
import Home from './pages/Home';
import Cart from './pages/Cart/Cart';
import Order from './pages/Order/Order';
import OrderSuccess from './pages/Order/OrderSuccess';
import Orders from './pages/Order/Orders';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Home /> },
      {
        path: '/cart',
        element: <Cart />,
      },
      {
        path: '/admin',
        element: <Admin />,
      },
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '/signup',
        element: <SignUp />,
      },
      {
        path: '/detail/:id',
        element: <ProductDetail />,
      },
      {
        path: '/order',
        element: <Order />,
      },
      {
        path: '/order/success',
        element: <OrderSuccess />,
      },
      {
        path: '/orders',
        element: <Orders />,
      },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
