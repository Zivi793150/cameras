import React from 'react';
import '../styles/HeroFeaturesRow.css';

const features = [
  {
    id: 'free',
    icon: '/icons/gui-price-tag.svg',
    title: 'Выезд и смета — 0 ₸',
    text: 'Замер и расчет в день обращения.'
  },
  {
    id: 'original',
    icon: '/icons/check-mark.svg',
    title: '100% Оригинал',
    text: 'Только проверенное оборудование с гарантией.'
  },
  {
    id: 'fast',
    icon: '/icons/clock.svg',
    title: 'Монтаж за 24 часа',
    text: 'Чистая установка без пыли и лишних проводов.'
  },
  {
    id: 'phone',
    icon: '/icons/telephone.svg',
    title: 'Доступ в смартфоне',
    text: 'Ваш объект под контролем 24/7 из любой точки.'
  },
  {
    id: 'warranty',
    icon: '/icons/checklist.svg',
    title: 'Гарантия 3 года',
    text: 'Официальный договор и сервисная поддержка.'
  }
];

const HeroFeaturesRow = () => {
  return (
    <section className="hero-features" aria-label="Преимущества">
      <div className="hero-features__container">
        <div className="hero-features__grid">
          {features.map((f) => (
            <div key={f.id} className="hero-features__item">
              <div className="hero-features__icon" aria-hidden="true">
                <img src={f.icon} alt="" />
              </div>
              <div className="hero-features__text">
                <div className="hero-features__title">{f.title}</div>
                <div className="hero-features__desc">{f.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroFeaturesRow;
