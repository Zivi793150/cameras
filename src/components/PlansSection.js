import React from 'react';
import '../styles/PlansSection.css';

const plans = [
  {
    id: 'basic',
    name: 'Базовый',
    cameras: '2 камеры',
    audience: 'Квартира, небольшой магазин, кофейня',
    price: '65 000',
    currency: '₸',
    note: 'Включает оборудование и монтаж',
    accent: false,
    badge: null,
    items: [
      '2 Wi‑Fi камеры (2 Мп)',
      'Карта памяти 64 ГБ (на каждую камеру)',
      'До 20 м кабеля (свыше — по расчету)',
      'Настройка доступа на смартфон',
      'Гарантия 1 год на работы и оборудование'
    ]
  },
  {
    id: 'optimal',
    name: 'Оптимальный',
    cameras: '4 камеры',
    audience: 'Частный дом, офис до 100 м², аптека',
    price: '180 000',
    currency: '₸',
    note: 'Включает оборудование и монтаж',
    accent: true,
    badge: 'Популярный выбор',
    items: [
      '4 IP‑камеры (ночная съемка)',
      'Видеорегистратор + HDD',
      'Кабель/расходники по смете',
      'Настройка удаленного доступа',
      'Гарантия 2 года + поддержка'
    ]
  },
  {
    id: 'pro',
    name: 'Премиум',
    cameras: '8 камер',
    audience: 'Склад, магазин, офис, ЖК/подъезд',
    price: '320 000',
    currency: '₸',
    note: 'Включает оборудование и монтаж',
    accent: false,
    badge: null,
    items: [
      '8 IP‑камер (2–4 Мп)',
      'Видеорегистратор + HDD',
      'Монтаж и пуско‑наладка',
      'Удаленный доступ + обучение',
      'Гарантия 3 года + сервис'
    ]
  }
];

const PlansSection = ({ onLeadClick }) => {
  return (
    <section className="plans" aria-label="Готовые решения">
      <div className="plans__container">
        <div className="plans__head">
          <h2 className="plans__title">Готовые решения: <span>всё под ключ</span></h2>
          <div className="plans__subtitle">Выбирайте пакет под ваш объект — мы обеспечим оборудование, монтаж и настройку.</div>
        </div>

        <div className="plans__grid">
          {plans.map((p) => (
            <div key={p.id} className={`plans__card ${p.accent ? 'is-accent' : ''}`}>
              {p.badge ? (
                <div className="plans__badge" aria-hidden="true">{p.badge}</div>
              ) : null}

              <div className="plans__card-body">
                <div className="plans__plan-name">{p.name}</div>
                <div className="plans__plan-cameras">{p.cameras}</div>
                <div className="plans__audience">{p.audience}</div>

                <div className={`plans__price ${p.accent ? 'is-accent' : ''}`}>
                  <span className="plans__price-from">от</span>
                  <span className="plans__price-value">{p.price}</span>
                  <span className="plans__price-currency">{p.currency}</span>
                </div>

                <div className="plans__note">{p.note}</div>

                <ul className="plans__list">
                  {p.items.map((it) => (
                    <li key={it} className="plans__item">{it}</li>
                  ))}
                </ul>
              </div>

              <div className="plans__card-foot">
                <button
                  type="button"
                  className={`plans__btn ${p.accent ? 'is-accent' : ''}`}
                  onClick={() => (typeof onLeadClick === 'function' ? onLeadClick() : null)}
                >
                  Заказать монтаж
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlansSection;
