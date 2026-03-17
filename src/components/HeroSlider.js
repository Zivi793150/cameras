import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/HeroSlider.css';

const slides = [
  {
    id: 'home',
    eyebrow: 'Современные решения',
    title: 'Видеонаблюдение и безопасность',
    subtitle: 'Контроль 24/7 со смартфона. Установка под ключ в Алматы и по Казахстану.',
    image: '/banner1.png',
    brand: 'Cameras.kz',
    primaryCta: { label: 'Получить расчет', action: 'lead' },
    secondaryCta: { label: 'Смотреть каталог', to: '/catalog' },
    background: 'radial-gradient(circle at 20% 10%, rgba(30, 90, 230, 0.18), transparent 45%), radial-gradient(circle at 80% 30%, rgba(245, 179, 1, 0.14), transparent 50%), linear-gradient(90deg, rgba(248, 250, 252, 1) 0%, rgba(240, 244, 255, 1) 40%, rgba(255, 255, 255, 1) 100%)'
  },
  {
    id: 'home2',
    eyebrow: 'Для дома',
    title: 'Ваш дом под защитой',
    subtitle: 'Видеодомофоны, сигнализация, камеры в квартиру и коттедж — быстро и аккуратно.',
    image: '/banner3.png',
    brand: 'Cameras.kz',
    primaryCta: { label: 'Оставить заявку', action: 'lead' },
    secondaryCta: { label: 'Контакты', to: '/contacts' },
    background: 'radial-gradient(circle at 20% 10%, rgba(245, 179, 1, 0.12), transparent 45%), radial-gradient(circle at 80% 30%, rgba(30, 90, 230, 0.14), transparent 55%), linear-gradient(90deg, rgba(248, 250, 252, 1) 0%, rgba(255, 247, 237, 1) 42%, rgba(255, 255, 255, 1) 100%)'
  },
  {
    id: 'office',
    eyebrow: 'Для офиса и магазинов',
    title: 'Камеры, домофония, сигнализация',
    subtitle: 'Настроим доступ сотрудникам и владельцу. Быстрый запуск и поддержка.',
    image: '/banner4.jpg',
    brand: 'Cameras.kz',
    primaryCta: { label: 'Получить расчет', action: 'lead' },
    secondaryCta: { label: 'Каталог', to: '/catalog' },
    background: 'radial-gradient(circle at 22% 18%, rgba(14, 165, 233, 0.12), transparent 48%), radial-gradient(circle at 82% 28%, rgba(30, 90, 230, 0.14), transparent 55%), linear-gradient(90deg, rgba(248, 250, 252, 1) 0%, rgba(240, 244, 255, 1) 46%, rgba(255, 255, 255, 1) 100%)'
  },
  {
    id: 'support',
    eyebrow: 'Обслуживание',
    title: 'Поддержка после установки',
    subtitle: 'Обновления, настройка удаленного доступа, обслуживание и модернизация систем.',
    image: '/banner5.jpg',
    brand: 'Cameras.kz',
    primaryCta: { label: 'Оставить заявку', action: 'lead' },
    secondaryCta: { label: 'Контакты', to: '/contacts' },
    background: 'radial-gradient(circle at 25% 15%, rgba(245, 179, 1, 0.10), transparent 46%), radial-gradient(circle at 85% 35%, rgba(30, 90, 230, 0.14), transparent 52%), linear-gradient(90deg, rgba(248, 250, 252, 1) 0%, rgba(240, 249, 255, 1) 45%, rgba(255, 255, 255, 1) 100%)'
  }
];

const prefersReducedMotion = () => {
  try {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {
    return false;
  }
};

const clampIndex = (idx) => {
  const n = slides.length;
  return ((idx % n) + n) % n;
};

const HeroSlider = ({ onLeadClick }) => {
  const [index, setIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const touchRef = React.useRef({ x: 0, y: 0, active: false });

  const goTo = React.useCallback((nextIdx) => {
    setIndex(clampIndex(nextIdx));
  }, []);

  const next = React.useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = React.useCallback(() => goTo(index - 1), [goTo, index]);

  React.useEffect(() => {
    if (isPaused) return;
    if (prefersReducedMotion()) return;

    const id = setInterval(() => {
      setIndex((v) => clampIndex(v + 1));
    }, 8000);

    return () => clearInterval(id);
  }, [isPaused]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
  };

  const handleTouchStart = (e) => {
    const t = e.touches && e.touches[0];
    if (!t) return;
    touchRef.current = { x: t.clientX, y: t.clientY, active: true };
  };

  const handleTouchMove = (e) => {
    if (!touchRef.current.active) return;
    const t = e.touches && e.touches[0];
    if (!t) return;

    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e) => {
    if (!touchRef.current.active) return;
    const t = e.changedTouches && e.changedTouches[0];
    if (!t) return;

    const dx = t.clientX - touchRef.current.x;
    touchRef.current.active = false;

    if (Math.abs(dx) < 40) return;
    if (dx < 0) next();
    else prev();
  };

  const s = slides[index];

  const onPrimary = () => {
    if (s.primaryCta.action === 'lead') {
      if (typeof onLeadClick === 'function') onLeadClick();
    }
  };

  return (
    <section
      className="hero-slider"
      style={{ background: s.background }}
      role="region"
      aria-roledescription="carousel"
      aria-label="Главный баннер"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="hero-slider__container">
        <div className="hero-slider__grid">
          <div className="hero-slider__content">
            <div className="hero-slider__glass">
              <div className="hero-slider__eyebrow">{s.eyebrow}</div>
              <h1 className="hero-slider__title">{s.title}</h1>
              <div className="hero-slider__subtitle">{s.subtitle}</div>

              <div className="hero-slider__actions">
                <button type="button" className="ui-btn ui-btn--primary" onClick={onPrimary}>
                  {s.primaryCta.label}
                </button>
                <Link className="ui-btn ui-btn--secondary" to={s.secondaryCta.to}>
                  {s.secondaryCta.label}
                </Link>
              </div>
            </div>
          </div>

          <div className="hero-slider__visual" aria-hidden="true">
            <div className="hero-slider__visual-inner">
              <img className="hero-slider__image" src={s.image} alt="" />
              <div className="hero-slider__brand">{s.brand}</div>
            </div>
          </div>
        </div>

        <div className="hero-slider__dots" role="tablist" aria-label="Переключение слайдов">
          {slides.map((sl, i) => (
            <button
              key={sl.id}
              type="button"
              className={`hero-slider__dot ${i === index ? 'is-active' : ''}`}
              aria-label={`Слайд ${i + 1}`}
              aria-selected={i === index}
              role="tab"
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSlider;
