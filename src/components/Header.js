import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaTelegramPlane } from 'react-icons/fa';
import '../styles/Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Фиксированные данные (не тянем из БД, чтобы исключить рассинхрон)
  const siteSettings = {
    contactInfo: {
      phone: '+7 707 517 73 85',
      email: 'info@cameras.kz',
      address: 'Алматы'
    },
    city: 'Алматы'
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isMenuOpen) {
        closeMenu();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMenuOpen]);

  // Убираем загрузку из БД — используем фиксированные данные из макета

  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev);
    // debug: логируем переключение меню
    try { console.debug('[Header] toggleMenu, nextState:', !isMenuOpen); } catch (e) {}
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Синхронизируем класс на body и блокировку скролла при изменении состояния меню
  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add('menu-open');
      document.body.style.overflow = 'hidden';
      try { console.debug('[Header] menu opened -> body.menu-open added'); } catch (e) {}
    } else {
      document.body.classList.remove('menu-open');
      document.body.style.overflow = 'auto';
      try { console.debug('[Header] menu closed -> body.menu-open removed'); } catch (e) {}
    }
    return () => {
      // на всякий случай убираем класс при размонтировании
      document.body.classList.remove('menu-open');
      document.body.style.overflow = 'auto';
    };
  }, [isMenuOpen]);

  return (
    <header className="header">
      <div className="header-united-bar">
        {/* Desktop Logo */}
        <div className="header-logo desktop-logo">
          <div className="logo">
            <picture>
              <source srcSet="/logo_pc.jpg" type="image/jpeg" />
              <img src="/logo_pc.jpg" alt="Cameras.kz" className="logo-image" />
            </picture>
          </div>
        </div>
        
        {/* Mobile Title */}
        <div className="mobile-title">
          <picture>
            <source srcSet="/logo_mobile.jpg" type="image/jpeg" />
            <img src="/logo_mobile.jpg" alt="Cameras.kz" className="mobile-logo-image" />
          </picture>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="main-nav desktop-nav">
          <Link to="/">Главная</Link>
          <span className="nav-sep" />
          <Link to="/services">Услуги</Link>
          <span className="nav-sep" />
          <Link to="/catalog">Каталог</Link>
          <span className="nav-sep" />
          <Link to="/about">О компании</Link>
          <span className="nav-sep" />
          <Link to="/contacts">Контакты</Link>
        </nav>

        {/* Desktop Contact Info - Call button + Telegram */}
        <div className="header-right-blocks desktop-contacts">
          <a 
            href={`tel:${siteSettings.contactInfo.phone.replace(/\s/g, '')}`} 
            className="call-button"
          >
            <img src="/icons/telephone.svg" alt="" width={18} height={18} />
            Позвонить
          </a>
          <a 
            href="https://t.me/cameras_kz" 
            className="top-bar-social telegram-icon" 
            title="Telegram" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <FaTelegramPlane size={24} />
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button className="mobile-menu-btn" onClick={toggleMenu}>
          <span className={`hamburger ${isMenuOpen ? 'active' : ''}`}></span>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`mobile-menu-overlay ${isMenuOpen ? 'active' : ''}`} onClick={closeMenu}>
        <div className="mobile-menu-content" onClick={(e) => e.stopPropagation()}>
          <div className="mobile-menu-header">
            <div className="mobile-title">
              <picture>
                <source srcSet="/logo_mobile.jpg" type="image/jpeg" />
                <img src="/logo_mobile.jpg" alt="Cameras.kz" className="mobile-logo-image" />
              </picture>
            </div>
          </div>
          
          {/* Mobile Navigation */}
          <nav className="mobile-nav">
            <Link to="/" onClick={closeMenu}>Главная</Link>
            <Link to="/services" onClick={closeMenu}>Услуги</Link>
            <Link to="/catalog" onClick={closeMenu}>Каталог</Link>
            <Link to="/about" onClick={closeMenu}>О компании</Link>
            <Link to="/contacts" onClick={closeMenu}>Контакты</Link>
          </nav>

          {/* Mobile Contact Info */}
          <div className="mobile-contacts">
            <div className="mobile-contact-item">
              <div className="mobile-contact-label">Адрес:</div>
              <div className="mobile-contact-value">
                {siteSettings.contactInfo?.address || 'Бокейханова 510'}
              </div>
            </div>
            <div className="mobile-contact-item">
              <div className="mobile-contact-label">Email:</div>
              <a href={`mailto:${siteSettings.contactInfo.email}`} className="mobile-contact-value">
                {siteSettings.contactInfo.email}
              </a>
            </div>
            <div className="mobile-contact-item">
              <div className="mobile-contact-label">Телефон:</div>
              <a 
                href={`tel:${siteSettings.contactInfo.phone.replace(/\s/g, '')}`} 
                className="mobile-contact-value"
              >
                {siteSettings.contactInfo.phone}
              </a>
            </div>
            <div className="mobile-socials">
              <a 
                href={`https://wa.me/${siteSettings.contactInfo.phone.replace(/\D/g, '')}`} 
                className="mobile-social" 
                title="WhatsApp" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <img src="/icons/whatsapp-whats-app.svg" alt="WhatsApp" width={24} height={24} />
              </a>
              <a 
                href="https://www.instagram.com/cameras.kz" 
                className="mobile-social" 
                title="Instagram" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <img src="/icons/instagram.svg" alt="Instagram" width={24} height={24} />
              </a>
              <a 
                href="https://www.facebook.com/cameras.kz" 
                className="mobile-social" 
                title="Facebook" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <img src="/icons/facebook.svg" alt="Facebook" width={24} height={24} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 