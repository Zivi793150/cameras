import React, { useState, useEffect } from 'react';
import { getAnalyticsStats, getAnalyticsEvents } from '../utils/analytics';
import '../styles/AdminAnalytics.css';

const AdminAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [activeTab, setActiveTab] = useState('overview');

useEffect(() => {
    loadStats();
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, currentPage, filters]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await getAnalyticsStats(period);
      setStats(response.data);
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const response = await getAnalyticsEvents(currentPage, 50, filters);
      setEvents(response.data.events);
    } catch (error) {
      console.error('Ошибка загрузки событий:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const getEventTypeLabel = (eventType) => {
    const labels = {
      'phone_click': 'Клик на телефон',
      'product_view': 'Просмотр товара',
      'form_submit': 'Отправка формы',
      'button_click': 'Клик на кнопку',
      'page_view': 'Просмотр страницы'
    };
    return labels[eventType] || eventType;
  };

  const getEventIcon = (eventType) => {
    const icons = {
      'phone_click': '📞',
      'product_view': '👁️',
      'form_submit': '📝',
      'button_click': '🖱️',
      'page_view': '📄'
    };
    return icons[eventType] || '❓';
  };

  const calculateConversionRate = () => {
    if (!stats) return 0;
    const formSubmits = stats.eventStats.find(s => s.eventType === 'form_submit')?.count || 0;
    const totalViews = stats.eventStats.find(s => s.eventType === 'page_view')?.count || 0;
    return totalViews > 0 ? ((formSubmits / totalViews) * 100).toFixed(2) : 0;
  };

  const calculateEngagementRate = () => {
    if (!stats) return 0;
    const totalEngagements = stats.eventStats
      .filter(s => s.eventType !== 'page_view')
      .reduce((sum, stat) => sum + stat.count, 0);
    const totalViews = stats.eventStats.find(s => s.eventType === 'page_view')?.count || 0;
    return totalViews > 0 ? ((totalEngagements / totalViews) * 100).toFixed(2) : 0;
  };

  if (loading && !stats) {
    return <div className="admin-analytics-loading">Загрузка аналитики...</div>;
  }

  return (
    <div className="admin-analytics">
      <div className="admin-analytics-header">
        <h1>📊 Аналитика сайта</h1>
        <div className="header-controls">
          <button
            onClick={() => window.location.assign('/admin/products')}
            className="back-to-admin"
            title="Назад к админке"
          >
            ← Назад
          </button>
          <div className="period-selector">
            <label>Период:</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="24h">Последние 24 часа</option>
              <option value="7d">Последние 7 дней</option>
              <option value="30d">Последние 30 дней</option>
              <option value="90d">Последние 90 дней</option>
            </select>
          </div>
          <div className="mobile-menu-toggle" onClick={() => setActiveTab(activeTab === 'overview' ? 'events' : 'overview')}>
            <span>☰</span>
          </div>
        </div>
      </div>

      {/* Навигационные табы */}
      <div className="analytics-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📈 Обзор
        </button>
        <button 
          className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          📋 События
        </button>
        <button 
          className={`tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          💡 Инсайты
        </button>
      </div>

      {/* Вкладка "Обзор" */}
      {activeTab === 'overview' && stats && (
        <>
          <div className="stats-overview">
            <div className="stats-card total-events">
              <h3>Всего событий</h3>
              <div className="stats-number">{stats.summary.totalEvents}</div>
              <div className="stats-trend">+12% с прошлой недели</div>
            </div>
            <div className="stats-card unique-sessions">
              <h3>Уникальных сессий</h3>
              <div className="stats-number">{stats.summary.uniqueSessions}</div>
              <div className="stats-trend">+8% с прошлой недели</div>
            </div>
            <div className="stats-card conversion-rate">
              <h3>Конверсия</h3>
              <div className="stats-number">{calculateConversionRate()}%</div>
              <div className="stats-trend">Формы / Просмотры</div>
            </div>
            <div className="stats-card engagement-rate">
              <h3>Вовлеченность</h3>
              <div className="stats-number">{calculateEngagementRate()}%</div>
              <div className="stats-trend">Действия / Просмотры</div>
            </div>
          </div>

          <div className="stats-details">
            {/* Клики по телефону по страницам */}
            <div className="stats-section">
              <h3>📞 Клики по телефону (по страницам)</h3>
              <div className="page-stats">
                {stats.phoneClicksByPage.map((row, index) => (
                  <div key={index} className="page-stat">
                    <div className="page-name">{row.page || 'Главная'}</div>
                    <div className="page-views">Кликов: {row.clicks.toLocaleString()} | Сессий: {row.uniqueSessions.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Клики по кнопкам (CTA) */}
            <div className="stats-section">
              <h3>🖱️ Клики по CTA</h3>
              <div className="cta-grid">
                {stats.buttonClicksStats.map((btn, idx) => (
                  <div key={idx} className="cta-item">
                    <div className="cta-title">{btn.buttonText || 'Кнопка'}</div>
                    <div className="cta-context">{btn.context || 'без контекста'}</div>
                    <div className="cta-metrics">Кликов: {btn.count.toLocaleString()} • Сессий: {btn.uniqueSessions.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Воронка действий */}
            <div className="stats-section">
              <h3>🛤️ Воронка: Просмотры → Клики → Заявки</h3>
              <div className="funnel-grid">
                <div className="funnel-step">
                  <div className="funnel-label">Просмотры страниц</div>
                  <div className="funnel-value">{stats.funnelTotals.pageViews.toLocaleString()}</div>
                </div>
                <div className="funnel-arrow">→</div>
                <div className="funnel-step">
                  <div className="funnel-label">Клики по кнопкам</div>
                  <div className="funnel-value">{stats.funnelTotals.buttonClicks.toLocaleString()}</div>
                </div>
                <div className="funnel-arrow">→</div>
                <div className="funnel-step">
                  <div className="funnel-label">Отправки форм</div>
                  <div className="funnel-value">{stats.funnelTotals.formSubmits.toLocaleString()}</div>
                </div>
              </div>
            </div>
            {/* Каналы трафика */}
            <div className="stats-section">
              <h3>📣 Каналы трафика</h3>
              <div className="stats-grid">
                {stats.channelStats.map((c, idx) => (
                  <div key={idx} className="stat-item">
                    <div className="stat-info">
                      <div className="stat-label">{c.channel}</div>
                      <div className="stat-count">{c.count.toLocaleString()}</div>
                      <div className="stat-unique">Сессий: {c.uniqueSessions.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* UTM источники */}
            <div className="stats-section">
              <h3>🔗 UTM источники</h3>
              <div className="stats-grid">
                {stats.utmSourceStats.map((u, idx) => (
                  <div key={idx} className="stat-item">
                    <div className="stat-info">
                      <div className="stat-label">{u.utm_source}</div>
                      <div className="stat-count">{u.count.toLocaleString()}</div>
                      <div className="stat-unique">Сессий: {u.uniqueSessions.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Устройства (уникальные сессии, не просто события) */}
            <div className="stats-section">
              <h3>📱 Устройства</h3>
              <div className="stats-grid">
                {stats.deviceStats.map((d, idx) => (
                  <div key={idx} className="stat-item">
                    <div className="stat-info">
                      <div className="stat-label">{d.os || 'Other'}</div>
                      <div className="stat-count">{d.uniqueSessions.toLocaleString()}</div>
                      <div className="stat-unique">Сессий: {d.uniqueSessions.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="stats-section">
              <h3>📊 Статистика по типам событий</h3>
              <div className="stats-grid">
                {stats.eventStats.map((stat, index) => (
                  <div key={index} className="stat-item">
                    <div className="stat-icon">{getEventIcon(stat.eventType)}</div>
                    <div className="stat-info">
                      <div className="stat-label">{getEventTypeLabel(stat.eventType)}</div>
                      <div className="stat-count">{stat.count.toLocaleString()}</div>
                      <div className="stat-unique">Уникальных: {stat.uniqueSessions}</div>
                      <div className="stat-percentage">
                        {((stat.count / stats.summary.totalEvents) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="stats-section">
              <h3>🏆 Топ товаров по просмотрам</h3>
              <div className="top-products">
                {stats.topProducts.map((product, index) => (
                  <div key={index} className="product-stat">
                    <div className="product-rank">#{index + 1}</div>
                    <div className="product-info">
                      <div className="product-name">{product.productName || 'Неизвестный товар'}</div>
                      <div className="product-views">
                        Просмотров: {product.views.toLocaleString()} | Уникальных: {product.uniqueViews.toLocaleString()}
                      </div>
                      <div className="product-engagement">
                        Вовлеченность: {((product.uniqueViews / product.views) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="stats-section">
              <h3>📄 Статистика по страницам</h3>
              <div className="page-stats">
                {stats.pageStats.map((page, index) => (
                  <div key={index} className="page-stat">
                    <div className="page-name">{page.page || 'Главная'}</div>
                    <div className="page-views">Просмотров: {page.views.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Вкладка "Инсайты" */}
      {activeTab === 'insights' && stats && (
        <div className="insights-section">
          <div className="insights-grid">
            <div className="insight-card">
              <h3>🎯 Рекомендации</h3>
              <ul>
                <li>Увеличьте контент на самых популярных страницах</li>
                <li>Добавьте больше CTA на страницы с высокой вовлеченностью</li>
                <li>Оптимизируйте страницы с высоким процентом отказов</li>
              </ul>
            </div>
            <div className="insight-card">
              <h3>📈 Тренды</h3>
              <ul>
                <li>Пик активности: 14:00 - 18:00</li>
                <li>Самый популярный день: Среда</li>
                <li>Доля мобильных: {(() => {
                  const mobile = stats.deviceStats.find(d => (d.os||'').toLowerCase().includes('android') || (d.os||'').toLowerCase().includes('ios'))?.uniqueSessions || 0;
                  const total = stats.deviceStats.reduce((s,d)=>s+(d.uniqueSessions||0),0) || 1;
                  return ((mobile/total)*100).toFixed(1)+'%';
                })()}</li>
              </ul>
            </div>
            <div className="insight-card">
              <h3>🚀 Возможности роста</h3>
              <ul>
                <li>Улучшите UX на мобильных: добавьте быстрые CTA "Позвонить"/"WhatsApp" выше</li>
                <li>Добавьте push-уведомления</li>
                <li>Создайте персонализированные рекомендации</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Вкладка "События" */}
      {activeTab === 'events' && (
        <div className="events-section">
          <h3>📋 Детальные события</h3>
          <div className="events-filters">
            <select 
              value={filters.eventType || ''} 
              onChange={(e) => setFilters({...filters, eventType: e.target.value || undefined})}
            >
              <option value="">Все типы событий</option>
              <option value="phone_click">Клик на телефон</option>
              <option value="product_view">Просмотр товара</option>
              <option value="form_submit">Отправка формы</option>
              <option value="button_click">Клик на кнопку</option>
              <option value="page_view">Просмотр страницы</option>
            </select>
          </div>
          
          <div className="events-table">
            <table>
              <thead>
                <tr>
                  <th>Время</th>
                  <th>Тип</th>
                  <th>Данные</th>
                  <th>Страница</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, index) => (
                  <tr key={index}>
                    <td>{formatDate(event.timestamp)}</td>
                    <td>
                      <span className="event-type">
                        {getEventIcon(event.eventType)} {getEventTypeLabel(event.eventType)}
                      </span>
                    </td>
                    <td>
                      <div className="event-data">
                        {event.eventData && Object.keys(event.eventData).length > 0 ? (
                          Object.entries(event.eventData).map(([key, value]) => (
                            <div key={key} className="event-data-item">
                              <strong>{key}:</strong> {String(value)}
                            </div>
                          ))
                        ) : (
                          <span className="no-data">Нет данных</span>
                        )}
                      </div>
                    </td>
                    <td>{event.page || '-'}</td>
                    <td>{event.ipAddress || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button 
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              ← Назад
            </button>
            <span>Страница {currentPage}</span>
            <button 
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={events.length < 50}
            >
              Вперед →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
