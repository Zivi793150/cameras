import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/WhyChooseUsSection.css';

const items = [
  {
    id: 'free',
    icon: '/icons/gui-price-tag.svg',
    title: 'Выезд и смета — 0 ₸',
    text: 'Замер и расчет в день обращения.',
    cta: 'Смотреть примеры →'
  },
  {
    id: 'original',
    icon: '/icons/check-mark.svg',
    title: '100% Оригинал',
    text: 'Только проверенное оборудование с гарантией.',
    cta: 'Подобрать комплект →'
  },
  {
    id: 'training',
    icon: '/icons/checklist.svg',
    title: 'Обучение и настройка',
    text: 'Покажем, как управлять системой и смотреть архив за 15 минут.',
    cta: 'Посмотреть демо →'
  },
  {
    id: 'fast',
    icon: '/icons/clock.svg',
    title: 'Монтаж за 24 часа',
    text: 'Чистая установка без пыли и лишних проводов.',
    cta: 'Узнать сроки →'
  },
  {
    id: 'aesthetic',
    icon: '/icons/check-mark.svg',
    title: 'Эстетичный монтаж',
    text: 'Установка без лишних проводов с сохранением вашего интерьера.',
    cta: 'Смотреть примеры →'
  },
  {
    id: 'phone',
    icon: '/icons/telephone.svg',
    title: 'Доступ в смартфоне',
    text: 'Ваш объект под контролем 24/7 из любой точки мира.',
    cta: 'Как это работает →'
  },
  {
    id: 'clarity',
    icon: '/icons/clock.svg',
    title: 'Четкость в деталях',
    text: 'Идеальная видимость лиц и госномеров даже в полной темноте.',
    cta: 'Смотреть качество →'
  },
  {
    id: 'warranty',
    icon: '/icons/checklist.svg',
    title: 'Гарантия 3 года',
    text: 'Официальный договор и сервисная поддержка.',
    cta: 'Условия сервиса →'
  }
];

const WhyChooseUsSection = () => {
  const left = items.slice(0, 4);
  const right = items.slice(4);

  return (
    <section className="why" aria-label="Преимущества">
      <div className="why__container">
        <div className="why__head">
          <div className="why__eyebrow">ПОЧЕМУ МЫ</div>
          <h2 className="why__title">Преимущества установки видеонаблюдения</h2>
          <div className="why__divider" />
          <p className="why__subtitle">
            Подбираем комплект под вашу задачу и аккуратно устанавливаем — чтобы система работала стабильно и была удобной каждый день.
          </p>
        </div>

        <div className="why__grid">
          <div className="why__col">
            {left.map((f) => (
              <div key={f.id} className="why__item">
                <div className="why__item-head">
                  <div className="why__icon" aria-hidden="true">
                    <img src={f.icon} alt="" />
                    <span className="why__dot" />
                  </div>
                  <h3 className="why__item-title">{f.title}</h3>
                </div>
                <p className="why__item-text">{f.text}</p>
                <div className="why__item-cta" aria-hidden="true">{f.cta}</div>
              </div>
            ))}
          </div>

          <div className="why__center" aria-hidden="true">
            <div className="why__card">
              <img className="why__image" src="/banner2.png" alt="" loading="lazy" />
              <div className="why__overlay" />
              <div className="why__card-actions">
                <Link className="why__center-btn" to="/catalog">
                  Каталог камер <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
            <div className="why__card-border" />
          </div>

          <div className="why__col">
            {right.map((f) => (
              <div key={f.id} className="why__item">
                <div className="why__item-head">
                  <div className="why__icon" aria-hidden="true">
                    <img src={f.icon} alt="" />
                    <span className="why__dot" />
                  </div>
                  <h3 className="why__item-title">{f.title}</h3>
                </div>
                <p className="why__item-text">{f.text}</p>
                <div className="why__item-cta" aria-hidden="true">{f.cta}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUsSection;
