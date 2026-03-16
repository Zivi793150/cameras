const CACHE_NAME = 'electro-cache-v2';
const STATIC_CACHE = 'electro-static-v2';
const API_CACHE = 'electro-api-v2';

// Файлы для кэширования
const STATIC_FILES = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/logo.webp',
  '/logo.png',
  '/manifest.json'
];

// API endpoints для кэширования
const API_ENDPOINTS = [
  '/api/products',
  '/api/information',
  '/api/rate/usd-kzt'
];

// Установка Service Worker - без кеширования
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker установлен (кеширование отключено)');
  self.skipWaiting();
  // Не кешируем ничего при установке
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker активирован');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
            console.log('🗑️ Удаляем старый кэш:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Обрабатываем только GET запросы
  if (request.method !== 'GET') {
    return;
  }
  
  // API запросы
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Статические файлы
  if (url.origin === self.location.origin) {
    // Не перехватываем изображения и загрузки из /uploads — всегда из сети
    if (request.destination === 'image' || url.pathname.startsWith('/uploads/')) {
      event.respondWith(fetch(request));
      return;
    }
    event.respondWith(handleStaticRequest(request));
    return;
  }
});

// Обработка API запросов - без кеширования
async function handleApiRequest(request) {
  try {
    // Всегда получаем из сети, без кеширования
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('🌐 Сетевой запрос не удался');
    // Возвращаем ошибку вместо использования кэша
    return new Response(
      JSON.stringify({ error: 'Нет подключения к интернету' }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Обработка статических файлов - без кеширования
async function handleStaticRequest(request) {
  try {
    // Всегда загружаем из сети, без кеширования
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('❌ Ошибка загрузки статического файла:', error);
    
    // Возвращаем fallback для HTML только если это критично
    if (request.destination === 'document') {
      const fallback = await caches.match('/index.html');
      if (fallback) return fallback;
    }
    
    return new Response('Ошибка загрузки', { status: 503 });
  }
}

// Фоновая синхронизация
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Фоновая синхронизация');
    event.waitUntil(backgroundSync());
  }
});

// Фоновая синхронизация - отключена (кеширование не используется)
async function backgroundSync() {
  console.log('🔄 Фоновая синхронизация отключена (кеширование отключено)');
}

// Обработка push уведомлений
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/logo.png',
        badge: '/logo.png',
        data: data.url
      })
    );
  }
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.notification.data) {
    event.waitUntil(
      clients.openWindow(event.notification.data)
    );
  }
}); 