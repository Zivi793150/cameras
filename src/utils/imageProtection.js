// Защита изображений от копирования и скриншотов

export const initImageProtection = () => {
  // Блокировка контекстного меню на изображениях
  document.addEventListener('contextmenu', (e) => {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
      return false;
    }
  });

  // Блокировка перетаскивания изображений
  document.addEventListener('dragstart', (e) => {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
      return false;
    }
  });

  // Блокировка горячих клавиш для скриншотов и сохранения
  document.addEventListener('keydown', (e) => {
    // PrintScreen
    if (e.key === 'PrintScreen') {
      e.preventDefault();
      alert('Скриншоты запрещены на этом сайте');
      return false;
    }

    // Ctrl+S (сохранить)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      return false;
    }

    // Ctrl+Shift+S (сохранить как)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 's') {
      e.preventDefault();
      return false;
    }

    // F12, Ctrl+Shift+I, Ctrl+Shift+J (DevTools) - опционально
    if (
      e.key === 'F12' ||
      ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i')) ||
      ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'J' || e.key === 'j'))
    ) {
      // e.preventDefault(); // Раскомментируйте, если хотите заблокировать DevTools
      // return false;
    }
  });

  // Блокировка выделения изображений
  document.addEventListener('selectstart', (e) => {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
      return false;
    }
  });

  // Дополнительная защита: обнаружение потери фокуса (возможная попытка скриншота)
  let blurCount = 0;
  let lastBlur = 0;

  window.addEventListener('blur', () => {
    const now = Date.now();
    if (now - lastBlur < 2000) {
      blurCount++;
      if (blurCount > 3) {
        // Можно добавить водяной знак или другую защиту
        console.warn('Обнаружена возможная попытка скриншота');
      }
    } else {
      blurCount = 1;
    }
    lastBlur = now;
  });

  // Защита от копирования изображений через clipboard API
  document.addEventListener('copy', (e) => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      // Разрешаем копировать текст
      return true;
    }
    // Блокируем копирование изображений
    e.preventDefault();
    return false;
  });

  // Отключаем встроенное меню "Сохранить изображение как" на мобильных
  document.addEventListener('touchstart', (e) => {
    if (e.target.tagName === 'IMG') {
      e.target.style.webkitTouchCallout = 'none';
    }
  });

  console.log('Защита изображений активирована');
};

// Функция для добавления невидимого водяного знака
export const addWatermark = (imageElement) => {
  if (!imageElement || imageElement.tagName !== 'IMG') return;

  const wrapper = document.createElement('div');
  wrapper.style.position = 'relative';
  wrapper.style.display = 'inline-block';
  wrapper.style.userSelect = 'none';

  const watermark = document.createElement('div');
  watermark.textContent = 'ELTOK.KZ';
  watermark.style.position = 'absolute';
  watermark.style.top = '50%';
  watermark.style.left = '50%';
  watermark.style.transform = 'translate(-50%, -50%) rotate(-45deg)';
  watermark.style.fontSize = '48px';
  watermark.style.color = 'rgba(255, 255, 255, 0.1)';
  watermark.style.fontWeight = 'bold';
  watermark.style.pointerEvents = 'none';
  watermark.style.userSelect = 'none';
  watermark.style.zIndex = '10';

  if (imageElement.parentNode) {
    imageElement.parentNode.insertBefore(wrapper, imageElement);
    wrapper.appendChild(imageElement);
    wrapper.appendChild(watermark);
  }
};

export default initImageProtection;
