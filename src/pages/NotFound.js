import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/NotFound.css';
import Seo from '../components/Seo';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="notfound-page">
      <Seo
        title="Страница не найдена (404) — Eltok.kz"
        description="Страница не найдена. Перейдите на главную или в каталог товаров Eltok.kz."
        robots="noindex, nofollow"
      />
      <Header />
      <main className="notfound-main">
        <div className="notfound-wrapper">
          <div className="notfound-404">
            <span>4</span>
            <span>0</span>
            <span>4</span>
          </div>
          <h1 className="notfound-title">Страница не найдена</h1>
          <p className="notfound-text">Извините, такой страницы не существует.<br />Проверьте адрес или вернитесь на главную.</p>
          <button className="notfound-btn" onClick={() => navigate('/')}>На главную</button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound; 