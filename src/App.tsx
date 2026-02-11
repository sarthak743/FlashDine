import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '@/pages/LandingPage';
import { MenuPage } from '@/pages/MenuPage';
import { CartPage } from '@/pages/CartPage';
import { CustomerDetailsPage } from '@/pages/CustomerDetailsPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { OrderTrackingPage } from '@/pages/OrderTrackingPage';
import { KitchenDisplayPage } from '@/pages/KitchenDisplayPage';
import { AdminLoginPage } from '@/pages/AdminLoginPage';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/customer-details" element={<CustomerDetailsPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/track/:orderId" element={<OrderTrackingPage />} />
        <Route path="/kitchen" element={<KitchenDisplayPage />} />
        <Route path="/admin-login" element={<AdminLoginPage />} />
        <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
