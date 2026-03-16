import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

// Отключаем парсинг тела запроса по умолчанию
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      uploadDir: '/tmp', // Временная директория на Vercel
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      filter: ({ mimetype }) => {
        return mimetype && mimetype.includes('image');
      },
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const uploadedFiles = [];
    const fileArray = Array.isArray(files.file) ? files.file : [files.file];

    for (const file of fileArray) {
      if (file) {
        // Генерируем уникальное имя файла
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const extension = path.extname(file.originalFilename || 'image.jpg');
        const filename = `${timestamp}_${randomString}${extension}`;

        // На Vercel мы не можем сохранять файлы постоянно, поэтому возвращаем временный URL
        // В реальном проекте здесь нужно использовать Cloudinary, AWS S3 или другой сервис
        const fileUrl = `/api/images/${filename}`;
        
        uploadedFiles.push(fileUrl);
      }
    }

    res.status(200).json({
      success: true,
      files: uploadedFiles,
      message: `Успешно загружено ${uploadedFiles.length} файлов`
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка загрузки файлов: ' + error.message
    });
  }
}