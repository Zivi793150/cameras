import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Modal from '../components/Modal';
import '../styles/Contacts.css';
import Seo from '../components/Seo';

const Contacts = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const handleSubmitForm = () => {};
  const handleSocialClick = (platform) => {
    const urls = {
      WhatsApp: `https://wa.me/${'+77075177385'.replace(/\\s/g, '')}`,
      Instagram: 'https://www.instagram.com/cameras.kz',
      Facebook: 'https://www.facebook.com/cameras.kz'
    };
    const url = urls[platform];
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="contacts">
      <Seo
        title="Контакты — Cameras.kz"
        description="Контакты Cameras.kz: телефон, адрес в Алматы, карта проезда и социальные сети. Продажа и установка систем видеонаблюдения."
        canonical="https://cameras.kz/contacts"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: 'Cameras.kz',
          url: 'https://cameras.kz',
          telephone: '+77075177385',
          email: 'info@cameras.kz',
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Алматы',
            streetAddress: 'Алматы, Казахстан'
          }
        }}
      />
      <Header />
      <main className="contacts-main">
        <div className="container">
          <h1 className="contacts-title">Контакты</h1>
          <div className="contacts-content">
            <div className="contacts-grid">
              <div className="contact-card">
                <div className="contact-card-header"><span className="contact-card-icon"><img src="/icons/telephone.svg" alt="Телефон" width={24} height={24} loading="lazy" /></span><span>Телефоны</span></div>
                <div className="contact-card-content">
                  <a 
                    href="tel:+77075177385" 
                    style={{color: 'inherit', textDecoration: 'none'}}
                  >
                    +7 707 517 73 85
                  </a>
                </div>
              </div>
              <div className="contact-card">
                <div className="contact-card-header"><span className="contact-card-icon">✉</span><span>Email</span></div>
                <div className="contact-card-content">info@cameras.kz</div>
              </div>
              <div className="contact-card">
                <div className="contact-card-header"><span className="contact-card-icon"><img src="/icons/map.svg" alt="Адрес" width={24} height={24} loading="lazy" /></span><span>Адрес</span></div>
                <div className="contact-card-content">г. Алматы, Казахстан</div>
              </div>
              <div className="contact-card">
                <div className="contact-card-header"><span className="contact-card-icon"><img src="/icons/clock.svg" alt="Часы" width={24} height={24} loading="lazy" /></span><span>Режим работы</span></div>
                <div className="contact-card-content">Пн-Пт: 9:00 - 18:00<br />Сб: 10:00 - 16:00</div>
              </div>
            </div>
            <div className="contact-form">
              <h2>Напишите нам</h2>
              <p>Оставьте сообщение, и мы свяжемся с вами в ближайшее время</p>
              <button className="btn-contact-form" onClick={handleOpenModal}>Отправить сообщение</button>
              <div className="social-links">
                <h3>Мы в социальных сетях</h3>
                <div className="social-grid">
                  <button className="social-link" onClick={() => handleSocialClick('WhatsApp')}><span className="social-icon"><img src="/icons/whatsapp-whats-app.svg" alt="WhatsApp" width={24} height={24} loading="lazy" /></span><span>WhatsApp</span></button>
                  <button className="social-link" onClick={() => handleSocialClick('Instagram')}><span className="social-icon"><img src="/icons/instagram.svg" alt="Instagram" width={24} height={24} loading="lazy" /></span><span>Instagram</span></button>
                  <button className="social-link" onClick={() => handleSocialClick('Facebook')}><span className="social-icon"><img src="/icons/facebook.svg" alt="Facebook" width={24} height={24} loading="lazy" /></span><span>Facebook</span></button>
                </div>
              </div>
            </div>
          </div>
          <section className="map-section">
            <h2>Как нас найти</h2>
            <div className="map-container">
              <iframe
                title="Google Maps"
                src="https://www.google.com/maps?q=43.2940184517486,76.89570878867801&z=18&output=embed"
                width="100%"
                height="520"
                style={{ border: 0, borderRadius: '8px' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </section>
        </div>
      </main>
      <Footer />
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} onSubmit={handleSubmitForm} />
    </div>
  );
};

export default Contacts; 