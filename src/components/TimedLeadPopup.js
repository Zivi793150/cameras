import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { sendToTelegram, validateForm } from '../utils/telegram';
import '../styles/TimedLeadPopup.css';

const STORAGE_KEY_SESSION_SHOWN = 'lead_popup_shown_session_v2';

const INACTIVITY_DELAY_MS = 12000;
const PRODUCT_SCROLL_NO_CLICK_DELAY_MS = 7000;
const HEADER_REACH_DELAY_MS = 5000;
const FOOTER_REACH_DELAY_MS = 5000;

const TimedLeadPopup = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({ name: '', phone: '', message: '' });

  const timersRef = useRef({ inactivity: null, productScroll: null, headerReach: null, footerReach: null });
  const hasAnyClickOnProductPageRef = useRef(false);
  const startedProductScrollTimerRef = useRef(false);
  const footerObserverRef = useRef(null);
  const headerObserverRef = useRef(null);
  const hasLeftHeaderOnceRef = useRef(false);

  const isProductPage = useMemo(() => {
    const path = location.pathname || '';
    if (path.startsWith('/product/')) return true;
    if (path.startsWith('/catalog')) return true;
    if (/^\/catalog\/.+\/.+/.test(path)) return true;
    return false;
  }, [location.pathname]);

  const isAdminPage = useMemo(() => {
    const path = location.pathname || '';
    return path.startsWith('/admin');
  }, [location.pathname]);

  const clearTimers = () => {
    if (timersRef.current.inactivity) clearTimeout(timersRef.current.inactivity);
    if (timersRef.current.productScroll) clearTimeout(timersRef.current.productScroll);
    if (timersRef.current.headerReach) clearTimeout(timersRef.current.headerReach);
    if (timersRef.current.footerReach) clearTimeout(timersRef.current.footerReach);
    timersRef.current.inactivity = null;
    timersRef.current.productScroll = null;
    timersRef.current.headerReach = null;
    timersRef.current.footerReach = null;
  };

  const markShown = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY_SESSION_SHOWN, '1');
    } catch (e) {}
  };

  const wasShownThisSession = () => {
    try {
      return sessionStorage.getItem(STORAGE_KEY_SESSION_SHOWN) === '1';
    } catch (e) {
      return false;
    }
  };

  const open = () => {
    if (isOpen) return;
    if (wasShownThisSession()) return;
    setIsOpen(true);
    markShown();
  };

  const close = () => {
    setIsOpen(false);
  };

  const scheduleInactivity = () => {
    if (timersRef.current.inactivity) clearTimeout(timersRef.current.inactivity);
    timersRef.current.inactivity = setTimeout(() => {
      open();
    }, INACTIVITY_DELAY_MS);
  };

  useEffect(() => {
    if (isAdminPage) return;
    if (wasShownThisSession()) return;

    clearTimers();

    hasAnyClickOnProductPageRef.current = false;
    startedProductScrollTimerRef.current = false;
    hasLeftHeaderOnceRef.current = false;

    scheduleInactivity();

    const onAnyActivity = () => {
      if (!isOpen) scheduleInactivity();
    };

    const onProductPageClick = () => {
      onAnyActivity();
      if (!isProductPage) return;
      hasAnyClickOnProductPageRef.current = true;
      if (timersRef.current.productScroll) {
        clearTimeout(timersRef.current.productScroll);
        timersRef.current.productScroll = null;
      }
    };

    const onProductPageScroll = () => {
      if (!isProductPage) return;
      if (isOpen) return;
      if (hasAnyClickOnProductPageRef.current) return;
      if (startedProductScrollTimerRef.current) return;

      startedProductScrollTimerRef.current = true;
      if (timersRef.current.productScroll) clearTimeout(timersRef.current.productScroll);
      timersRef.current.productScroll = setTimeout(() => {
        if (!hasAnyClickOnProductPageRef.current) open();
      }, PRODUCT_SCROLL_NO_CLICK_DELAY_MS);
    };

    const activityEvents = ['mousemove', 'touchstart', 'keydown'];
    activityEvents.forEach(evt => window.addEventListener(evt, onAnyActivity, { passive: true }));
    window.addEventListener('click', onAnyActivity, true);
    window.addEventListener('click', onProductPageClick, true);
    window.addEventListener('scroll', onProductPageScroll, { passive: true });

    const footerEl = document.querySelector('footer.footer');
    if (footerEl && typeof IntersectionObserver !== 'undefined') {
      footerObserverRef.current = new IntersectionObserver(
        entries => {
          const anyVisible = entries.some(e => e.isIntersecting);
          if (!anyVisible) {
            if (timersRef.current.footerReach) {
              clearTimeout(timersRef.current.footerReach);
              timersRef.current.footerReach = null;
            }
            return;
          }

          if (isOpen) return;
          if (wasShownThisSession()) return;
          if (timersRef.current.footerReach) return;
          timersRef.current.footerReach = setTimeout(() => {
            open();
          }, FOOTER_REACH_DELAY_MS);
        },
        { root: null, threshold: 0.2 }
      );
      footerObserverRef.current.observe(footerEl);
    }

    const headerEl = document.querySelector('header.header');
    if (headerEl && typeof IntersectionObserver !== 'undefined') {
      headerObserverRef.current = new IntersectionObserver(
        entries => {
          const anyVisible = entries.some(e => e.isIntersecting);
          if (!anyVisible) {
            hasLeftHeaderOnceRef.current = true;
            if (timersRef.current.headerReach) {
              clearTimeout(timersRef.current.headerReach);
              timersRef.current.headerReach = null;
            }
            return;
          }

          if (isOpen) return;
          if (wasShownThisSession()) return;
          if (!hasLeftHeaderOnceRef.current) return;
          if (timersRef.current.headerReach) return;

          timersRef.current.headerReach = setTimeout(() => {
            open();
          }, HEADER_REACH_DELAY_MS);
        },
        { root: null, threshold: 0.8 }
      );
      headerObserverRef.current.observe(headerEl);
    }

    return () => {
      clearTimers();
      activityEvents.forEach(evt => window.removeEventListener(evt, onAnyActivity));
      window.removeEventListener('click', onAnyActivity, true);
      window.removeEventListener('click', onProductPageClick, true);
      window.removeEventListener('scroll', onProductPageScroll);
      if (footerObserverRef.current) {
        try {
          footerObserverRef.current.disconnect();
        } catch (e) {}
        footerObserverRef.current = null;
      }

      if (headerObserverRef.current) {
        try {
          headerObserverRef.current.disconnect();
        } catch (e) {}
        headerObserverRef.current = null;
      }
    };
  }, [isAdminPage, isProductPage, isOpen, location.pathname]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'name') {
      const v = String(value || '').trim();
      const emailLike = /@/.test(v) || /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i.test(v);
      if (!v || v.length < 2 || emailLike) {
        setErrors(prev => ({ ...prev, name: 'Введите, пожалуйста, имя' }));
        return;
      }
      if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
      return;
    }

    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = validateForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        message: String(formData.message || '').trim()
      };
      const result = await sendToTelegram(payload, null);
      if (result.success) {
        setFormData({ name: '', phone: '', message: '' });
        setErrors({});
        close();
        navigate('/thanks');
      } else {
        alert('Ошибка отправки заявки. Попробуйте позже.');
      }
    } catch (error) {
      alert('Ошибка отправки заявки. Попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="lead-popup-overlay" onClick={close}>
      <div className="lead-popup-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="lead-popup-header">
          <div className="lead-popup-title">Нужна система видеонаблюдения?</div>
          <button className="lead-popup-close" onClick={close} aria-label="Закрыть">×</button>
        </div>

        <div className="lead-popup-subtitle">
          Подберем оптимальное решение для вашего дома или бизнеса за 2 минуты. Оставьте заявку, и мы свяжемся с вами прямо сейчас
        </div>

        <form onSubmit={handleSubmit} className="lead-popup-form">
          <div className="lead-popup-field">
            <label htmlFor="lead-name">Имя *</label>
            <input
              id="lead-name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <div className="lead-popup-error">{errors.name}</div>}
          </div>

          <div className="lead-popup-field">
            <label htmlFor="lead-phone">Номер телефон *</label>
            <input
              id="lead-phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              className={errors.phone ? 'error' : ''}
              placeholder="+7 (777) 777-77-77"
            />
            {errors.phone && <div className="lead-popup-error">{errors.phone}</div>}
          </div>

          <div className="lead-popup-field">
            <label htmlFor="lead-message">Текст</label>
            <textarea
              id="lead-message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={4}
              placeholder="Опишите ваш запрос..."
            />
          </div>

          <button className="lead-popup-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Отправка...' : 'Жду звонка'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TimedLeadPopup;
