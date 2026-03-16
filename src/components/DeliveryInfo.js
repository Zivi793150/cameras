import React, { useState, useEffect } from 'react';

const DeliveryInfo = ({ city, onDeliverySelect, compact = false, selectedDelivery = null, onCityChange, cities = [] }) => {
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Убрано неиспользуемое состояние (опции отображения)

  const API_URL = '/api/pickup-points';

  useEffect(() => {
    if (city) {
      fetchDeliveryInfo(city);
    }
  }, [city]);

  const fetchDeliveryInfo = async (cityName) => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Загружаем информацию о доставке для города:', cityName);
      const response = await fetch(`${API_URL}/delivery/${encodeURIComponent(cityName)}`);
      console.log('Статус ответа:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Информация о доставке:', data);
        setDeliveryInfo(data);
      } else {
        console.error('HTTP ошибка:', response.status, response.statusText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Ошибка загрузки информации о доставке:', error);
      if (error.message.includes('Failed to fetch')) {
        setError('Сервер недоступен. Проверьте подключение к интернету.');
      } else if (error.message.includes('Unexpected token')) {
        setError('Сервер вернул неверный формат данных. Возможно, сервер не запущен.');
      } else {
        setError(`Ошибка загрузки: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeliverySelect = (deliveryOption) => {
    if (onDeliverySelect) {
      onDeliverySelect(deliveryOption);
    }
  };

  const handleDeliveryChange = (e) => {
    const selectedType = e.target.value;
    const selectedOption = deliveryInfo.deliveryOptions.find(option => option.type === selectedType);
    if (selectedOption) {
      handleDeliverySelect(selectedOption);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '12px', 
        textAlign: 'center',
        color: '#666',
        fontSize: '0.9rem'
      }}>
        Загрузка информации о доставке...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '12px', 
        background: '#f8d7da', 
        border: '1px solid #f5c6cb', 
        borderRadius: 6,
        color: '#721c24',
        marginBottom: 12,
        fontSize: '0.85rem'
      }}>
        ❌ {error}
      </div>
    );
  }

  if (!deliveryInfo) {
    return null;
  }

  // Компактный вид для страницы товара
  if (compact) {
    const mainPoint = deliveryInfo.firstPickupPoint || deliveryInfo.pickupPoints?.[0] || {};
    const Container = ({ children }) => (
      <div style={{
        border: 'none',
                borderRadius: 6,
        background: '#fff',
        padding: 8,
        marginTop: 2
      }}>
        {children}
      </div>
    );

    // Удалён невостребованный внутренний компонент CitySelect (используем citySelectEl ниже)

    // Для корректной отрисовки options добавим их прямо здесь
    const citySelectEl = (onCityChange && Array.isArray(cities) && cities.length > 0) ? (
      <div style={{ marginBottom: 10 }}>
        <select value={city} onChange={onCityChange} className="city-select" style={{ border: '1px solid #e0e0e0', borderRadius: 6, boxShadow: 'none', background: '#fff', padding: '6px 8px' }}>
          {cities.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
                </div>
    ) : null;

    if (deliveryInfo.isAlmaty) {
      return (
        <Container>
          {citySelectEl}
          <div style={{ display: 'grid', gap: 6 }}>
            <div>
              <div style={{ fontWeight: 600 }}>Бесплатная доставка по городу</div>
              <div style={{ fontSize: 13, color: '#1976d2' }}>Сегодня — БЕСПЛАТНО</div>
                </div>

            {deliveryInfo.hasPickupPoints && (
              <div>
                <div style={{ fontWeight: 600 }}>Самовывоз из магазина {mainPoint.address ? `ул. ${mainPoint.address}` : ''}</div>
                <div style={{ fontSize: 13, color: '#1976d2' }}>Сегодня {mainPoint.workingHours || 'с 9:00 до 18:00'} — больше 5</div>
              </div>
            )}

            <div style={{
              border: 'none',
              background: '#f9fafb',
              borderRadius: 6,
              padding: 6,
              color: '#333'
            }}>
              <div>
                <div>Срок доставки рассчитывается</div>
                <div>менеджером после</div>
                <div>оформления заказа</div>
              </div>
            </div>
        </div>
        </Container>
      );
    }

    // Остальные города — выпадающий список внутри одного блока
    return (
      <Container>
        {citySelectEl}
        <div style={{ marginBottom: 4 }}>
          <label style={{
            display: 'block',
            fontSize: '0.9rem',
            fontWeight: 600,
            color: '#1e88e5',
            marginBottom: 4
          }}>
            Способ доставки
          </label>
          <select
            value={selectedDelivery ? selectedDelivery.type : ''}
            onChange={handleDeliveryChange}
            className="delivery-select"
            style={{
              width: '100%',
              border: 'none',
              borderRadius: 4,
              padding: '4px 8px',
              fontSize: '0.95rem',
              color: '#1e88e5',
              fontWeight: 600,
              backgroundColor: '#fff',
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.2s ease',
              transformOrigin: 'top',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none',
              backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231e88e5' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e\")",
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center',
              backgroundSize: '16px',
              paddingRight: '32px'
            }}
          >
            <option value="">Выберите способ доставки</option>
            {deliveryInfo.deliveryOptions.map((option, index) => (
              <option key={index} value={option.type}>
                {option.name}
              </option>
            ))}
          </select>
      </div>
      </Container>
    );
  }

  // Полный вид для страницы оформления заказа
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ 
        fontSize: 18, 
        fontWeight: 600, 
        color: '#333', 
        marginBottom: 16 
      }}>
        🚚 Варианты доставки в {deliveryInfo.city}
      </h3>

      {deliveryInfo.isAlmaty && deliveryInfo.hasPickupPoints ? (
        <div style={{
          background: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: 8,
          padding: 16,
          marginBottom: 16
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8, 
            marginBottom: 8,
            color: '#155724',
            fontWeight: 600
          }}>
            🎉 Бесплатная доставка!
          </div>
          <div style={{ color: '#155724', fontSize: 14 }}>
            В Алматы доступен самовывоз из наших пунктов выдачи
          </div>
        </div>
      ) : (
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: 8,
          padding: 16,
          marginBottom: 16
        }}>
          <div style={{ 
            color: '#856404', 
            fontSize: 14,
            marginBottom: 8
          }}>
            💡 Доставка в другие города осуществляется платно
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {deliveryInfo.deliveryOptions.map((option, index) => (
          <div
            key={index}
            onClick={() => handleDeliverySelect(option)}
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              padding: 16,
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: '#fff'
            }}
            onMouseOver={(e) => {
              e.target.style.borderColor = '#ffc107';
              e.target.style.boxShadow = '0 2px 8px rgba(255, 193, 7, 0.2)';
            }}
            onMouseOut={(e) => {
              e.target.style.borderColor = '#e0e0e0';
              e.target.style.boxShadow = 'none';
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 4
            }}>
              <div style={{ fontWeight: 600, color: '#333' }}>
                {option.name}
              </div>
              <div style={{ 
                fontWeight: 700, 
                color: option.cost === 0 ? '#28a745' : '#ffc107',
                fontSize: 16
              }}>
                {option.cost === 0 ? 'Бесплатно' : `${option.cost} ₸`}
              </div>
            </div>
            <div style={{ color: '#666', fontSize: 14 }}>
              {option.description}
            </div>
          </div>
        ))}
      </div>

      {deliveryInfo.isAlmaty && deliveryInfo.hasPickupPoints && (
        <div style={{ marginTop: 16 }}>
          <button
            onClick={() => {
              // Здесь можно добавить логику для показа карты пунктов самовывоза
              alert('Функция показа пунктов самовывоза будет добавлена позже');
            }}
            style={{
              background: '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '10px 20px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            🗺️ Показать пункты самовывоза
          </button>
        </div>
      )}
    </div>
  );
};

export default DeliveryInfo; 