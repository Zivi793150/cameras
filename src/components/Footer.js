import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Footer.css';

const Footer = () => {
  const location = useLocation();
  const [siteSettings, setSiteSettings] = useState({
    city: 'Алматы',
    contactInfo: {
      phone: '+7 707 517 73 85',
      email: 'info@cameras.kz',
      address: 'Алматы'
    },
    workingHours: 'Пн-Пт: 9:00-18:00',
    deliveryInfo: {
      freeDelivery: 'Доставка по Алматы',
      pickupAddress: 'Алматы',
      deliveryNote: 'Срок доставки рассчитывается менеджером после оформления заказа'
    },
    paymentMethods: 'Kaspi, Visa, наличные',
    companyInfo: {
      name: 'A-Market',
      bin: '940727401776',
      iik: 'KZ04722S000042260245',
      kbe: '19',
      bank: ''
    }
  });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/information')
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        if (data && data.information) {
          setSiteSettings(prev => ({
            ...prev,
            ...data.information,
            contactInfo: { ...prev.contactInfo, ...(data.information.contactInfo || {}) },
            deliveryInfo: { ...prev.deliveryInfo, ...(data.information.deliveryInfo || {}) },
            companyInfo: { ...prev.companyInfo, ...(data.information.companyInfo || {}) }
          }));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-column">
          <h4>Реквизиты</h4>
          <ul>
            <li>{siteSettings.companyInfo.name}</li>
            <li>БИН: {siteSettings.companyInfo.bin}</li>
            <li>Юр. адрес: {siteSettings.city || 'Алматы'}</li>
            <li>КБЕ: {siteSettings.companyInfo.kbe}, ИИК: {siteSettings.companyInfo.iik}</li>
            {siteSettings.companyInfo.bank ? <li>{siteSettings.companyInfo.bank}</li> : null}
          </ul>
        </div>
        
        <div className="footer-column">
          <h4>Контакты</h4>
          <ul>
            <li>
              <img src="/icons/telephone.svg" alt="Телефон" width={16} height={16} style={{display:'inline-block', marginRight:'8px', verticalAlign:'middle'}} />
              <a 
                href={`tel:${siteSettings.contactInfo.phone.replace(/\s/g, '')}`} 
                style={{color: 'inherit', textDecoration: 'none'}}
              >
                {siteSettings.contactInfo.phone}
              </a>
            </li>
            <li>
              ✉ <a href={`mailto:${siteSettings.contactInfo.email}`} style={{color: 'inherit', textDecoration: 'none'}}>
                {siteSettings.contactInfo.email}
              </a>
            </li>
            <li>
              <img src="/icons/map.svg" alt="Адрес" width={16} height={16} style={{display:'inline-block', marginRight:'8px', verticalAlign:'middle'}} />
              {siteSettings.contactInfo?.address || 'Алматы, Казахстан'}
            </li>
            <li>
              <img src="/icons/clock.svg" alt="Часы" width={16} height={16} style={{display:'inline-block', marginRight:'8px', verticalAlign:'middle'}} />
              {siteSettings.workingHours || 'Пн-Пт: 9:00-18:00'}
            </li>
          </ul>
        </div>
        
        <div className="footer-column">
          <h4>Политика</h4>
          <ul>
            <li><Link to="/policy">Политика конфиденциальности</Link></li>
            <li><Link to="/policy">Условия использования</Link></li>
            <li><Link to="/policy">Условия доставки</Link></li>
            <li><Link to="/policy">Способы оплаты</Link></li>
            {/* Social links removed by request */}
          </ul>
        </div>
        
        <div className="footer-column">
          <h4>Доставка и оплата</h4>
          <ul>
            <li>
              <img src="/icons/truck.svg" alt="Доставка" width={16} height={16} style={{display:'inline-block', marginRight:'8px', verticalAlign:'middle'}} />
              {siteSettings.deliveryInfo?.freeDelivery || 'Доставка по Алматы'}
            </li>
            <li>
              <img src="/icons/box.svg" alt="Самовывоз" width={16} height={16} style={{display:'inline-block', marginRight:'8px', verticalAlign:'middle'}} />
              Самовывоз: {siteSettings.deliveryInfo?.pickupAddress || 'Алматы, Казахстан'}
            </li>
            <li>
              <img src="/icons/card.svg" alt="Оплата" width={16} height={16} style={{display:'inline-block', marginRight:'8px', verticalAlign:'middle'}} />
              {siteSettings.paymentMethods || 'Kaspi, Visa, наличные'}
            </li>
            <li>
              <img src="/icons/lightning.svg" alt="Быстро" width={16} height={16} style={{display:'inline-block', marginRight:'8px', verticalAlign:'middle'}} />
              {siteSettings.deliveryInfo?.deliveryNote || 'Быстрая обработка заказов'}
            </li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>© 2019-2026 Cameras.kz. Все права защищены.</p>
      </div>
    </footer>
  );
};

export default Footer; 