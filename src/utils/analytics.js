/* global ym, gtag */

// Самописная аналитика (серверные события /api/analytics/*) отключена по ТЗ.
// При этом Google Tag Manager / gtag / Яндекс.Метрика оставлены и продолжают работать.

// Отправка события в самописную аналитику отключена
const trackEvent = async () => {};

const pushToDataLayer = (eventName, params = {}) => {
  try {
    if (typeof window === 'undefined') return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...params });
  } catch (e) {}
};

// Отслеживание клика на телефон
export const trackPhoneClick = (phoneNumber, context = '') => {
  trackEvent('phone_click', {
    phoneNumber,
    context,
    buttonText: 'Позвонить'
  });

  pushToDataLayer('phone_click', {
    phone_number: phoneNumber,
    phone_context: context,
    button_text: 'Позвонить'
  });

  if (typeof ym !== 'undefined') {
    try {
      ym(104706911, 'reachGoal', 'PHONE_CLICK');
      if (context) {
        const contextGoal = `PHONE_CLICK_${context.toUpperCase()}`;
        ym(104706911, 'reachGoal', contextGoal);
      }
    } catch (error) {
      console.warn('Ошибка отправки цели в Яндекс.Метрику:', error);
    }
  }

  if (typeof gtag !== 'undefined') {
    try {
      gtag('event', 'phone_click', {
        phone_number: phoneNumber,
        phone_context: context
      });
    } catch (error) {
      console.warn('Ошибка отправки события в Google Analytics:', error);
    }
  }
};

// Отслеживание клика на социальные сети
export const trackSocialClick = (platform, context = '', url = '') => {
  trackEvent('social_click', { platform, context, url });

  pushToDataLayer('social_click', {
    social_platform: platform,
    social_context: context,
    social_url: url
  });

  if (typeof ym !== 'undefined') {
    try {
      ym(104706911, 'reachGoal', 'SOCIAL_CLICK');
      const goalName = `SOCIAL_${platform.toUpperCase()}`;
      ym(104706911, 'reachGoal', goalName);
      if (context) {
        const contextGoal = `SOCIAL_${platform.toUpperCase()}_${context.toUpperCase()}`;
        ym(104706911, 'reachGoal', contextGoal);
      }
    } catch (error) {
      console.warn('Ошибка отправки цели в Яндекс.Метрику:', error);
    }
  }

  if (typeof gtag !== 'undefined') {
    try {
      gtag('event', 'social_click', {
        social_platform: platform,
        social_context: context,
        social_url: url
      });
    } catch (error) {
      console.warn('Ошибка отправки события в Google Analytics:', error);
    }
  }
};

// Отслеживание просмотра товара (расширенное)
export const trackProductView = (productId, productName, productPrice = null, productCategory = null) => {
  trackEvent('product_view', { productName, productPrice, productCategory }, productId);

  if (typeof gtag !== 'undefined') {
    try {
      gtag('event', 'view_item', {
        currency: 'KZT',
        value: productPrice || 0,
        items: [
          {
            item_id: productId,
            item_name: productName,
            item_category: productCategory || 'Не указана',
            price: productPrice || 0,
            quantity: 1
          }
        ]
      });
    } catch (error) {
      console.warn('Ошибка отправки view_item в Google Analytics:', error);
    }
  }

  if (typeof ym !== 'undefined') {
    try {
      ym(104706911, 'reachGoal', 'PRODUCT_VIEW', {
        product_id: productId,
        product_name: productName,
        product_price: productPrice,
        product_category: productCategory
      });
    } catch (error) {
      console.warn('Ошибка отправки PRODUCT_VIEW в Яндекс.Метрику:', error);
    }
  }
};

// Отслеживание отправки формы
export const trackFormSubmit = (formType, productId = null) => {
  trackEvent('form_submit', { formType }, productId);

  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'form_submit',
      formType,
      productId: productId || null,
      page: window.location.pathname
    });
  } catch (err) {
    console.warn('dataLayer push failed:', err);
  }

  if (typeof gtag !== 'undefined') {
    try {
      gtag('event', 'form_submit', {
        form_type: formType,
        product_id: productId || null
      });
    } catch (error) {
      console.warn('Ошибка отправки form_submit в Google Analytics:', error);
    }
  }

  if (typeof ym !== 'undefined') {
    try {
      ym(104706911, 'reachGoal', 'FORM_SUBMIT', { form_type: formType });
    } catch (error) {
      console.warn('Ошибка отправки FORM_SUBMIT в Яндекс.Метрику:', error);
    }
  }
};

// Отслеживание завершения покупки
export const trackPurchaseComplete = (orderId, productId, productName, price, context = '') => {
  trackEvent('purchase_complete', { orderId, productName, price, context }, productId);

  if (typeof ym !== 'undefined') {
    try {
      ym(104706911, 'reachGoal', 'PURCHASE_COMPLETE', {
        order_id: orderId,
        product_id: productId,
        product_name: productName,
        price
      });
      if (context) {
        const contextGoal = `PURCHASE_COMPLETE_${context.toUpperCase()}`;
        ym(104706911, 'reachGoal', contextGoal);
      }
    } catch (error) {
      console.warn('Ошибка отправки цели в Яндекс.Метрику:', error);
    }
  }

  if (typeof gtag !== 'undefined') {
    try {
      gtag('event', 'purchase', {
        transaction_id: orderId,
        currency: 'KZT',
        value: price,
        items: [{ item_id: productId, item_name: productName, price, quantity: 1 }]
      });
    } catch (error) {
      console.warn('Ошибка отправки события в Google Analytics:', error);
    }
  }
};

// Отслеживание клика на кнопку
export const trackButtonClick = (buttonText, context = '', productId = null) => {
  trackEvent('button_click', { buttonText, context }, productId);
};

// Отслеживание покупки (переход к оформлению заказа)
export const trackPurchaseStart = (productId, productName, price, context = '') => {
  trackEvent('purchase_start', { productName, price, context }, productId);

  if (typeof ym !== 'undefined') {
    try {
      ym(104706911, 'reachGoal', 'PURCHASE_START', {
        product_id: productId,
        product_name: productName,
        price
      });
      if (context) {
        const contextGoal = `PURCHASE_START_${context.toUpperCase()}`;
        ym(104706911, 'reachGoal', contextGoal);
      }
    } catch (error) {
      console.warn('Ошибка отправки цели в Яндекс.Метрику:', error);
    }
  }

  if (typeof gtag !== 'undefined') {
    try {
      gtag('event', 'begin_checkout', {
        currency: 'KZT',
        value: price,
        items: [{ item_id: productId, item_name: productName, price, quantity: 1 }]
      });
    } catch (error) {
      console.warn('Ошибка отправки события в Google Analytics:', error);
    }
  }
};

// Отслеживание просмотра страницы
export const trackPageView = (pageName) => {
  trackEvent('page_view', { pageName });
};

// Отслеживание поиска (для будущего функционала)
export const trackSearch = (searchTerm, resultsCount = 0) => {
  trackEvent('search', { searchTerm, resultsCount });
};

// Отслеживание просмотра категории
export const trackCategoryView = (categoryName, categoryId, productsCount = 0) => {
  trackEvent('category_view', { categoryName, categoryId, productsCount });
};

// Автоматическое отслеживание при загрузке страницы
export const initPageTracking = () => {
  const pageName = window.location.pathname;
  trackPageView(pageName);

  document.addEventListener('click', (e) => {
    const target = e.target;
    const link = target.closest('a');

    if (link && link.href && link.href.startsWith('tel:')) {
      const phoneNumber = link.href.replace('tel:', '');
      const context = link.closest('[data-analytics-context]')?.dataset.analyticsContext || 'auto_detect';
      trackPhoneClick(phoneNumber, context);
    }
  });
};
