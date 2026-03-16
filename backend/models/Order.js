const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String },
    comment: { type: String },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        productName: { type: String },
        price: { type: Number },
        quantity: { type: Number, default: 1 },
        selectedVariant: { type: mongoose.Schema.Types.Mixed },
        selectedParameters: { type: mongoose.Schema.Types.Mixed }
      }
    ],
    deliveryType: { type: String, enum: ['pickup', 'delivery'], default: 'pickup' },
    payment: { type: String, enum: ['cashless', 'cash'], default: 'cashless' },
    paymentMethod: { type: String, enum: ['remote', 'qr', 'transfer', null], default: 'remote' },
    total: { type: Number, required: true },
    clientSessionId: { type: String },
    status: { 
      type: String, 
      enum: [
        'new',           // Новый заказ / Черновик
        'confirmed',     // Оформлено
        'pending_payment', // Ожидает оплаты (Не оплачено)
        'partially_paid',  // Частично оплачено
        'paid',          // Оплачено
        'ordered',       // Заказано у поставщика
        'processing',    // В обработке
        'assembling',    // Собирается
        'assembled',     // Собрано
        'ready_to_ship', // Готов к отгрузке
        'shipped',       // Отправлено / Передано в доставку
        'in_transit',    // Доставляется
        'delivered',     // Доставлено
        'completed',     // Выполнено / Завершено
        'cancelled',     // Отменено
        'returned'       // Возврат / Возврат средств
      ],
      default: 'new'
    },
    statusHistory: [{
      status: { type: String },
      changedAt: { type: Date, default: Date.now },
      changedBy: { type: String, default: 'system' }
    }],
    // Метка для автоудаления: если заказ отменён или выполнен,
    // устанавливаем дату удаления через 3 дня. TTL-индекс ниже.
    deleteAfterAt: { type: Date, default: null, index: true }
  },
  { timestamps: true }
);

// TTL индекс: документы удаляются, когда наступает deleteAfterAt
// В MongoDB TTL задаётся через expireAfterSeconds: 0 для точной даты в поле
OrderSchema.index({ deleteAfterAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Order', OrderSchema);


