import { connectToDatabase } from '../mongodb';

export default async function handler(req, res) {
  const { db } = await connectToDatabase();
  const { slug } = req.query;

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Метод ${req.method} не разрешён`);
  }

  try {
    // Ищем по текущему slug
    let product = await db.collection('products').findOne({ slug: String(slug) });

    // Если не нашли, ищем в истории слугов (на случай переименования)
    if (!product) {
      product = await db.collection('products').findOne({ slugHistory: { $in: [String(slug)] } });
      if (product && product.slug) {
        // Подсказываем клиенту новый URL
        res.setHeader('X-Canonical-Slug', product.slug);
      }
    }

    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    return res.status(200).json(product);
  } catch (e) {
    return res.status(500).json({ error: 'Ошибка при получении товара' });
  }
}

