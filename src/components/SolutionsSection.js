import React from 'react';
import '../styles/SolutionsSection.css';

const homeFeatures = [
  {
    icon: '/icons/check-mark.svg',
    title: 'Видеонаблюдение 24/7',
    desc: 'Смотрите за домом, двором или парковкой в реальном времени прямо со смартфона.'
  },
  {
    icon: '/icons/telephone.svg',
    title: 'Охранная сигнализация',
    desc: 'Мгновенные уведомления о проникновении, открытии дверей или движении в комнатах.'
  },
  {
    icon: '/icons/clock.svg',
    title: 'Умный доступ',
    desc: 'Видеодомофоны и управление замками удаленно — открывайте дверь гостям, не вставая с дивана.'
  }
];

const businessFeatures = [
  {
    icon: '/icons/checklist.svg',
    title: 'Контроль доступа (СКД)',
    desc: 'Турникеты и считыватели с идентификацией по Face ID, отпечатку пальца или картам.'
  },
  {
    icon: '/icons/gui-price-tag.svg',
    title: 'Автоматизация въезда',
    desc: 'Шлагбаумы с распознаванием госномеров и управлением через мобильное приложение для ЖК и паркингов.'
  },
  {
    icon: '/icons/check-mark.svg',
    title: 'Пожарная безопасность',
    desc: 'Проектирование и монтаж систем оповещения и датчиков дыма согласно всем нормам и стандартам.'
  },
  {
    icon: '/icons/telephone.svg',
    title: 'Мониторинг территорий',
    desc: 'Видеонаблюдение для складов, магазинов и производств с функцией распознавания лиц и аналитикой событий.'
  }
];

const SolutionsSection = ({ onLeadClick }) => {
  return (
    <section className="solutions" aria-label="Решения">
      {/* Блок для дома */}
      <div className="solutions__block solutions__block--home">
        <div className="solutions__container">
          <div className="solutions__grid">
            <div className="solutions__content">
              <div className="solutions__label">Для дома</div>
              <h2 className="solutions__title">Безопасность вашего дома</h2>
              <p className="solutions__lead">
                Ваше спокойствие, где бы вы ни находились. Мы предлагаем готовые решения для квартир, частных домов и загородных коттеджей:
              </p>
              <ul className="solutions__list">
                {homeFeatures.map((f) => (
                  <li key={f.title} className="solutions__item">
                    <div className="solutions__icon" aria-hidden="true">
                      <img src={f.icon} alt="" />
                    </div>
                    <div className="solutions__text">
                      <div className="solutions__item-title">{f.title}</div>
                      <div className="solutions__item-desc">{f.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="solutions__cta"
                onClick={() => (typeof onLeadClick === 'function' ? onLeadClick() : null)}
              >
                Получить консультацию
              </button>
            </div>
            <div className="solutions__visual" aria-hidden="true">
              <div className="solutions__card solutions__card--home">
                <div className="solutions__card-bg" />
                <img src="/banner1.png" alt="" className="solutions__img" />
                <div className="solutions__card-badge">Умный дом</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Блок для бизнеса */}
      <div className="solutions__block solutions__block--business">
        <div className="solutions__container">
          <div className="solutions__grid solutions__grid--reverse">
            <div className="solutions__content">
              <div className="solutions__label">Для бизнеса и ЖК</div>
              <h2 className="solutions__title">Решения для бизнеса и ЖК</h2>
              <p className="solutions__lead">
                Эффективные решения для безопасности и контроля бизнеса. Минимизируйте риски и автоматизируйте процессы на вашем предприятии, в офисе или жилом комплексе:
              </p>
              <ul className="solutions__list">
                {businessFeatures.map((f) => (
                  <li key={f.title} className="solutions__item">
                    <div className="solutions__icon" aria-hidden="true">
                      <img src={f.icon} alt="" />
                    </div>
                    <div className="solutions__text">
                      <div className="solutions__item-title">{f.title}</div>
                      <div className="solutions__item-desc">{f.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="solutions__cta solutions__cta--outline"
                onClick={() => (typeof onLeadClick === 'function' ? onLeadClick() : null)}
              >
                Обсудить проект
              </button>
            </div>
            <div className="solutions__visual" aria-hidden="true">
              <div className="solutions__card solutions__card--business">
                <div className="solutions__card-bg" />
                <img src="/banner2.png" alt="" className="solutions__img" />
                <div className="solutions__card-badge">Бизнес решения</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionsSection;
