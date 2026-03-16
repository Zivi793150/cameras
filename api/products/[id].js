import { connectToDatabase } from '../mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const { db } = await connectToDatabase();
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const product = await db.collection('products').findOne({ _id: new ObjectId(id) });
      if (!product) return res.status(404).json({ error: 'Товар не найден' });
      res.status(200).json(product);
    } catch (e) {
      res.status(500).json({ error: 'Ошибка при получении товара' });
    }
    return;
  }

  if (req.method === 'PUT') {
    try {
      const update = req.body;
      await db.collection('products').updateOne(
        { _id: new ObjectId(id) },
        { $set: update }
      );
      res.status(200).json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Ошибка при обновлении товара' });
    }
    return;
  }

  if (req.method === 'DELETE') {
    try {
      await db.collection('products').deleteOne({ _id: new ObjectId(id) });
      res.status(200).json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Ошибка при удалении товара' });
    }
    return;
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  res.status(405).end(`Метод ${req.method} не разрешён`);
} 