import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCache } from '../utils/cache';

const API_URL = '/api/information';

const SiteSettings = ({ onLogout }) => {
  const navigate = useNavigate();
  const [information, setInformation] = useState({
    city: 'Алматы',
    markupPercentage: 20,
    showPromoCode: false,
    productPageText: '',
    deliveryInfo: {
      freeDelivery: 'Бесплатная доставка по городу',
      freeDeliveryNote: 'Сегодня — БЕСПЛАТНО',
      pickupAddress: 'Бокейханова 510, Склад',
      pickupInfo: 'Сегодня с 9:00 до 18:00 — больше 5',
      deliveryNote: 'Срок доставки рассчитывается менеджером после оформления заказа'
    },
    contactInfo: {
      phone: '+7 707 703-31-13',
      phoneName: 'Виталий',
      officePhone: '+7 727 347 07 53',
      officeName: 'Офис',
      address: 'Бокейханова 510, Склад',
      email: 'info@промкраска.kz'
    },
    companyInfo: {
      name: 'ТОО «Long Partners»',
      bin: '170540006129',
      iik: 'KZ256018861000677041',
      kbe: '17',
      bank: 'АО «Народный Банк Казахстана»'
    }
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const autoSaveTimerRef = useRef(null);
  const previousMarkupRef = useRef(null);

  useEffect(() => {
    fetchInformation();
    
    // Очищаем таймер при размонтировании
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Сохраняем начальное значение процента наценки после загрузки
  useEffect(() => {
    if (information.markupPercentage !== undefined) {
      if (previousMarkupRef.current === null || previousMarkupRef.current === undefined) {
        previousMarkupRef.current = information.markupPercentage;
        console.log('Инициализирован previousMarkupRef:', previousMarkupRef.current);
      }
    }
  }, [information.markupPercentage]);

  // Функция для автоматического сохранения и пересчета цен
  const autoSaveMarkupPercentage = async (newMarkup) => {
    try {
      // Нормализуем значение - преобразуем в число
      const numMarkup = typeof newMarkup === 'string' ? parseFloat(newMarkup) : newMarkup;
      const finalMarkup = isNaN(numMarkup) ? 0 : Math.min(100, Math.max(0, numMarkup));
      
      console.log('🔄 Начинаем автоматический пересчет цен с процентом наценки:', finalMarkup);
      setMessage('🔄 Пересчёт цен...');
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          information: {
            ...information,
            markupPercentage: finalMarkup
          }
        })
      });
      
      console.log('Ответ сервера на автоматическое сохранение:', response.status, response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Данные ответа:', data);
        if (data.success) {
          // Очищаем кэш товаров
          apiCache.clear();
          console.log('✅ Кэш товаров очищен');
          
          // Уведомляем все открытые вкладки
          try {
            if (typeof BroadcastChannel !== 'undefined') {
              const channel = new BroadcastChannel('price_update');
              channel.postMessage({ type: 'prices_updated', timestamp: Date.now() });
              channel.close();
              console.log('✅ BroadcastChannel отправлен');
            }
          } catch (e) {
            console.log('Не удалось отправить BroadcastChannel:', e);
          }
          
          // Формируем сообщение
          let msg = '✅ Цены пересчитаны!';
          if (data.information?.meta?.lastPriceRecalculation) {
            const recalc = data.information.meta.lastPriceRecalculation;
            console.log('📊 Информация о пересчете:', JSON.stringify(recalc, null, 2));
            if (recalc.updatedCount > 0) {
              msg += ` Обновлено ${recalc.updatedCount} товаров.`;
              console.log(`✅ Успешно обновлено ${recalc.updatedCount} товаров, пропущено: ${recalc.skippedCount || 0}`);
            } else {
              msg += ` (обновлено: ${recalc.updatedCount || 0}, пропущено: ${recalc.skippedCount || 0})`;
              console.warn('⚠️ Товары не обновлены! Проверьте логи сервера.');
            }
          } else {
            console.warn('⚠️ Информация о пересчете не получена в ответе сервера');
          }
          setMessage(msg);
          setTimeout(() => setMessage(''), 5000);
          
          // Обновляем информацию из ответа
          if (data.information) {
            setInformation(data.information);
            previousMarkupRef.current = newMarkup;
            console.log('✅ Информация обновлена, новый процент наценки:', newMarkup);
          }
        } else {
          console.error('❌ Сервер вернул success: false', data);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Ошибка ответа сервера:', response.status, errorText);
      }
    } catch (error) {
      console.error('Ошибка автоматического сохранения:', error);
      setMessage('❌ Ошибка при пересчёте цен');
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const fetchInformation = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        const data = await response.json();
        if (data.information) {
          console.log('📥 Загружена информация из БД:', data.information);
          console.log('📥 Процент наценки из БД:', data.information.markupPercentage);
          setInformation(data.information);
          // Инициализируем previousMarkupRef сразу после загрузки
          if (data.information.markupPercentage !== undefined) {
            previousMarkupRef.current = data.information.markupPercentage;
            console.log('📥 Инициализирован previousMarkupRef из БД:', previousMarkupRef.current);
          }
        }
      } else {
        console.log('Информация не найдена, используются значения по умолчанию');
      }
    } catch (error) {
      console.log('Ошибка загрузки информации, используются значения по умолчанию:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    console.log('Отправляем данные на сохранение:', information);
    console.log('Процент наценки:', information.markupPercentage);
    
    // Показываем уведомление о пересчёте цен
    setMessage('🔄 Сохранение настроек и пересчёт цен...');
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ information })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('Ответ сервера:', data);
          console.log('Сохраненный процент наценки:', data.information?.markupPercentage);
          
          // Очищаем весь кэш товаров, чтобы цены обновились
          apiCache.clear();
          console.log('🗑️ Кэш товаров очищен');
          
          // Уведомляем все открытые вкладки об изменении цен
          try {
            if (typeof BroadcastChannel !== 'undefined') {
              const channel = new BroadcastChannel('price_update');
              channel.postMessage({ type: 'prices_updated', timestamp: Date.now() });
              channel.close();
            }
          } catch (e) {
            console.log('Не удалось отправить BroadcastChannel:', e);
          }
          
          // Формируем сообщение с информацией о пересчете
          let message = '✅ Настройки сохранены!';
          if (data.information?.meta?.lastPriceRecalculation) {
            const recalc = data.information.meta.lastPriceRecalculation;
            if (recalc.updatedCount > 0) {
              message += ` Цены пересчитаны для ${recalc.updatedCount} товаров.`;
              if (recalc.skippedCount > 0) {
                message += ` Пропущено: ${recalc.skippedCount}.`;
              }
            } else {
              message += ' Процент наценки не изменился, пересчет не требуется.';
            }
          } else {
            message += ' Цены пересчитаны.';
          }
          message += ' Обновите страницы каталога (F5) для просмотра новых цен.';
          
          setMessage(message);
          setTimeout(() => setMessage(''), 10000);
        } else {
          throw new Error(data.error || 'Ошибка сохранения');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка сохранения');
      }
    } catch (error) {
      setMessage(`❌ Ошибка при сохранении информации: ${error.message}`);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const updateDeliveryInfo = (field, value) => {
    setInformation(prev => ({
      ...prev,
      deliveryInfo: {
        ...prev.deliveryInfo,
        [field]: value
      }
    }));
  };

  const updateContactInfo = (field, value) => {
    setInformation(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        [field]: value
      }
    }));
  };

  const updateCompanyInfo = (field, value) => {
    setInformation(prev => ({
      ...prev,
      companyInfo: {
        ...prev.companyInfo,
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <div style={{minHeight: '100vh', background: '#f5f7fa', padding: '32px 0'}}>
        <div style={{maxWidth: 1100, margin: '0 auto', background: '#fff', borderRadius: 10, border: '1.5px solid #e0e0e0', padding: 24}}>
          <div style={{padding: 32, textAlign: 'center'}}>Загрузка настроек...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container" style={{minHeight: '100vh', background: '#f5f7fa', padding: '32px 0'}}>
      <div style={{maxWidth: 1100, margin: '0 auto', background: '#fff', borderRadius: 10, border: '1.5px solid #e0e0e0', padding: 24}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
          <h2 className="admin-header" style={{fontWeight: 700, fontSize: 24, color: '#1a2236', margin: 0}}>Настройки сайта</h2>
          <div className="admin-nav">
            <button onClick={() => navigate('/admin/products')} className="nav-btn nav-products">📦 Товары</button>
            <button onClick={() => navigate('/admin/variations')} className="nav-btn nav-variations">🔄 Вариации</button>
            <button onClick={() => navigate('/admin/pickup-points')} className="nav-btn nav-pickup">🏬 Пункты самовывоза</button>
            <button onClick={handleSave} disabled={saving} className="nav-btn" style={{background:'#007bff'}}>
              {saving ? 'Сохранение...' : '💾 Сохранить'}
            </button>
            <button onClick={onLogout} className="nav-btn nav-logout">Выйти</button>
          </div>
        </div>

        {message && (
          <div style={{
            padding: 12,
            marginBottom: 20,
            borderRadius: 6,
            background: message.includes('✅') ? '#d4edda' : '#f8d7da',
            color: message.includes('✅') ? '#155724' : '#721c24',
            border: `1px solid ${message.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            {message}
          </div>
        )}

        {/* Основная информация */}
        <div style={{background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 8, padding: 20, marginBottom: 20}}>
          <h3 style={{margin: '0 0 16px 0', fontSize: 18, fontWeight: 600, color: '#495057'}}>🏙️ Основная информация</h3>
          
          <div style={{marginBottom: 16}}>
            <label style={{display: 'block', marginBottom: 6, fontWeight: 500, color: '#333', fontSize: 14}}>Город по умолчанию</label>
            <input 
              value={information.city} 
              onChange={(e) => setInformation(prev => ({...prev, city: e.target.value}))}
              placeholder="Например: Алматы"
              style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ced4da', fontSize: 14}}
            />
            <small style={{color: '#6c757d', fontSize: 12}}>Отображается как "Ваш город: [название]"</small>
          </div>
          
          <div style={{marginBottom: 16}}>
            <label style={{display: 'block', marginBottom: 6, fontWeight: 500, color: '#333', fontSize: 14}}>Процент наценки (%)</label>
            <input 
              type="text"
              inputMode="decimal"
              value={information.markupPercentage !== undefined && information.markupPercentage !== null ? String(information.markupPercentage) : ''} 
              onChange={(e) => {
                const inputValue = e.target.value;
                // Разрешаем пустую строку, числа и десятичные числа (включая незавершенный ввод типа "20.")
                // Разрешаем: пустая строка, числа, десятичные числа, точку в процессе ввода
                if (inputValue === '' || /^[0-9]*\.?[0-9]*$/.test(inputValue)) {
                  // Сохраняем исходное значение как строку для свободного ввода
                  const displayValue = inputValue === '' ? '' : inputValue;
                  setInformation(prev => ({...prev, markupPercentage: displayValue}));
                  
                  // Для расчетов используем числовое значение
                  const numValue = inputValue === '' ? 0 : parseFloat(inputValue);
                  if (!isNaN(numValue) && inputValue !== '') {
                    const clampedValue = Math.min(100, Math.max(0, numValue));
                    
                    // Отправляем событие об изменении процента наценки в реальном времени
                    try {
                      if (typeof BroadcastChannel !== 'undefined') {
                        const channel = new BroadcastChannel('markup_percentage_update');
                        channel.postMessage({ 
                          type: 'markup_percentage_changed', 
                          markupPercentage: clampedValue,
                          timestamp: Date.now() 
                        });
                        channel.close();
                        console.log('📡 BroadcastChannel отправлен с процентом:', clampedValue);
                      }
                    } catch (e) {
                      console.log('Не удалось отправить BroadcastChannel:', e);
                    }
                    
                    // Автоматически сохраняем и пересчитываем цены через 1.5 секунды после остановки ввода
                    if (autoSaveTimerRef.current) {
                      clearTimeout(autoSaveTimerRef.current);
                      console.log('⏱️ Предыдущий таймер очищен');
                    }
                    
                    console.log('⏱️ Установлен новый таймер на 1.5 секунды для автоматического сохранения');
                    autoSaveTimerRef.current = setTimeout(() => {
                      // Всегда пересчитываем, даже если значение не изменилось (для надежности)
                      console.log('⏰ Таймер сработал! Автоматическое сохранение процента наценки:', clampedValue, 'предыдущее:', previousMarkupRef.current);
                      autoSaveMarkupPercentage(clampedValue);
                    }, 1500);
                  }
                }
              }}
              onBlur={(e) => {
                // При потере фокуса нормализуем значение
                const inputValue = e.target.value;
                const numValue = inputValue === '' ? 0 : parseFloat(inputValue);
                if (!isNaN(numValue)) {
                  const clampedValue = Math.min(100, Math.max(0, numValue));
                  setInformation(prev => ({...prev, markupPercentage: clampedValue}));
                  previousMarkupRef.current = clampedValue;
                } else {
                  // Если невалидное значение, возвращаем предыдущее
                  const fallback = previousMarkupRef.current || 0;
                  setInformation(prev => ({...prev, markupPercentage: fallback}));
                }
              }}
              placeholder="20"
              style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ced4da', fontSize: 14}}
            />
            <small style={{color: '#6c757d', fontSize: 12}}>Процент наценки при конвертации цен из USD в KZT. При изменении все цены будут автоматически пересчитаны.</small>
          </div>
          
          <div style={{marginBottom: 16}}>
            <label style={{display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500, color: '#333', fontSize: 14}}>
              <input 
                type="checkbox"
                checked={information.showPromoCode} 
                onChange={(e) => setInformation(prev => ({...prev, showPromoCode: e.target.checked}))}
                style={{width: 16, height: 16}}
              />
              Показывать поле промокода на странице оформления заказа
            </label>
            <small style={{color: '#6c757d', fontSize: 12}}>Включите, чтобы пользователи могли вводить промокоды при оформлении заказа</small>
          </div>
          
          <div style={{marginBottom: 0}}>
            <label style={{display: 'block', marginBottom: 6, fontWeight: 500, color: '#333', fontSize: 14}}>Текст под кнопкой "Купить"</label>
            <textarea 
              value={information.productPageText} 
              onChange={(e) => setInformation(prev => ({...prev, productPageText: e.target.value}))}
              placeholder="Введите текст, который будет отображаться под кнопкой купить на всех страницах товаров"
              rows={3}
              style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ced4da', fontSize: 14, resize: 'vertical'}}
            />
            <small style={{color: '#6c757d', fontSize: 12}}>Этот текст будет отображаться под кнопкой "Купить" на всех страницах товаров. Стиль будет такой же, как у описания товара.</small>
          </div>
        </div>

        {/* Информация о доставке */}
        <div style={{background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 8, padding: 20, marginBottom: 20}}>
          <h3 style={{margin: '0 0 16px 0', fontSize: 18, fontWeight: 600, color: '#495057'}}>🚚 Информация о доставке</h3>
          
          <div style={{marginBottom: 16}}>
            <label style={{display: 'block', marginBottom: 6, fontWeight: 500, color: '#333', fontSize: 14}}>Бесплатная доставка</label>
            <input 
              value={information.deliveryInfo.freeDelivery} 
              onChange={(e) => updateDeliveryInfo('freeDelivery', e.target.value)}
              placeholder="Бесплатная доставка по городу"
              style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ced4da', fontSize: 14}}
            />
          </div>
          
          <div style={{marginBottom: 16}}>
            <label style={{display: 'block', marginBottom: 6, fontWeight: 500, color: '#333', fontSize: 14}}>Примечание к доставке</label>
            <input 
              value={information.deliveryInfo.freeDeliveryNote} 
              onChange={(e) => updateDeliveryInfo('freeDeliveryNote', e.target.value)}
              placeholder="Сегодня — БЕСПЛАТНО"
              style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ced4da', fontSize: 14}}
            />
          </div>
          
          <div style={{marginBottom: 16}}>
            <label style={{display: 'block', marginBottom: 6, fontWeight: 500, color: '#333', fontSize: 14}}>Адрес самовывоза</label>
            <input 
              value={information.deliveryInfo.pickupAddress} 
              onChange={(e) => updateDeliveryInfo('pickupAddress', e.target.value)}
              placeholder="Бокейханова 510, Склад"
              style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ced4da', fontSize: 14}}
            />
          </div>
          
          <div style={{marginBottom: 16}}>
            <label style={{display: 'block', marginBottom: 6, fontWeight: 500, color: '#333', fontSize: 14}}>Информация о самовывозе</label>
            <input 
              value={information.deliveryInfo.pickupInfo} 
              onChange={(e) => updateDeliveryInfo('pickupInfo', e.target.value)}
              placeholder="Сегодня с 9:00 до 18:00 — больше 5"
              style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ced4da', fontSize: 14}}
            />
          </div>
          
          <div style={{marginBottom: 0}}>
            <label style={{display: 'block', marginBottom: 6, fontWeight: 500, color: '#333', fontSize: 14}}>Примечание о сроке доставки</label>
            <input 
              value={information.deliveryInfo.deliveryNote} 
              onChange={(e) => updateDeliveryInfo('deliveryNote', e.target.value)}
              placeholder="Срок доставки рассчитывается менеджером после оформления заказа"
              style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ced4da', fontSize: 14}}
            />
          </div>
        </div>

        {/* Контактная информация */}
        <div style={{background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 8, padding: 20, marginBottom: 20}}>
          <h3 style={{margin: '0 0 16px 0', fontSize: 18, fontWeight: 600, color: '#495057'}}>📞 Контактная информация</h3>
          
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16}}>
            <div>
              <label style={{display: 'block', marginBottom: 6, fontWeight: 500, color: '#333', fontSize: 14}}>Телефон</label>
              <input 
                value={information.contactInfo.phone} 
                onChange={(e) => updateContactInfo('phone', e.target.value)}
                placeholder="+7 707 703-31-13"
                style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ced4da', fontSize: 14}}
              />
            </div>
            <div>
              <label style={{display: 'block', marginBottom: 6, fontWeight: 500, color: '#333', fontSize: 14}}>Имя контакта</label>
              <input 
                value={information.contactInfo.phoneName} 
                onChange={(e) => updateContactInfo('phoneName', e.target.value)}
                placeholder="Виталий"
                style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ced4da', fontSize: 14}}
              />
            </div>
          </div>
          
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16}}>
            <div>
              <label style={{display: 'block', marginBottom: 6, fontWeight: 500, color: '#333', fontSize: 14}}>Офисный телефон</label>
              <input 
                value={information.contactInfo.officePhone} 
                onChange={(e) => updateContactInfo('officePhone', e.target.value)}
                placeholder="+7 727 347 07 53"
                style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ced4da', fontSize: 14}}
              />
            </div>
            <div>
              <label style={{display: 'block', marginBottom: 6, fontWeight: 500, color: '#333', fontSize: 14}}>Название офиса</label>
              <input 
                value={information.contactInfo.officeName} 
                onChange={(e) => updateContactInfo('officeName', e.target.value)}
                placeholder="Офис"
                style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ced4da', fontSize: 14}}
              />
            </div>
          </div>
          
          <div style={{marginBottom: 16}}>
            <label style={{display: 'block', marginBottom: 6, fontWeight: 500, color: '#333', fontSize: 14}}>Адрес</label>
            <input 
              value={information.contactInfo.address} 
              onChange={(e) => updateContactInfo('address', e.target.value)}
              placeholder="Бокейханова 510, Склад"
              style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ced4da', fontSize: 14}}
            />
          </div>
          
          <div style={{marginBottom: 0}}>
            <label style={{display: 'block', marginBottom: 6, fontWeight: 500, color: '#333', fontSize: 14}}>Email</label>
            <input 
              value={information.contactInfo.email} 
              onChange={(e) => updateContactInfo('email', e.target.value)}
              placeholder="info@промкраска.kz"
              style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ced4da', fontSize: 14}}
            />
          </div>
        </div>

        {/* Информация о компании */}
        <div style={{background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 8, padding: 20, marginBottom: 20}}>
          <h3 style={{margin: '0 0 16px 0', fontSize: 18, fontWeight: 600, color: '#495057'}}>🏢 Информация о компании</h3>
          
          <div style={{marginBottom: 16}}>
            <label style={{display: 'block', marginBottom: 6, fontWeight: 500, color: '#333', fontSize: 14}}>Название компании</label>
            <input 
              value={information.companyInfo.name} 
              onChange={(e) => updateCompanyInfo('name', e.target.value)}
              placeholder="ТОО «Long Partners»"
              style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ced4da', fontSize: 14}}
            />
          </div>
          
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16}}>
            <div>
              <label style={{display: 'block', marginBottom: 6, fontWeight: 500, color: '#333', fontSize: 14}}>БИН</label>
              <input 
                value={information.companyInfo.bin} 
                onChange={(e) => updateCompanyInfo('bin', e.target.value)}
                placeholder="170540006129"
                style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ced4da', fontSize: 14}}
              />
            </div>
            <div>
              <label style={{display: 'block', marginBottom: 6, fontWeight: 500, color: '#333', fontSize: 14}}>ИИК</label>
              <input 
                value={information.companyInfo.iik} 
                onChange={(e) => updateCompanyInfo('iik', e.target.value)}
                placeholder="KZ256018861000677041"
                style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ced4da', fontSize: 14}}
              />
            </div>
          </div>
          
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 0}}>
            <div>
              <label style={{display: 'block', marginBottom: 6, fontWeight: 500, color: '#333', fontSize: 14}}>КБЕ</label>
              <input 
                value={information.companyInfo.kbe} 
                onChange={(e) => updateCompanyInfo('kbe', e.target.value)}
                placeholder="17"
                style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ced4da', fontSize: 14}}
              />
            </div>
            <div>
              <label style={{display: 'block', marginBottom: 6, fontWeight: 500, color: '#333', fontSize: 14}}>Банк</label>
              <input 
                value={information.companyInfo.bank} 
                onChange={(e) => updateCompanyInfo('bank', e.target.value)}
                placeholder="АО «Народный Банк Казахстана»"
                style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ced4da', fontSize: 14}}
              />
            </div>
          </div>
        </div>

        <div style={{textAlign: 'center', padding: 20, borderTop: '1px solid #e9ecef'}}>
          <button 
            onClick={handleSave} 
            disabled={saving} 
            style={{
              background: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '12px 32px',
              fontSize: 16,
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              marginBottom: 16
            }}
          >
            {saving ? '💾 Сохранение...' : '💾 Сохранить настройки'}
          </button>
          <div>
            <small style={{color: '#6c757d', fontSize: 12}}>
              💡 Нажмите кнопку "Сохранить настройки" чтобы применить изменения
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteSettings; 