const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Функция для установки прав доступа на файлы
const setFilePermissions = (filePath) => {
  try {
    // Устанавливаем права 644 (rw-r--r--) для файлов - доступно для чтения всем
    fs.chmodSync(filePath, 0o644);
  } catch (error) {
    console.warn('⚠️ Не удалось установить права доступа на файл:', filePath, error.message);
  }
};

// Функция для установки прав доступа на директории
const setDirPermissions = (dirPath) => {
  try {
    // Устанавливаем права 755 (rwxr-xr-x) для директорий
    fs.chmodSync(dirPath, 0o755);
  } catch (error) {
    console.warn('⚠️ Не удалось установить права доступа на директорию:', dirPath, error.message);
  }
};

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Используем абсолютный путь относительно папки backend
    // Файлы загружаются в build/uploads для правильного отображения на сайте
    const uploadDir = path.join(__dirname, '../build/uploads/');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      // Устанавливаем права доступа на директорию
      setDirPermissions(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Генерируем уникальное имя файла
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'file-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Проверяем тип файла
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Только изображения разрешены!'), false);
    }
  },
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB максимум (увеличено с 10MB)
  }
});

// Middleware для конвертации в WebP
const convertToWebP = async (req, res, next) => {
  if (!req.file) {
    console.log('❌ Нет файла для конвертации');
    return next();
  }

  try {
    const originalPath = req.file.path;
    const webpPath = originalPath.replace(/\.[^/.]+$/, '.webp');
    
    console.log('🔍 Начинаем конвертацию в WebP:');
    console.log('   Оригинальный файл:', originalPath);
    console.log('   WebP файл будет создан:', webpPath);
    console.log('   Размер оригинального файла:', req.file.size, 'байт');
    
    // Проверяем, существует ли оригинальный файл
    if (!fs.existsSync(originalPath)) {
      console.error('❌ Оригинальный файл не найден:', originalPath);
      return next();
    }
    
    // Устанавливаем права доступа на оригинальный файл
    setFilePermissions(originalPath);
    
    // Конвертируем в WebP с оптимизацией
    await sharp(originalPath)
      .webp({ 
        quality: 80, // Качество 80% (хороший баланс размер/качество)
        effort: 6    // Уровень сжатия (0-6, 6 = максимальное сжатие)
      })
      .toFile(webpPath);

    // Проверяем, что webp файл создался
    if (fs.existsSync(webpPath)) {
      // Устанавливаем права доступа на WebP файл
      setFilePermissions(webpPath);
      const webpStats = fs.statSync(webpPath);
      console.log(`✅ Изображение конвертировано в WebP: ${originalPath} -> ${webpPath}`);
      console.log(`   Размер WebP файла: ${webpStats.size} байт`);
    } else {
      console.error('❌ WebP файл не был создан:', webpPath);
    }

    // Добавляем информацию о WebP версии в req.file
    req.file.webpPath = webpPath;
    // Формируем URL относительно корня проекта (/uploads/...)
    // Извлекаем имя файла из полного пути и добавляем /uploads/
    const webpFileName = path.basename(webpPath);
    req.file.webpUrl = '/uploads/' + webpFileName;
    
    next();
  } catch (error) {
    console.error('❌ Ошибка конвертации в WebP:', error);
    console.error('   Детали ошибки:', error.message);
    console.error('   Стек вызовов:', error.stack);
    next(); // Продолжаем даже если конвертация не удалась
  }
};

// Middleware для создания разных размеров изображений
const createImageSizes = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const originalPath = req.file.path;
    const sizes = [
      { name: 'thumb', width: 150, height: 150 },
      { name: 'medium', width: 400, height: 400 },
      { name: 'large', width: 800, height: 800 }
    ];

    req.file.variants = {};

    for (const size of sizes) {
      const variantPath = originalPath.replace(/\.[^/.]+$/, `-${size.name}.webp`);
      
      await sharp(originalPath)
        .resize(size.width, size.height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: 80 })
        .toFile(variantPath);

      // Устанавливаем права доступа на вариант изображения
      if (fs.existsSync(variantPath)) {
        setFilePermissions(variantPath);
      }

      req.file.variants[size.name] = {
        path: variantPath,
        // Формируем URL относительно корня проекта (/uploads/...)
        // Извлекаем имя файла из полного пути и добавляем /uploads/
        url: '/uploads/' + path.basename(variantPath),
        width: size.width,
        height: size.height
      };
    }

    console.log(`✅ Созданы варианты изображения: ${Object.keys(req.file.variants).join(', ')}`);
    next();
  } catch (error) {
    console.error('❌ Ошибка создания вариантов:', error);
    next();
  }
};

// Middleware для подготовки локальных URL файлов (для VPS)
// Файлы сохраняются локально, не загружаются на внешний хостинг
const prepareLocalUrls = async (req, res, next) => {
  if (!req.file) return next();
  
  try {
    // Оригинальный файл - используем локальный путь
    // Формируем URL относительно корня проекта (/uploads/...)
    // Извлекаем имя файла из полного пути и добавляем /uploads/
    const originalFileName = path.basename(req.file.path);
    req.file.localUrl = '/uploads/' + originalFileName;
    
    // WebP файл - используем локальный путь
    if (req.file.webpPath && fs.existsSync(req.file.webpPath)) {
      const webpFileName = path.basename(req.file.webpPath);
      req.file.localWebpUrl = '/uploads/' + webpFileName;
    }
    
    // Варианты (thumb, medium, large) - используем локальные пути
    if (req.file.variants) {
      req.file.localVariants = {};
      for (const [sizeName, variant] of Object.entries(req.file.variants)) {
        if (fs.existsSync(variant.path)) {
          req.file.localVariants[sizeName] = {
            url: variant.url, // уже содержит правильный путь без 'public'
            width: variant.width,
            height: variant.height
          };
        }
      }
    }
    
    console.log('✅ Файлы сохранены локально:');
    console.log('   Оригинал:', req.file.localUrl);
    if (req.file.localWebpUrl) {
      console.log('   WebP:', req.file.localWebpUrl);
    }
    if (req.file.localVariants) {
      console.log('   Варианты:', Object.keys(req.file.localVariants).join(', '));
    }
    
    next();
  } catch (err) {
    console.error('Ошибка подготовки локальных URL:', err);
    next();
  }
};

module.exports = {
  upload: upload.single('image'),
  convertToWebP,
  createImageSizes,
  prepareLocalUrls
}; 