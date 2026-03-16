// Загружаем переменные окружения
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const pickupPointsRouter = require('./api/pickup-points');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();

// Простейший антиспам (in-memory) для форм
const tgRateLimit = new Map();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 минут
const RATE_LIMIT_MAX = 8; // максимум запросов за окно

const normalizePhone = (phoneRaw) => {
  const digits = String(phoneRaw || '').replace(/\D/g, '');
  if (!digits) return null;
  // Казахстанские номера: 11 цифр, начинаются на 7 (пример: 77075177385)
  let p = digits;
  if (p.startsWith('8') && p.length === 11) p = `7${p.slice(1)}`;
  if (p.startsWith('7') && p.length === 11) return `+${p}`;
  return null;
};

const isValidHumanName = (nameRaw) => {
  const name = String(nameRaw || '').trim();
  if (!name) return false;
  if (name.length < 2) return false;
  // Блокируем email/ботов
  if (name.includes('@')) return false;
  const lowered = name.toLowerCase();
  if (lowered.includes('storebotmail') || lowered.includes('joonix') || lowered.includes('bot')) return false;
  // Разрешаем буквы/пробел/дефис/апостроф
  return /^[\p{L}][\p{L}\s\-']{1,}$/u.test(name);
};

const looksLikeStructuredOrderMessage = (msg) => {
  const m = String(msg || '');
  if (!m.trim()) return false;
  // Признаки готового сообщения заказа, которое уже содержит поля
  return (
    /Заказ\s+через\s+форму/i.test(m) ||
    /<b>\s*Имя:\s*<\/b>/i.test(m) ||
    /<b>\s*Телефон:\s*<\/b>/i.test(m) ||
    /^\s*Имя\s*:/im.test(m) ||
    /^\s*Телефон\s*:/im.test(m) ||
    /^\s*Товар\s*:/im.test(m) ||
    /^\s*Доставка\s*:/im.test(m) ||
    /^\s*Сумма\s*:/im.test(m)
  );
};

const hasTimeLine = (msg) => /\n\s*Время\s*:/i.test(String(msg || ''));
const hasSourceLine = (msg) => /\n\s*Источник\s*:/i.test(String(msg || ''));

// Middleware
app.use(compression()); // Сжатие ответов
app.use(cors());
app.use(express.json());

// Настройка MIME типов
app.use((req, res, next) => {
  if (req.path.endsWith('.webp')) {
    res.setHeader('Content-Type', 'image/webp');
  } else if (req.path.endsWith('.avif')) {
    res.setHeader('Content-Type', 'image/avif');
  }
  next();
});

// MongoDB подключение
const mongoUri = process.env.MONGO_URI || 'mongodb+srv://electro:electro123@cluster0.mongodb.net/cameras_db?retryWrites=true&w=majority';
const PORT = process.env.PORT || 5000;

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB подключена'))
  .catch(err => console.error('Ошибка подключения к MongoDB:', err));

// Модель продукта
const productSchema = new mongoose.Schema({}, { strict: false, collection: 'products' });
const Product = mongoose.model('Product', productSchema);

// Мок-данные для тестирования без MongoDB
const mockProducts = [
  {
    _id: '1',
    name: 'IP камера 2MP',
    productGroup: { name: 'IP камеры', coverImage: '/cam1.jpg' },
    category: 'ip-cameras',
    categorySlug: 'ip-cameras',
    saleAvailable: true,
    image: '/cam1.jpg'
  },
  {
    _id: '2',
    name: 'Видеорегистратор 8 каналов',
    productGroup: { name: 'Видеорегистраторы', coverImage: '/cam2.webp' },
    category: 'recorders',
    categorySlug: 'recorders',
    saleAvailable: true,
    image: '/cam2.webp'
  },
  {
    _id: '3',
    name: 'Комплект видеонаблюдения',
    productGroup: { name: 'Комплекты', coverImage: '/cam3.png' },
    category: 'kits',
    categorySlug: 'kits',
    saleAvailable: true,
    image: '/cam3.png'
  },
  {
    _id: '4',
    name: 'Камера уличная 4MP',
    productGroup: { name: 'Уличные камеры', coverImage: '/cam1.jpg' },
    category: 'outdoor-cameras',
    categorySlug: 'outdoor-cameras',
    saleAvailable: true,
    image: '/cam1.jpg'
  },
  {
    _id: '5',
    name: 'Камера купольная 2MP',
    productGroup: { name: 'Купольные камеры', coverImage: '/cam2.webp' },
    category: 'dome-cameras',
    categorySlug: 'dome-cameras',
    saleAvailable: true,
    image: '/cam2.webp'
  },
  {
    _id: '6',
    name: 'Жесткий диск 1TB',
    productGroup: { name: 'Жесткие диски', coverImage: '/cam3.png' },
    category: 'hdd',
    categorySlug: 'hdd',
    saleAvailable: true,
    image: '/cam3.png'
  },
  {
    _id: '7',
    name: 'Блок питания 12V',
    productGroup: { name: 'Блоки питания', coverImage: '/cam1.jpg' },
    category: 'power-supplies',
    categorySlug: 'power-supplies',
    saleAvailable: true,
    image: '/cam1.jpg'
  },
  {
    _id: '8',
    name: 'Кабель RG-59 100м',
    productGroup: { name: 'Кабели', coverImage: '/cam2.webp' },
    category: 'cables',
    categorySlug: 'cables',
    saleAvailable: true,
    image: '/cam2.webp'
  }
];

// Флаг подключения к MongoDB
let mongoConnected = false;

// Проверяем подключение к MongoDB
mongoose.connection.on('connected', () => {
  console.log('MongoDB подключена');
  mongoConnected = true;
});

mongoose.connection.on('error', (err) => {
  console.error('Ошибка подключения к MongoDB:', err);
  mongoConnected = false;
});

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(file.originalname);
    cb(null, `${timestamp}_${randomString}${extension}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Только изображения разрешены'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// API Routes

// Получение всех продуктов
app.get('/api/products', async (req, res) => {
  try {
    // Если MongoDB не подключена, возвращаем мок-данные
    if (!mongoConnected) {
      console.log('Возвращаем мок-данные (MongoDB не подключена)');
      return res.json(mockProducts);
    }
    
    const limit = parseInt(req.query.limit) || 0;
    const products = await Product.find().limit(limit);
    res.json(products);
  } catch (err) {
    console.error('Ошибка получения продуктов:', err);
    // В случае ошибки тоже возвращаем мок-данные
    res.json(mockProducts);
  }
});

// Получение одного продукта по ID
app.get('/api/products/:id', async (req, res) => {
  try {
    // Если MongoDB не подключена, ищем в мок-данных
    if (!mongoConnected) {
      const product = mockProducts.find(p => p._id === req.params.id);
      if (!product) return res.status(404).json({ error: 'Товар не найден' });
      return res.json(product);
    }
    
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    res.json(product);
  } catch (err) {
    console.error('Ошибка получения продукта:', err);
    // В случае ошибки ищем в мок-данных
    const product = mockProducts.find(p => p._id === req.params.id);
    if (product) return res.json(product);
    res.status(500).json({ error: 'Ошибка получения продукта' });
  }
});

// Создание нового продукта
app.post('/api/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error('Ошибка создания продукта:', err);
    res.status(500).json({ error: 'Ошибка при создании товара' });
  }
});

// Обновление продукта
app.put('/api/products/:id', async (req, res) => {
  try {
    const { _id, ...updateData } = req.body; // Убираем _id из данных обновления
    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    res.json(product);
  } catch (err) {
    console.error('Ошибка обновления продукта:', err);
    res.status(500).json({ error: 'Ошибка при обновлении товара' });
  }
});

// Удаление продукта
app.delete('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    res.json({ message: 'Товар успешно удален' });
  } catch (err) {
    console.error('Ошибка удаления продукта:', err);
    res.status(500).json({ error: 'Ошибка при удалении товара' });
  }
});

// Загрузка файлов
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ 
      success: true, 
      files: [fileUrl],
      message: 'Файл успешно загружен'
    });
  } catch (error) {
    console.error('Ошибка загрузки файла:', error);
    res.status(500).json({ error: 'Ошибка загрузки файла: ' + error.message });
  }
});

// Telegram Bot API endpoint
app.post('/api/send-telegram', async (req, res) => {
  try {
    const { name, phone, message, product } = req.body;

    // Простейший rate-limit
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim();
    const rateKey = `${ip || 'unknown'}:${String(phone || '').replace(/\D/g, '')}`;
    const now = Date.now();
    const entry = tgRateLimit.get(rateKey) || { count: 0, startAt: now };
    if (now - entry.startAt > RATE_LIMIT_WINDOW_MS) {
      entry.count = 0;
      entry.startAt = now;
    }
    entry.count += 1;
    tgRateLimit.set(rateKey, entry);

    // Ничего не отклоняем: заявки должны доходить все.
    // Нормализуем где можем, но если не получилось — отправляем как есть.
    const safeName = String(name || '').trim() || 'Не указано';
    const normalizedPhone = normalizePhone(phone);
    const safePhone = normalizedPhone || (String(phone || '').trim() || 'Не указано');

    // Получаем токен бота из переменных окружения
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!botToken) {
      console.error('Telegram bot token не настроен');
      return res.status(500).json({ error: 'Telegram bot не настроен' });
    }
    
    // Формируем сообщение строго по полям
    const safeMessage = String(message || '').trim();
    const safeProduct = String(product || '').trim();

    const incomingIsStructured = looksLikeStructuredOrderMessage(safeMessage);
    let telegramMessage;
    if (incomingIsStructured) {
      // Сообщение уже собрано на фронте (Имя/Телефон/Товар/Доставка/и т.д.) — не дублируем.
      telegramMessage = `Новая заявка с сайта!\n\n${safeMessage}`;
      if (!hasTimeLine(safeMessage)) {
        telegramMessage += `\n\nВремя: ${new Date().toLocaleString('ru-RU')}`;
      }
      if (!hasSourceLine(safeMessage)) {
        telegramMessage += `\nИсточник: ${req.headers.referer || 'Прямой переход'}`;
      }
    } else {
      telegramMessage =
        `Новая заявка с сайта!\n\n` +
        `Имя: ${safeName}\n` +
        `Телефон: ${safePhone}\n` +
        `Сообщение: ${safeMessage || 'Не указано'}\n` +
        (safeProduct ? `Товар: ${safeProduct}\n` : '') +
        `Время: ${new Date().toLocaleString('ru-RU')}\n` +
        `Источник: ${req.headers.referer || 'Прямой переход'}`;
    }
    
    let success = false;
    
    // Если указан Chat ID - отправляем туда
    if (chatId) {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: telegramMessage,
          parse_mode: 'HTML'
        })
      });
      
      const result = await response.json();
      success = result.ok;
      
      if (!success) {
        console.error('Ошибка Telegram API:', result);
      }
    } else {
      // Если Chat ID не указан - сохраняем в лог
      console.log('Telegram сообщение (Chat ID не настроен):', telegramMessage);
      success = true; // Считаем успешным, так как логируем
    }
    
    if (success) {
      res.json({ success: true, message: 'Сообщение отправлено в Telegram' });
    } else {
      res.status(500).json({ error: 'Ошибка отправки в Telegram' });
    }
    
  } catch (error) {
    console.error('Ошибка отправки в Telegram:', error);
    res.status(500).json({ error: 'Ошибка отправки в Telegram' });
  }
});

// Роуты для пунктов самовывоза
app.use('/api/pickup-points', pickupPointsRouter);

// Настройки кэширования для статических файлов
const cacheControl = (req, res, next) => {
  const ext = path.extname(req.path).toLowerCase();
  const baseName = path.basename(req.path).toLowerCase();

  if (baseName === 'index.html' || baseName === 'sw.js' || baseName === 'service-worker.js' || baseName === 'asset-manifest.json' || baseName === 'manifest.json') {
    res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
    return next();
  }
  
  if (ext === '.css' || ext === '.js') {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 год
  } else if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.gif' || ext === '.webp' || ext === '.svg') {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 год
  } else if (ext === '.woff' || ext === '.woff2' || ext === '.ttf' || ext === '.otf') {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 год
  } else if (ext === '.html') {
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 час
  } else {
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 день
  }
  
  next();
};

// Обслуживание статических файлов из папки uploads с кэшированием
app.use('/uploads', cacheControl, express.static(path.join(__dirname, 'uploads')));

// Обслуживание статических файлов из папки public с кэшированием
app.use(express.static(path.join(__dirname, 'public'), {
setHeaders: (res, path) => {
const ext = require('path').extname(path).toLowerCase();
const baseName = require('path').basename(path).toLowerCase();

if (baseName === 'index.html' || baseName === 'sw.js' || baseName === 'service-worker.js' || baseName === 'asset-manifest.json' || baseName === 'manifest.json') {
res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
return;
}

if (ext === '.css' || ext === '.js') {
res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 год
} else if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.gif' || ext === '.webp' || ext === '.svg' || ext === '.avif') {
res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 год
} else if (ext === '.woff' || ext === '.woff2' || ext === '.ttf' || ext === '.otf') {
res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 год
} else if (ext === '.html') {
res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 час
} else {
res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 день
}
}
}));

// Обслуживание статических файлов из папки build с кэшированием (только если build существует)
const buildDir = path.join(__dirname, 'build');
if (fs.existsSync(buildDir)) {
  app.use(express.static(buildDir, {
    setHeaders: (res, filePath) => {
      const ext = require('path').extname(filePath).toLowerCase();
      const baseName = require('path').basename(filePath).toLowerCase();

      if (baseName === 'index.html' || baseName === 'sw.js' || baseName === 'service-worker.js' || baseName === 'asset-manifest.json' || baseName === 'manifest.json') {
        res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
        return;
      }

      if (ext === '.css' || ext === '.js') {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 год
      } else if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.gif' || ext === '.webp' || ext === '.svg' || ext === '.avif') {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 год
      } else if (ext === '.woff' || ext === '.woff2' || ext === '.ttf' || ext === '.otf') {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 год
      } else if (ext === '.html') {
        res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 час
      } else {
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 день
      }
    }
  }));
}

// Обслуживание статических файлов из папки public с кэшированием
app.use('/images', express.static(path.join(__dirname, 'public/images'), {
setHeaders: (res, path) => {
const ext = require('path').extname(path).toLowerCase();

if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.gif' || ext === '.webp' || ext === '.svg' || ext === '.avif') {
res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 год
}
}
}));

// Поддержка React Router - все остальные запросы направляем на index.html
app.get('*', (req, res) => {
// Проверяем, что это не API запрос
if (req.path.startsWith('/api/')) {
return res.status(404).json({ error: 'API endpoint не найден' });
}

// Проверяем, что это не статический файл
const ext = path.extname(req.path).toLowerCase();
if (ext && ext !== '.html') {
return res.status(404).json({ error: 'Файл не найден' });
}

// В dev режиме (когда нет build папки) просто возвращаем сообщение
const indexPath = path.join(__dirname, 'build/index.html');
if (!fs.existsSync(indexPath)) {
// В dev режиме frontend работает отдельно на localhost:3000
return res.status(200).json({ 
message: 'API сервер работает. Frontend доступен отдельно на http://localhost:3000',
api: 'working'
});
}
  const p = req.path;
  const knownRoutePatterns = [
    /^\/$/,
    /^\/catalog\/?$/,
    /^\/catalog\/[^/]+\/?$/,
    /^\/catalog\/[^/]+\/[^/]+\/?$/,
    /^\/product\/[^/]+\/?$/,
    /^\/rental\/?$/,
    /^\/rental\/[^/]+\/?$/,
    /^\/about\/?$/,
    /^\/contacts\/?$/,
    /^\/policy\/?$/,
    /^\/cooperation\/?$/,
    /^\/checkout\/?$/,
    /^\/thanks\/?$/,
    /^\/admin(\/.*)?$/
  ];
  const isKnown = knownRoutePatterns.some((re) => re.test(p));

  if (isKnown) {
    return res.status(200).sendFile(indexPath);
  }
  return res.status(404).sendFile(indexPath);
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});