const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
    enum: ['phone_click', 'product_view', 'form_submit', 'button_click', 'page_view', 'category_view']
  },
  eventData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  utm: {
    utm_source: String,
    utm_medium: String,
    utm_campaign: String,
    utm_term: String,
    utm_content: String
  },
  device: {
    isMobile: Boolean,
    os: String,
    browser: String
  },
  channel: { type: String, default: 'direct' },
  userId: {
    type: String,
    default: null // Анонимные пользователи
  },
  sessionId: {
    type: String,
    required: true
  },
  clientSessionId: { type: String },
  userAgent: String,
  ipAddress: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  page: String,
  referrer: String
});

// Индексы для быстрого поиска
analyticsSchema.index({ eventType: 1, timestamp: -1 });
analyticsSchema.index({ productId: 1, timestamp: -1 });
analyticsSchema.index({ sessionId: 1, timestamp: -1 });
analyticsSchema.index({ channel: 1, timestamp: -1 });
analyticsSchema.index({ 'utm.utm_source': 1, timestamp: -1 });

module.exports = mongoose.model('Analytics', analyticsSchema);
