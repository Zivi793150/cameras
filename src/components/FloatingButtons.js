import React, { useEffect, useState } from 'react';
import '../styles/FloatingButtons.css';

const FloatingButtons = () => {
  const [hiddenByMenu, setHiddenByMenu] = useState(false);
  const phoneNumber = '+7 707 517 73 85';
  const phoneNumberClean = '+77075177385';
  const whatsappUrl = `https://wa.me/${phoneNumberClean.replace(/\s/g, '')}`;

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const check = () => {
      const has = document.body.classList.contains('menu-open');
      setHiddenByMenu(has);
      try { console.debug('[FloatingButtons] body.menu-open =', has); } catch (e) {}
    };
    check();
    const obs = new MutationObserver(mutations => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'class') {
          check();
          break;
        }
      }
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const handleWhatsAppClick = (e) => {
    e.preventDefault();
    window.open(whatsappUrl, '_blank');
  };

  const handlePhoneClick = (e) => {
    e.preventDefault();
    setTimeout(() => {
      window.location.href = `tel:${phoneNumberClean}`;
    }, 150);
  };

  return (
    <div
      className="floating-buttons"
      style={hiddenByMenu ? { transform: 'translateY(120%)', opacity: 0, pointerEvents: 'none' } : undefined}
    >
      <a 
        href={whatsappUrl}
        className="floating-btn whatsapp-btn" 
        onClick={handleWhatsAppClick}
        aria-label="Написать в WhatsApp"
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" fill="currentColor"/>
        </svg>
        <span>WhatsApp</span>
      </a>
      
      <a 
        href={`tel:${phoneNumberClean}`}
        className="floating-btn phone-btn" 
        onClick={handlePhoneClick}
        aria-label="Позвонить"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19c-.54 0-.99.45-.99.99 0 9.36 7.6 16.96 16.96 16.96.54 0 .99-.45.99-.99v-3.5c0-.54-.45-.99-.99-.99z" fill="currentColor"/>
        </svg>
        <span>Позвонить</span>
      </a>
    </div>
  );
};

export default FloatingButtons; 