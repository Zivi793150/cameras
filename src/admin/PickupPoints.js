import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PickupPoints = ({ onLogout }) => {
  const [pickupPoints, setPickupPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPoint, setEditingPoint] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  const API_URL = '/api/pickup-points';

  // Начальное состояние формы
  const initialFormState = {
    name: '',
    address: '',
    city: '',
    description: '',
    workingHours: 'Пн-Пт: 9:00-18:00',
    phone: '',
    deliveryType: 'pickup',
    deliveryCost: 0,
    isActive: true
  };

  const [formData, setFormData] = useState(initialFormState);

  // Типы доставки
  const deliveryTypes = [
    { value: 'pickup', label: 'Самовывоз', cost: 0 },
    { value: 'indriver', label: 'InDriver', cost: 2000 },
    { value: 'yandex', label: 'Яндекс.Доставка', cost: 2500 },
    { value: 'kazpost', label: 'Казпочта', cost: 1500 },
    { value: 'cdek', label: 'СДЭК', cost: 3000 },
    { value: 'air', label: 'Авиа доставка', cost: 5000 }
  ];

  useEffect(() => {
    fetchPickupPoints();
  }, []);

  const fetchPickupPoints = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Загружаем пункты самовывоза с:', API_URL);
      const response = await fetch(API_URL);
      console.log('Статус ответа:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Полученные данные:', data);
        setPickupPoints(Array.isArray(data) ? data : []);
      } else {
        console.error('HTTP ошибка:', response.status, response.statusText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Ошибка загрузки пунктов самовывоза:', error);
      if (error.message.includes('Failed to fetch')) {
        setError('Сервер недоступен. Проверьте подключение к интернету.');
      } else if (error.message.includes('Unexpected token')) {
        setError('Сервер вернул неверный формат данных. Возможно, сервер не запущен.');
      } else {
        setError(`Ошибка загрузки: ${error.message}`);
      }
      setPickupPoints([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Валидация
    if (!formData.name.trim() || !formData.address.trim() || !formData.city.trim()) {
      setError('Заполните все обязательные поля');
      return;
    }

    try {
      const url = editingPoint ? `${API_URL}/${editingPoint._id}` : API_URL;
      const method = editingPoint ? 'PUT' : 'POST';

      console.log('Отправляем запрос:', method, url);
      console.log('Данные:', formData);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('Статус ответа:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Успешный ответ:', result);
        setSuccess(editingPoint ? 'Пункт самовывоза обновлен' : 'Пункт самовывоза добавлен');
        setFormData(initialFormState);
        setEditingPoint(null);
        setShowForm(false);
        fetchPickupPoints();
        
        // Скрыть сообщение через 3 секунды
        setTimeout(() => setSuccess(''), 3000);
      } else {
        let errorMessage = 'Ошибка сервера';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Ошибка:', error);
      if (error.message.includes('Failed to fetch')) {
        setError('Сервер недоступен. Проверьте подключение к интернету.');
      } else if (error.message.includes('Unexpected token')) {
        setError('Сервер вернул неверный формат данных. Возможно, сервер не запущен.');
      } else {
        setError(error.message);
      }
    }
  };

  const handleEdit = (point) => {
    setEditingPoint(point);
    setFormData({
      name: point.name || '',
      address: point.address || '',
      city: point.city || '',
      description: point.description || '',
      workingHours: point.workingHours || 'Пн-Пт: 9:00-18:00',
      phone: point.phone || '',
      deliveryType: point.deliveryType || 'pickup',
      deliveryCost: point.deliveryCost || 0,
      isActive: point.isActive !== false
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот пункт самовывоза?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Пункт самовывоза удален');
        fetchPickupPoints();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error('Ошибка удаления');
      }
    } catch (error) {
      setError('Ошибка при удалении');
    }
  };

  const handleCancel = () => {
    setFormData(initialFormState);
    setEditingPoint(null);
    setShowForm(false);
    setError('');
  };

  const handleDeliveryTypeChange = (type) => {
    const selectedType = deliveryTypes.find(t => t.value === type);
    setFormData({
      ...formData,
      deliveryType: type,
      deliveryCost: selectedType ? selectedType.cost : 0
    });
  };

  const getDeliveryTypeLabel = (type) => {
    const found = deliveryTypes.find(t => t.value === type);
    return found ? found.label : type;
  };

  const getStatusBadge = (isActive) => {
    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500',
        backgroundColor: isActive ? '#d4edda' : '#f8d7da',
        color: isActive ? '#155724' : '#721c24'
      }}>
        {isActive ? 'Активен' : 'Неактивен'}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Загрузка...
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f5f7fa', 
      padding: '32px 0' 
    }}>
      <div style={{ 
        maxWidth: 1200, 
        margin: '0 auto', 
        background: '#fff', 
        borderRadius: 12, 
        border: '1px solid #e0e0e0', 
        padding: 24 
      }}>
        
        {/* Заголовок и навигация */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 24 
        }}>
          <h1 style={{ 
            fontWeight: 700, 
            fontSize: 28, 
            color: '#1a2236', 
            margin: 0 
          }}>
            🏬 Управление пунктами самовывоза
          </h1>
          <div className="admin-nav">
            <button
              onClick={() => navigate('/admin/products')}
              className="nav-btn nav-products"
            >
              📦 Товары
            </button>
            <button
              onClick={() => navigate('/admin/variations')}
              className="nav-btn nav-variations"
            >
              🔄 Вариации
            </button>
            <button
              onClick={() => navigate('/admin/settings')}
              className="nav-btn nav-settings"
            >
              ⚙️ Настройки
            </button>
            <button
              onClick={onLogout}
              className="nav-btn nav-logout"
            >
              Выйти
            </button>
          </div>
        </div>



        {/* Уведомления */}
        {error && (
          <div style={{
            background: '#f8d7da',
            border: '1px solid #f5c6cb',
            color: '#721c24',
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 20
          }}>
            ❌ {error}
          </div>
        )}

        {success && (
          <div style={{
            background: '#d4edda',
            border: '1px solid #c3e6cb',
            color: '#155724',
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 20
          }}>
            ✅ {success}
          </div>
        )}

        {/* Кнопки управления */}
        <div style={{ marginBottom: 24, display: 'flex', gap: 12 }}>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingPoint(null);
              setFormData(initialFormState);
            }}
            style={{
              background: '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '12px 24px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 16
            }}
          >
            ➕ Добавить пункт самовывоза
          </button>
          
          <button
            onClick={async () => {
              setError('');
              setSuccess('Тестируем подключение к серверу...');
              
              try {
                // Сначала проверим основной API
                const productsResponse = await fetch('/api/products');
                console.log('API продуктов статус:', productsResponse.status);
                
                // Затем проверим тестовый endpoint API пунктов самовывоза
                const testResponse = await fetch('/api/pickup-points/test');
                console.log('Тестовый API статус:', testResponse.status);
                
                if (testResponse.ok) {
                  const testData = await testResponse.json();
                  console.log('Тестовые данные:', testData);
                  setSuccess(`✅ Сервер доступен! База данных: ${testData.database}, Коллекции: ${testData.collections.join(', ')}`);
                  fetchPickupPoints();
                } else {
                  // Если тестовый endpoint не работает, проверим основной
                  const pickupResponse = await fetch('/api/pickup-points');
                  console.log('API пунктов самовывоза статус:', pickupResponse.status);
                  
                  if (pickupResponse.ok) {
                    setSuccess('✅ Сервер доступен! API пунктов самовывоза работает.');
                    fetchPickupPoints();
                  } else {
                    setError(`❌ API пунктов самовывоза недоступен. Статус: ${pickupResponse.status}`);
                  }
                }
              } catch (error) {
                console.error('Ошибка тестирования:', error);
                setError(`❌ Ошибка подключения: ${error.message}`);
              }
            }}
            style={{
              background: '#17a2b8',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '12px 24px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 16
            }}
          >
            🔄 Тест API
          </button>
        </div>

        {/* Форма добавления/редактирования */}
        {showForm && (
          <div style={{
            background: '#f8f9fa',
            border: '1px solid #e9ecef',
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
            position: 'relative'
          }}>
            <button
              onClick={handleCancel}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                fontSize: 20,
                color: '#666',
                cursor: 'pointer',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#f0f0f0';
                e.target.style.color = '#333';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'none';
                e.target.style.color = '#666';
              }}
            >
              ✕
            </button>

            <h2 style={{ 
              margin: '0 0 20px 0', 
              fontSize: 20, 
              fontWeight: 600, 
              color: '#333',
              paddingRight: 40
            }}>
              {editingPoint ? 'Редактировать пункт самовывоза' : 'Добавить новый пункт самовывоза'}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
              
              {/* Основная информация */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#333' }}>
                    Название пункта *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Например: Главный офис"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ddd',
                      borderRadius: 6,
                      fontSize: 14
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#333' }}>
                    Город *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Например: Алматы"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ddd',
                      borderRadius: 6,
                      fontSize: 14
                    }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#333' }}>
                  Адрес *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Полный адрес пункта самовывоза"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#333' }}>
                    Телефон
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+7 (777) 123-45-67"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ddd',
                      borderRadius: 6,
                      fontSize: 14
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#333' }}>
                    Часы работы
                  </label>
                  <input
                    type="text"
                    value={formData.workingHours}
                    onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
                    placeholder="Пн-Пт: 9:00-18:00"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ddd',
                      borderRadius: 6,
                      fontSize: 14
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#333' }}>
                  Описание
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Дополнительная информация о пункте самовывоза"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: 6,
                    fontSize: 14,
                    minHeight: 80,
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Тип доставки */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#333' }}>
                    Тип доставки
                  </label>
                  <select
                    value={formData.deliveryType}
                    onChange={(e) => handleDeliveryTypeChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ddd',
                      borderRadius: 6,
                      fontSize: 14,
                      background: '#fff'
                    }}
                  >
                    {deliveryTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label} {type.cost > 0 ? `(${type.cost} ₸)` : '(Бесплатно)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#333' }}>
                    Стоимость доставки (₸)
                  </label>
                  <input
                    type="number"
                    value={formData.deliveryCost}
                    onChange={(e) => setFormData({ ...formData, deliveryCost: Number(e.target.value) })}
                    min="0"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ddd',
                      borderRadius: 6,
                      fontSize: 14
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    style={{ width: 16, height: 16 }}
                  />
                  <span style={{ fontWeight: 500, color: '#333' }}>Активный пункт</span>
                </label>
              </div>

              {/* Кнопки формы */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    background: '#6c757d',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '10px 20px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontSize: 14
                  }}
                >
                  Отмена
                </button>
                <button
                  type="submit"
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
                  {editingPoint ? 'Сохранить изменения' : 'Добавить пункт'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Список пунктов самовывоза */}
        <div>
          <h2 style={{ 
            fontSize: 20, 
            fontWeight: 600, 
            color: '#333', 
            marginBottom: 16 
          }}>
            Существующие пункты самовывоза ({pickupPoints.length})
          </h2>

          {pickupPoints.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#666',
              background: '#f8f9fa',
              borderRadius: 8,
              border: '1px dashed #dee2e6'
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🏬</div>
              <div style={{ fontSize: 16, marginBottom: 8 }}>Пункты самовывоза не найдены</div>
              <div style={{ fontSize: 14, color: '#999' }}>
                Добавьте первый пункт самовывоза, нажав кнопку выше
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {pickupPoints.map((point) => (
                <div
                  key={point._id}
                  style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: 12,
                    padding: 20,
                    background: point.isActive ? '#fff' : '#f8f9fa',
                    opacity: point.isActive ? 1 : 0.7
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#333' }}>
                          {point.name}
                        </h3>
                        {getStatusBadge(point.isActive)}
                      </div>
                      
                      <div style={{ marginBottom: 8 }}>
                        <strong style={{ color: '#666' }}>📍 Адрес:</strong> {point.address}
                      </div>
                      
                      <div style={{ marginBottom: 8 }}>
                        <strong style={{ color: '#666' }}>🏙️ Город:</strong> {point.city}
                      </div>
                      
                      {point.phone && (
                        <div style={{ marginBottom: 8 }}>
                          <strong style={{ color: '#666' }}>📞 Телефон:</strong> {point.phone}
                        </div>
                      )}
                      
                      <div style={{ marginBottom: 8 }}>
                        <strong style={{ color: '#666' }}>🕒 Часы работы:</strong> {point.workingHours}
                      </div>
                      
                      <div style={{ marginBottom: 8 }}>
                        <strong style={{ color: '#666' }}>🚚 Тип доставки:</strong> {getDeliveryTypeLabel(point.deliveryType)}
                        {point.deliveryCost > 0 ? ` (${point.deliveryCost} ₸)` : ' (Бесплатно)'}
                      </div>
                      
                      {point.description && (
                        <div style={{ marginBottom: 8 }}>
                          <strong style={{ color: '#666' }}>📝 Описание:</strong> {point.description}
                        </div>
                      )}
                      
                      <div style={{ fontSize: 12, color: '#999' }}>
                        Создан: {new Date(point.createdAt).toLocaleDateString('ru-RU')}
                        {point.updatedAt && (
                          <span> | Обновлен: {new Date(point.updatedAt).toLocaleDateString('ru-RU')}</span>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <button
                        onClick={() => handleEdit(point)}
                        style={{
                          background: '#ffc107',
                          color: '#212529',
                          border: 'none',
                          borderRadius: 6,
                          padding: '8px 16px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          fontSize: 13
                        }}
                      >
                        ✏️ Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete(point._id)}
                        style={{
                          background: '#dc3545',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          padding: '8px 16px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          fontSize: 13
                        }}
                      >
                        🗑️ Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PickupPoints; 