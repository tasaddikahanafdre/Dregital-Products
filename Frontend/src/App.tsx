import { Navigate, Route, Routes } from 'react-router-dom';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ShopPage />} />
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/p/:slug" element={<ProductPage />} />
      <Route path="/checkout/:slug" element={<CheckoutPage />} />
      <Route path="/order/:orderNumber" element={<OrderConfirmationPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminDashboardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
