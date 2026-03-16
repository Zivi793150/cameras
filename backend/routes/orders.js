const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Создать заказ
router.post('/', async (req, res) => {
  try {
    const data = req.body || {};
    const order = await Order.create({
      firstName: data.firstName,
      phone: data.phone,
      address: data.address,
      comment: data.comment,
      items: data.items || [],
      deliveryType: data.deliveryType,
      payment: data.payment,
      paymentMethod: data.paymentMethod,
      total: data.total,
      clientSessionId: data.clientSessionId,
      status: 'new', // Инициализируем статус как "новый заказ"
      statusHistory: [{
        status: 'new',
        changedAt: new Date(),
        changedBy: 'system'
      }]
    });
    res.json({ success: true, order });
  } catch (err) {
    console.error('Ошибка создания заказа:', err);
    res.status(500).json({ success: false, error: 'Ошибка создания заказа' });
  }
});

// Список заказов (для админки)
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    console.error('Ошибка получения заказов:', err);
    res.status(500).json({ success: false, error: 'Ошибка получения заказов' });
  }
});

// Обновить статус заказа
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, changedBy = 'admin' } = req.body;

    // Валидация статуса
    const validStatuses = [
      'new', 'confirmed', 'pending_payment', 'partially_paid', 'paid',
      'ordered', 'processing', 'assembling', 'assembled', 'ready_to_ship',
      'shipped', 'in_transit', 'delivered', 'completed', 'cancelled', 'returned'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Недопустимый статус заказа' 
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        error: 'Заказ не найден' 
      });
    }

    // Добавляем запись в историю статусов
    const statusHistoryEntry = {
      status: order.status,
      changedAt: new Date(),
      changedBy: changedBy
    };

  // Формируем обновление, включая метку автоудаления
  const update = {
    status: status,
    $push: { statusHistory: statusHistoryEntry }
  };
  if (status === 'completed' || status === 'cancelled') {
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    update.deleteAfterAt = new Date(Date.now() + threeDaysMs);
  } else {
    update.deleteAfterAt = null;
  }

  const updatedOrder = await Order.findByIdAndUpdate(id, update, { new: true });

    res.json({ success: true, order: updatedOrder });
  } catch (err) {
    console.error('Ошибка обновления статуса заказа:', err);
    res.status(500).json({ success: false, error: 'Ошибка обновления статуса заказа' });
  }
});

// Получить заказ по ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Заказ не найден' });
    }
    res.json({ success: true, order });
  } catch (err) {
    console.error('Ошибка получения заказа:', err);
    res.status(500).json({ success: false, error: 'Ошибка получения заказа' });
  }
});

// Удаление заказа (для админки)
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Заказ не найден' });
    res.json({ success: true, message: 'Заказ удалён' });
  } catch (err) {
    console.error('Ошибка удаления заказа:', err);
    res.status(500).json({ success: false, error: 'Ошибка удаления заказа' });
  }
});

module.exports = router;


