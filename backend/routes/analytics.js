const express = require('express');
const router = express.Router();
const Analytics = require('../models/Analytics');
const { v4: uuidv4 } = require('uuid');

// Middleware для генерации sessionId если его нет
const ensureSession = (req, res, next) => {
  if (!req.session.analyticsId) {
    req.session.analyticsId = uuidv4();
  }
  next();
};

// Записать событие
router.post('/track', ensureSession, async (req, res) => {
  try {
    const {
      eventType,
      eventData = {},
      productId,
      page,
      referrer,
      clientSessionId
    } = req.body;

    const analytics = new Analytics({
      eventType,
      eventData,
      sessionId: req.session.analyticsId,
      clientSessionId,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress,
      productId,
      page,
      referrer,
      channel: eventData?.channel || 'direct',
      device: eventData?.device || undefined,
      utm: {
        utm_source: eventData?.utm_source || '',
        utm_medium: eventData?.utm_medium || '',
        utm_campaign: eventData?.utm_campaign || '',
        utm_term: eventData?.utm_term || '',
        utm_content: eventData?.utm_content || ''
      }
    });

    await analytics.save();
    res.json({ success: true, sessionId: req.session.analyticsId });
  } catch (error) {
    console.error('Ошибка записи аналитики:', error);
    res.status(500).json({ error: 'Ошибка записи события' });
  }
});

// Получить статистику (для админки)
router.get('/stats', async (req, res) => {
  try {
    const { period = '7d', eventType } = req.query;
    
    // Определяем период
    let startDate = new Date();
    switch (period) {
      case '24h':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Базовый фильтр по дате
    const dateFilter = { timestamp: { $gte: startDate } };
    
    // Добавляем фильтр по типу события если указан
    if (eventType) {
      dateFilter.eventType = eventType;
    }

    // Общая статистика по типам событий
    const eventStats = await Analytics.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
          uniqueSessions: { $addToSet: { $ifNull: ['$clientSessionId', '$sessionId'] } }
        }
      },
      {
        $project: {
          eventType: '$_id',
          count: 1,
          uniqueSessions: { $size: '$uniqueSessions' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Статистика по дням
    const dailyStats = await Analytics.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            eventType: '$eventType'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Статистика по часам
    const hourlyStats = await Analytics.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { hour: { $hour: '$timestamp' }, eventType: '$eventType' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.hour': 1 } }
    ]);

    // Статистика по каналам (direct / organic / social / referral)
    const channelStats = await Analytics.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$channel',
          count: { $sum: 1 },
          uniqueSessions: { $addToSet: { $ifNull: ['$clientSessionId', '$sessionId'] } }
        }
      },
      {
        $project: {
          channel: '$_id',
          count: 1,
          uniqueSessions: { $size: '$uniqueSessions' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Статистика по UTM источникам
    const utmSourceStats = await Analytics.aggregate([
      { $match: { ...dateFilter, 'utm.utm_source': { $ne: '' } } },
      { $group: { _id: '$utm.utm_source', count: { $sum: 1 }, uniqueSessions: { $addToSet: { $ifNull: ['$clientSessionId', '$sessionId'] } } } },
      { $project: { utm_source: '$_id', count: 1, uniqueSessions: { $size: '$uniqueSessions' } } },
      { $sort: { count: -1 } }
    ]);

    // Статистика по устройствам
    const deviceStats = await Analytics.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$device.os',
          count: { $sum: 1 },
          uniqueSessions: { $addToSet: { $ifNull: ['$clientSessionId', '$sessionId'] } }
        }
      },
      { $project: { os: '$_id', count: 1, uniqueSessions: { $size: '$uniqueSessions' } } },
      { $sort: { count: -1 } }
    ]);

    // Конверсия по каналам: page_view vs form_submit
    const channelConversion = await Analytics.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$channel',
          pageViews: { $sum: { $cond: [{ $eq: ['$eventType', 'page_view'] }, 1, 0] } },
          phoneClicks: { $sum: { $cond: [{ $eq: ['$eventType', 'phone_click'] }, 1, 0] } },
          formSubmits: { $sum: { $cond: [{ $eq: ['$eventType', 'form_submit'] }, 1, 0] } },
          uniqueSessions: { $addToSet: { $ifNull: ['$clientSessionId', '$sessionId'] } }
        }
      },
      {
        $project: {
          channel: '$_id',
          pageViews: 1,
          phoneClicks: 1,
          formSubmits: 1,
          uniqueSessions: { $size: '$uniqueSessions' },
          conversion: {
            $cond: [
              { $gt: ['$pageViews', 0] },
              { $multiply: [{ $divide: ['$formSubmits', '$pageViews'] }, 100] },
              0
            ]
          },
          conversionPhone: {
            $cond: [
              { $gt: ['$pageViews', 0] },
              { $multiply: [{ $divide: ['$phoneClicks', '$pageViews'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { conversion: -1 } }
    ]);

    // Воронка по событиям
    const funnelTotalsAgg = await Analytics.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          pageViews: { $sum: { $cond: [{ $eq: ['$eventType', 'page_view'] }, 1, 0] } },
          buttonClicks: { $sum: { $cond: [{ $eq: ['$eventType', 'button_click'] }, 1, 0] } },
          formSubmits: { $sum: { $cond: [{ $eq: ['$eventType', 'form_submit'] }, 1, 0] } },
          uniqueSessions: { $addToSet: { $ifNull: ['$clientSessionId', '$sessionId'] } }
        }
      },
      {
        $project: {
          _id: 0,
          pageViews: 1,
          buttonClicks: 1,
          formSubmits: 1,
          uniqueSessions: { $size: '$uniqueSessions' }
        }
      }
    ]);
    const funnelTotals = funnelTotalsAgg[0] || { pageViews: 0, buttonClicks: 0, formSubmits: 0, uniqueSessions: 0 };

    // Клики по телефону по страницам
    const phoneClicksByPage = await Analytics.aggregate([
      { $match: { ...dateFilter, eventType: 'phone_click' } },
      {
        $group: {
          _id: '$page',
          clicks: { $sum: 1 },
          uniqueSessions: { $addToSet: { $ifNull: ['$clientSessionId', '$sessionId'] } }
        }
      },
      { $project: { page: '$_id', clicks: 1, uniqueSessions: { $size: '$uniqueSessions' } } },
      { $sort: { clicks: -1 } }
    ]);

    // Клики по кнопкам (CTA)
    const buttonClicksStats = await Analytics.aggregate([
      { $match: { ...dateFilter, eventType: 'button_click' } },
      {
        $group: {
          _id: { text: '$eventData.buttonText', context: '$eventData.context' },
          count: { $sum: 1 },
          uniqueSessions: { $addToSet: { $ifNull: ['$clientSessionId', '$sessionId'] } }
        }
      },
      {
        $project: {
          buttonText: '$_id.text',
          context: '$_id.context',
          count: 1,
          uniqueSessions: { $size: '$uniqueSessions' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Топ товаров по просмотрам
    const topProducts = await Analytics.aggregate([
      { $match: { ...dateFilter, eventType: 'product_view', productId: { $exists: true } } },
      {
        $group: {
          _id: '$productId',
          views: { $sum: 1 },
          uniqueViews: { $addToSet: { $ifNull: ['$clientSessionId', '$sessionId'] } }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $project: {
          productId: '$_id',
          productName: { $arrayElemAt: ['$product.name', 0] },
          views: 1,
          uniqueViews: { $size: '$uniqueViews' }
        }
      },
      { $sort: { views: -1 } },
      { $limit: 10 }
    ]);

    // Статистика по социальным сетям
    const socialClicksStats = await Analytics.aggregate([
      { $match: { ...dateFilter, eventType: 'social_click' } },
      {
        $group: {
          _id: { platform: '$eventData.platform', context: '$eventData.context' },
          count: { $sum: 1 },
          uniqueSessions: { $addToSet: { $ifNull: ['$clientSessionId', '$sessionId'] } }
        }
      },
      {
        $project: {
          platform: '$_id.platform',
          context: '$_id.context',
          count: 1,
          uniqueSessions: { $size: '$uniqueSessions' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Статистика по страницам
    const pageStats = await Analytics.aggregate([
      { $match: { ...dateFilter, page: { $exists: true } } },
      {
        $group: {
          _id: '$page',
          views: { $sum: 1 },
          uniqueViews: { $addToSet: { $ifNull: ['$clientSessionId', '$sessionId'] } }
        }
      },
      {
        $project: {
          page: '$_id',
          views: 1,
          uniqueViews: { $size: '$uniqueViews' }
        }
      },
      { $sort: { views: -1 } }
    ]);

    // Общее количество уникальных сессий за период (по clientSessionId с резервом на sessionId)
    const uniqueSessionsOverallAgg = await Analytics.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          sessions: { $addToSet: { $ifNull: ['$clientSessionId', '$sessionId'] } }
        }
      },
      { $project: { _id: 0, count: { $size: '$sessions' } } }
    ]);
    const uniqueSessionsOverall = uniqueSessionsOverallAgg[0]?.count || 0;

    res.json({
      success: true,
      data: {
        period,
        startDate,
        eventStats,
        dailyStats,
        hourlyStats,
        channelStats,
        channelConversion,
        utmSourceStats,
        deviceStats,
        phoneClicksByPage,
        buttonClicksStats,
        socialClicksStats,
        topProducts,
        pageStats,
        funnelTotals,
        summary: {
          totalEvents: eventStats.reduce((sum, stat) => sum + stat.count, 0),
          uniqueSessions: uniqueSessionsOverall
        }
      }
    });
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
});

// Получить детальную информацию по событиям
router.get('/events', async (req, res) => {
  try {
    const { page = 1, limit = 50, eventType, productId, sessionId } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (eventType) filter.eventType = eventType;
    if (productId) filter.productId = productId;
    if (sessionId) filter.sessionId = sessionId;

    const events = await Analytics.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('productId', 'name');

    const total = await Analytics.countDocuments(filter);

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Ошибка получения событий:', error);
    res.status(500).json({ error: 'Ошибка получения событий' });
  }
});

module.exports = router;
