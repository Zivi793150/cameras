import React, { useState } from 'react';
import Login from '../admin/Login';
import ProductList from '../admin/ProductList';

const Admin = () => {
  const [isAuth, setIsAuth] = useState(() => !!localStorage.getItem('admin_token'));

  const handleLogin = () => {
    localStorage.setItem('admin_token', 'admin');
    setIsAuth(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAuth(false);
  };

  if (!isAuth) return <Login onLogin={handleLogin} />;
  return <ProductList onLogout={handleLogout} />;
};

export default Admin; 