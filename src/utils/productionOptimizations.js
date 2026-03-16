// Оптимизации для продакшена

// Функция для безопасного логирования (только в development)
export const safeLog = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

// Функция для безопасного логирования ошибок (всегда логируем ошибки)
export const safeError = (...args) => {
  console.error(...args);
};

// Функция для оптимизации изображений
export const optimizeImage = (src, width, height, format = 'webp') => {
  // В продакшене можно добавить логику для CDN или оптимизации изображений
  return src;
};

// Функция для предзагрузки критических ресурсов
export const preloadCriticalResources = () => {
  // Предзагрузка критических изображений
  const criticalImages = [
    '/images/hero/hero-main.jpg',
    '/logo.png'
  ];
  
  criticalImages.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
};

// Функция для оптимизации API запросов
export const optimizedFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Cache-Control': 'max-age=3600', // 1 час кэширования для API
        ...options.headers
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    safeError('API request failed:', error);
    throw error;
  }
};

// Функция для отложенной загрузки неважных ресурсов
export const lazyLoadResources = () => {
  // Отложенная загрузка Google Maps
  const mapIframe = document.querySelector('iframe[src*="google.com/maps"]');
  if (mapIframe && !mapIframe.dataset.loaded) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          mapIframe.src = mapIframe.dataset.src;
          mapIframe.dataset.loaded = 'true';
          observer.unobserve(entry.target);
        }
      });
    });
    observer.observe(mapIframe);
  }
};

// Функция для оптимизации шрифтов
export const optimizeFonts = () => {
  // Предзагрузка критических шрифтов
  const criticalFonts = [
    '/fonts/Bounded-Regular.ttf',
    '/fonts/hemico.ttf'
  ];
  
  criticalFonts.forEach(font => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/ttf';
    link.crossOrigin = 'anonymous';
    link.href = font;
    document.head.appendChild(link);
  });
};

// Функция для очистки неиспользуемого CSS
export const cleanupUnusedCSS = () => {
  // В продакшене можно добавить логику для удаления неиспользуемых стилей
  // Это обычно делается на этапе сборки
};

// Функция для оптимизации JavaScript
export const optimizeJavaScript = () => {
  // Отложенная загрузка неважных скриптов
  const nonCriticalScripts = [
    // Добавить пути к неважным скриптам
  ];
  
  nonCriticalScripts.forEach(script => {
    const scriptElement = document.createElement('script');
    scriptElement.src = script;
    scriptElement.async = true;
    document.body.appendChild(scriptElement);
  });
};

// Основная функция инициализации оптимизаций
export const initializeOptimizations = () => {
  if (process.env.NODE_ENV === 'production') {
    preloadCriticalResources();
    optimizeFonts();
    lazyLoadResources();
    optimizeJavaScript();
  }
}; 