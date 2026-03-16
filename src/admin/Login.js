import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Примитивная проверка (заменить на реальную авторизацию позже)
    if (form.username === 'admin' && form.password === 'admin123') {
      setError('');
      onLogin();
    } else {
      setError('Неверный логин или пароль');
    }
  };

  return (
    <div className="admin-container" style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa'}}>
      <form className="admin-form" onSubmit={handleSubmit} style={{background: '#fff', border: '1.5px solid #bdbdbd', borderRadius: 12, padding: 32, minWidth: 320, boxShadow: '0 4px 18px rgba(30,40,90,0.06)'}}>
        <h2 className="admin-header" style={{textAlign: 'center', marginBottom: 24, color: '#1a2236', fontWeight: 700}}>Вход в админ-панель</h2>
        <div style={{marginBottom: 18}}>
          <label className="admin-label" style={{display: 'block', marginBottom: 6, fontWeight: 500}}>Логин</label>
          <input className="admin-input" type="text" name="username" value={form.username} onChange={handleChange} required style={{width: '100%', padding: 10, border: '1px solid #bdbdbd', borderRadius: 6, fontSize: 16}} />
        </div>
        <div style={{marginBottom: 18}}>
          <label className="admin-label" style={{display: 'block', marginBottom: 6, fontWeight: 500}}>Пароль</label>
          <input className="admin-input" type="password" name="password" value={form.password} onChange={handleChange} required style={{width: '100%', padding: 10, border: '1px solid #bdbdbd', borderRadius: 6, fontSize: 16}} />
        </div>
        {error && <div style={{color: '#e53935', marginBottom: 12, textAlign: 'center'}}>{error}</div>}
        <button className="admin-button" type="submit" style={{width: '100%', background: '#FF6B00', color: '#fff', fontSize: 18, fontWeight: 600, border: 'none', borderRadius: 8, padding: '12px 0', cursor: 'pointer', marginTop: 10}}>Войти</button>
      </form>
    </div>
  );
};

export default Login; 