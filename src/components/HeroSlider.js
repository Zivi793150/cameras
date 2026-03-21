import React from 'react';
import '../styles/HeroSlider.css';

const slides = [
  {
    id: 'home',
    image: '/banner.png'
  },
  {
    id: 'business',
    image: '/banner.png'
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
      role="region"
      aria-label="Главный баннер"
    >
      <img src={s.image} alt="" className="hero-slider__image" />
    </section>
  );
};

export default HeroSlider;
