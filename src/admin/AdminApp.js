import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { isAdminAuthenticated, setAdminToken, removeAdminToken } from '../utils/auth';
import { testAdminSecurity } from '../utils/securityTest';
import '../styles/Admin.css';

// Lazy loading для админских компонентов
const AdminLogin = lazy(() => import('./Login'));
const AdminProductList = lazy(() => import('./ProductList'));
const RentalList = lazy(() => import('./RentalList'));
const SiteSettings = lazy(() => import('./SiteSettings'));
const PickupPoints = lazy(() => import('./PickupPoints'));
const ProductVariations = lazy(() => import('./ProductVariations'));
const Orders = lazy(() => import('./Orders'));

const AdminApp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuth = isAdminAuthenticated();

  // Дополнительная защита - редирект на логин если не авторизован
  useEffect(() => {
    if (!isAuth && location.pathname !== '/admin/login') {
      navigate('/admin/login');
    }
  }, [isAuth, location.pathname, navigate]);

  // Тестирование безопасности (удалить в продакшене)
  useEffect(() => {
    testAdminSecurity();
  }, []);

  const handleLogin = () => {
    setAdminToken('admin');
    navigate('/admin/products');
  };

  const handleLogout = () => {
    removeAdminToken();
    navigate('/admin/login');
  };

  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Загрузка админки...</div>}>
      <Routes>
        <Route path="/login" element={<AdminLogin onLogin={handleLogin} />} />
        <Route path="/products" element={isAuth ? <AdminProductList onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/rental" element={isAuth ? <RentalList onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/orders" element={isAuth ? <Orders onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/variations" element={isAuth ? <ProductVariations onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/settings" element={isAuth ? <SiteSettings onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/pickup-points" element={isAuth ? <PickupPoints onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/" element={isAuth ? <Navigate to="/products" /> : <Navigate to="/login" />} />
        <Route path="*" element={isAuth ? <Navigate to="/products" /> : <Navigate to="/login" />} />
      </Routes>
    </Suspense>
  );
};

export default AdminApp; 