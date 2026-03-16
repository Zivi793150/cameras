# Backend API

## Установка и запуск

### Локальная разработка

1. Установите зависимости:
```bash
npm install
```

2. Создайте файл `.env` в корне папки backend:
```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/Tanker_tools
```

3. Запустите сервер:
```bash
npm start
```

### Развертывание на Render

1. Убедитесь, что в `render.yaml` правильно настроены команды:
   - `buildCommand: cd backend && npm install`
   - `startCommand: cd backend && npm start`

2. Установите переменные окружения в Render:
   - `NODE_ENV=production`
   - `MONGO_URI` - ваша строка подключения к MongoDB

## API Endpoints

- `GET /` - Проверка работоспособности
- `GET /api/products` - Получение всех продуктов
- `GET /api/products/:id` - Получение продукта по ID
- `POST /api/products` - Создание нового продукта
- `PUT /api/products/:id` - Обновление продукта
- `DELETE /api/products/:id` - Удаление продукта
- `POST /api/upload` - Загрузка изображений

## Зависимости

- express
- mongoose
- cors
- multer
- dotenv
- formidable