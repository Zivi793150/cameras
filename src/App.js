import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Checkout from './pages/Checkout';
import AdminApp from './admin/AdminApp';
import FloatingButtons from './components/FloatingButtons';
import TimedLeadPopup from './components/TimedLeadPopup';

// Lazy loading для всех страниц
const Home = lazy(() => import('./pages/Home'));
const Catalog = lazy(() => import('./pages/Catalog'));
const Category = lazy(() => import('./pages/Category'));
const Rental = lazy(() => import('./pages/Rental'));
const Product = lazy(() => import('./pages/Product'));
const About = lazy(() => import('./pages/About'));
const Contacts = lazy(() => import('./pages/Contacts'));
const Thanks = lazy(() => import('./pages/Thanks'));
const Policy = lazy(() => import('./pages/Policy'));
const Cooperation = lazy(() => import('./pages/Cooperation'));
const Services = lazy(() => import('./pages/Services'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Lazy loading для оптовых страниц

// Fallback компонент для загрузки
const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    fontSize: '18px',
    color: '#666'
  }}>
    Загрузка...
  </div>
);

function App() {
  return (
    <Router>
      <div className="App">
        <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/catalog/:category" element={<Category />} />
          <Route path="/catalog/:category/:slug" element={<Product />} />
          <Route path="/rental" element={<Rental />} />
          <Route path="/rental/:category" element={<Rental />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/about" element={<About />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/policy" element={<Policy />} />
          <Route path="/cooperation" element={<Cooperation />} />
          <Route path="/services" element={<Services />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/thanks" element={<Thanks />} />
          <Route path="/admin/*" element={<AdminApp />} />
          {/* Оптовые страницы удалены по требованию заказчика */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        <FloatingButtons />
        <TimedLeadPopup />
      </div>
    </Router>
  );
}

export default App;
