import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import MarketPage from './pages/MarketPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import StorePage from './pages/StorePage.jsx';
import SignInPage from './pages/SignInPage.jsx';
import SignUpPage from './pages/SignUpPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import VerificationPage from './pages/VerificationPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import HelpPage from './pages/HelpPage.jsx';
import AccountPage from './pages/AccountPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import SellerDashboardPage from './pages/SellerDashboardPage.jsx';
import OrderDetailsPage from './pages/OrderDetailsPage.jsx';
import WishlistPage from './pages/WishlistPage.jsx';
import CartPage from './pages/CartPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { CartProvider } from './components/CartContext.jsx';
import { WishlistProvider } from './components/WishlistContext.jsx';
import { SocketProvider } from './contexts/SocketContext.jsx';
import { NotificationProvider } from './contexts/NotificationContext.jsx';
import Toast from './components/Toast.jsx';

// Main App Component with Routing
export default function App() {
  return (
    <SocketProvider>
      <NotificationProvider>
        <CartProvider>
          <WishlistProvider>
            <Toast />
                <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/marketplace" element={<MarketPage />} />
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route path="/store/:sellerId" element={<StorePage />} />
                <Route path="/signin" element={<SignInPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/verify-otp" element={<VerificationPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="/cart" element={<CartPage />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/chat" element={<ChatPage />} />
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="/admin" element={<AdminDashboardPage />} />
                  <Route path="/seller-dashboard" element={<SellerDashboardPage />} />
                  <Route path="/orders/:id?" element={<OrderDetailsPage />} />
                  <Route path="/wishlist" element={<WishlistPage />} />
                </Route>
              </Routes>
        </WishlistProvider>
      </CartProvider>
      </NotificationProvider>
    </SocketProvider>
  );
}
