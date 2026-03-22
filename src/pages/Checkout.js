import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
// import DeliveryInfo from '../components/DeliveryInfo';
import '../styles/Product.css';
import '../styles/Checkout.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { trackFormSubmit, trackPurchaseComplete } from '../utils/analytics';
import Seo from '../components/Seo';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const product = location.state?.product;
  const unitPrice = location.state?.unitPrice ?? (product ? Number(product.price) : 0);
  const [quantity, setQuantity] = useState(location.state?.quantity ?? 1);
  const [payment, setPayment] = useState('cashless');
  const [paymentMethod, setPaymentMethod] = useState('remote'); // remote, qr, transfer
  const [deliveryType, setDeliveryType] = useState('pickup'); // pickup, delivery
  const [form, setForm] = useState({ firstName: '', phone: '', address: '', comment: '' });
  const [formErrors, setFormErrors] = useState({ firstName: '', phone: '' });
  const [promo, setPromo] = useState('');
  const [siteSettings, setSiteSettings] = useState({ showPromoCode: false });
  const [selectedCity, setSelectedCity] = useState('Алматы');
  // eslint-disable-next-line no-unused-vars
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [detectedCity, setDetectedCity] = useState(null);
  const [showCityConfirm, setShowCityConfirm] = useState(false);

  useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        const response = await fetch('/api/information');
        if (response.ok) {
          const data = await response.json();
          if (data.information) {
            setSiteSettings({
              showPromoCode: data.information.showPromoCode || false
            });
          }
        }
      } catch (error) {
        console.log('Ошибка загрузки настроек сайта:', error);
      }
    };
    
    fetchSiteSettings();
  }, []);

  // Автоопределение города по IP (используется ipapi.co как fallback)
  useEffect(() => {
    let mounted = true;
    const detect = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        const city = data.city || data.region || null;
        if (city) {
          // Показываем подтверждение только если город отличается от текущего
          if (city && city !== selectedCity) {
            setDetectedCity(city);
            setShowCityConfirm(true);
          }
        }
      } catch (err) {
        // Игнорируем ошибки детекции
        // console.log('City detection failed', err);
      }
    };

    detect();
    return () => { mounted = false; };
  }, [selectedCity]);

  const acceptDetectedCity = () => {
    if (detectedCity) {
      setSelectedCity(detectedCity);
      // Auto-populate address with city prefix if empty
      if (!form.address) {
        setForm({ ...form, address: `г. ${detectedCity}, ` });
      }
    }
    setShowCityConfirm(false);
  };

  const declineDetectedCity = () => {
    setDetectedCity(null);
    setShowCityConfirm(false);
  };

  const isEmailLike = (value) => {
    const v = String(value || '').trim();
    if (!v) return false;
    return /@/.test(v) || /\b[a-z0-9._%+-]+\.[a-z]{2,}\b/i.test(v);
  };

  const normalizePhone = (value) => {
    const raw = String(value || '');
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('7')) return `+${digits}`;
    if (digits.startsWith('8')) return `+7${digits.slice(1)}`;
    return `+${digits}`;
  };

  const validate = (nextForm) => {
    const errors = { firstName: '', phone: '' };

    const firstName = String(nextForm.firstName || '').trim();
    if (!firstName || firstName.length < 2 || isEmailLike(firstName)) {
      errors.firstName = 'Введите, пожалуйста, имя';
    }

    const phone = String(nextForm.phone || '').trim();
    if (phone) {
      const digits = phone.replace(/\D/g, '');
      if (!phone.startsWith('+7') || digits.length !== 11) {
        errors.phone = 'Телефон в формате +7XXXXXXXXXX';
      }
    }

    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const next = { ...form };
    if (name === 'phone') {
      next.phone = normalizePhone(value);
    } else {
      next[name] = value;
    }
    setForm(next);
    setFormErrors(validate(next));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const errors = validate(form);
    setFormErrors(errors);
    if (errors.firstName || errors.phone) {
      return;
    }
    
    // Проверяем обязательные поля
    if (!form.firstName || !form.phone) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }
    
    if (deliveryType === 'delivery' && !form.address) {
      alert('Пожалуйста, укажите адрес доставки');
      return;
    }
    
    // Формируем сообщение с деталями заказа
    const orderDetails = {
      product: product?.name,
      price: total,
      deliveryType: deliveryType === 'pickup' ? 'Самовывоз' : 'Доставка',
      address: deliveryType === 'delivery' ? form.address : 'Бокейханова 510, Склад, Алматы',
      payment: payment === 'cash' ? 'Наличными' : 'Безналичный расчет',
      paymentMethod: payment === 'cashless' ? (paymentMethod === 'remote' ? 'Удаленная оплата' : paymentMethod === 'qr' ? 'QR-код' : paymentMethod === 'transfer' ? 'Перевод' : '') : '',
      customer: form.firstName,
      phone: form.phone,
      comment: form.comment,
      total: finalTotal
    };
    
    // Сохраняем заказ в БД и отправляем в Telegram
    (async () => {
      let orderId = null;
      try {
        const resp = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: form.firstName,
            phone: form.phone,
            address: deliveryType === 'delivery' ? form.address : '',
            comment: form.comment,
            items: product ? [{ productId: product._id, productName: product.name, price: Number(unitPrice), quantity }] : [],
            deliveryType,
            payment,
            paymentMethod: payment === 'cashless' ? paymentMethod : null,
            total: Number(finalTotal)
          })
        });
        const data = await resp.json();
        if (!data.success) throw new Error('Ошибка сохранения заказа');
        orderId = data.orderId || Date.now().toString();
      } catch (err) {
        console.log('Ошибка сохранения заказа:', err.message);
        orderId = Date.now().toString(); // fallback ID
      }
      try {
        // Формируем доставку с городом — в сообщении показываем бесплатная в Алматы, платная в других регионах
        let deliveryText;
        if (deliveryType === 'pickup') {
          deliveryText = 'Самовывоз: Бокейханова 510, Склад, Алматы';
        } else {
          const cityNorm = (selectedCity || '').toString().trim().toLowerCase();
          if (cityNorm === 'алматы' || cityNorm === 'almaty') {
            deliveryText = 'Доставка: Бесплатная по г. Алматы';
          } else if (selectedCity) {
            deliveryText = `Доставка: Платная в г. ${selectedCity} (5000 ₸)`;
          } else {
            deliveryText = 'Доставка: Платная (5000 ₸, город не определён)';
          }
        }

        // Формируем оплату
        const paymentText = payment === 'cash'
          ? 'Наличными'
          : `Безналичный расчет (${paymentMethod === 'remote' ? 'Удаленная оплата' : paymentMethod === 'qr' ? 'QR-код' : 'Перевод'})`;
        
        const now = new Date();
        const timeStr = now.toLocaleString('ru-RU', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit',
          hour12: false
        });

        // Формат сообщения строго по желанию заказчика
        const addressLine = deliveryType === 'delivery' ? (form.address || '') : 'Бокейханова 510, Склад, Алматы';
        const telegramMessage =
      `<b>Имя:</b> ${form.firstName || ''}\n` +
      `<b>Телефон:</b> ${form.phone || ''}\n` +
      `<b>Сообщение:</b> Заказ через форму\n` +
      `<b>Товар:</b> ${product?.name || ''} × ${quantity} шт.\n` +
      `<b>Доставка:</b> ${deliveryText}\n` +
      `<b>Адрес доставки:</b> ${addressLine}\n` +
      `<b>Оплата:</b> ${paymentText}\n` +
      `<b>Сумма:</b> ${Number(finalTotal).toFixed(0)} ₸\n` +
      `<b>Коментарий:</b> ${form.comment || ''}\n\n`;

        await fetch('/api/send-telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.firstName,
            phone: form.phone,
            message: telegramMessage
          })
        });
      } catch (err) {
        console.log('Ошибка отправки в Telegram:', err.message);
      }
      
      // Отслеживаем завершение покупки
      if (product) {
        trackPurchaseComplete(
          orderId,
          product._id,
          product.name,
          finalTotal,
          'checkout_page'
        );
      }
      
      // Отслеживание отправки формы
      try {
        trackFormSubmit('checkout_form', product?._id);
      } catch (e) {
        console.warn('trackFormSubmit error:', e);
      }
      
      // Переходим на страницу благодарности
      navigate('/thanks');
    })();
  };

  const total = unitPrice * quantity;
  const cityNorm = (selectedCity || '').toString().trim().toLowerCase();
  const deliveryCost = deliveryType === 'delivery'
    ? ((cityNorm === 'алматы' || cityNorm === 'almaty') ? 0 : 5000)
    : 0;
  const finalTotal = total + deliveryCost;

  return (
    <div className="product-page">
      <Seo
        title="Оформление заказа — Eltok.kz"
        description="Оформление заказа на Eltok.kz. Укажите имя, телефон и способ доставки/оплаты."
        canonical="https://eltok.kz/checkout"
        robots="noindex, nofollow"
      />
      <Header />
      <main className="product-main" style={{ minHeight: 500 }}>
        <div className="checkout-container">
          {/* Левая колонка - Форма */}
          <div className="checkout-products">
            <h1 className="product-title" style={{ marginBottom: 16 }}>Оформление заказа</h1>

            {/* 1. Контактные данные */}
            <div className="checkout-form-container" style={{marginBottom: 16}}>
              <div style={{fontWeight:700, marginBottom:12}}><span style={{color:'#FFB300'}}>1</span> Контактные данные</div>
              <div className="form-group">
                <label>Телефон</label>
                {formErrors.phone && (
                  <div style={{ color: '#d32f2f', fontSize: 13, marginBottom: 6 }}>{formErrors.phone}</div>
                )}
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} required placeholder="+7XXXXXXXXXX" inputMode="tel" />
              </div>
              <div className="form-group">
                <label>Имя</label>
                {formErrors.firstName && (
                  <div style={{ color: '#d32f2f', fontSize: 13, marginBottom: 6 }}>{formErrors.firstName}</div>
                )}
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                  placeholder="Введите имя"
                  style={formErrors.firstName ? { borderColor: '#d32f2f', boxShadow: '0 0 0 2px rgba(211, 47, 47, 0.15)' } : undefined}
                />
              </div>
              
            </div>

            {/* 2. Доставка */}
            <div className="checkout-form-container" style={{marginBottom: 16}}>
              <div style={{fontWeight:700, marginBottom:12}}><span style={{color:'#FFB300'}}>2</span> Доставка</div>
              <div className="delivery-methods">
                <label style={{display:'flex', alignItems:'center', marginBottom:8, cursor:'pointer'}}>
                  <input 
                    type="radio" 
                    name="delivery" 
                    value="pickup" 
                    checked={deliveryType === 'pickup'} 
                    onChange={() => setDeliveryType('pickup')}
                    style={{marginRight:6}}
                  />
                  Самовывоз
                </label>
                <label style={{display:'flex', alignItems:'center', cursor:'pointer'}}>
                  <input 
                    type="radio" 
                    name="delivery" 
                    value="delivery" 
                    checked={deliveryType === 'delivery'} 
                    onChange={() => setDeliveryType('delivery')}
                    style={{marginRight:6}}
                  />
                  Доставка
                </label>
              </div>

              {deliveryType === 'delivery' && (
                <div style={{marginTop:12, paddingLeft:20}}>
                  <div style={{color:'#666', fontSize:14, padding:'8px 12px', background:'#f5f5f5', borderRadius:4, marginBottom: 10}}>
                    Доставка в другие города и область — платная, 5000 ₸
                  </div>
                  <div className="form-group">
                    <label>Укажите адрес</label>
                    <input
                      type="text" 
                      name="address" 
                      value={form.address} 
                      onChange={handleChange} 
                      placeholder="Введите адрес доставки" 
                      required={deliveryType === 'delivery'}
                    />
                  </div>
                  {showCityConfirm && detectedCity && (
                    <div style={{background:'#fff8e1',border:'1px solid #ffe082',padding:10,borderRadius:6,marginTop:10,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <div style={{fontSize:14,color:'#333'}}>
                        Ваш город — <strong>{detectedCity}</strong>? 
                      </div>
                      <div style={{display:'flex',gap:8}}>
                        <button onClick={acceptDetectedCity} style={{padding:'6px 10px',background:'#4caf50',color:'#fff',border:'none',borderRadius:6,cursor:'pointer'}}>Да</button>
                        <button onClick={declineDetectedCity} style={{padding:'6px 10px',background:'#e0e0e0',color:'#333',border:'none',borderRadius:6,cursor:'pointer'}}>Нет</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {deliveryType === 'pickup' && (
                <div style={{marginTop:12, paddingLeft:20}}>
                  <div style={{color:'#666', fontSize:14, padding:'8px 12px', background:'#f5f5f5', borderRadius:4}}>
                    Самовывоз: Бокейханова 510, Склад, Алматы
                  </div>
                </div>
              )}
            </div>

            {/* 3. Оплата */}
            <div className="checkout-form-container" style={{marginBottom: 16}}>
              <div style={{fontWeight:700, marginBottom:12}}><span style={{color:'#FFB300'}}>3</span> Оплата</div>
              <div className="payment-methods">
                {/* Безналичный расчёт */}
                <div style={{display:'flex', flexDirection:'column', gap:8}}>
                  <label style={{display:'flex', alignItems:'center', cursor:'pointer'}}>
                    <input 
                      type="radio" 
                      name="payment" 
                      value="cashless" 
                      checked={payment==='cashless'} 
                      onChange={()=>setPayment('cashless')}
                      style={{marginRight:6}}
                    />
                    Безналичный расчет
                  </label>
                  {/* Доп. способы сразу ПОД безналичным расчётом */}
                  {payment === 'cashless' && (
                    <div style={{marginLeft:20}}>
                      <div style={{marginBottom:8}}>
                        <label style={{display:'flex', alignItems:'center', cursor:'pointer'}}>
                          <input 
                            type="radio" 
                            name="paymentMethod" 
                            value="remote" 
                            checked={paymentMethod==='remote'} 
                            onChange={()=>setPaymentMethod('remote')}
                            style={{marginRight:6}}
                          />
                          Удаленная оплата
                        </label>
                        <label style={{display:'flex', alignItems:'center', cursor:'pointer'}}>
                          <input 
                            type="radio" 
                            name="paymentMethod" 
                            value="qr" 
                            checked={paymentMethod==='qr'} 
                            onChange={()=>setPaymentMethod('qr')}
                            style={{marginRight:6}}
                          />
                          QR-код
                        </label>
                        <label style={{display:'flex', alignItems:'center', cursor:'pointer'}}>
                          <input 
                            type="radio" 
                            name="paymentMethod" 
                            value="transfer" 
                            checked={paymentMethod==='transfer'} 
                            onChange={()=>setPaymentMethod('transfer')}
                            style={{marginRight:6}}
                          />
                          Перевод
                        </label>
                      </div>
                      {paymentMethod === 'remote' && (
                        <div style={{color:'#666', fontSize:14, padding:'8px 12px', background:'#f5f5f5', borderRadius:4}}>
                          Оплата будет произведена после подтверждения заказа менеджером
                        </div>
                      )}
                      {paymentMethod === 'qr' && (
                        <div style={{color:'#666', fontSize:14, padding:'8px 12px', background:'#f5f5f5', borderRadius:4}}>
                          QR-код для оплаты будет отправлен после подтверждения заказа
                        </div>
                      )}
                      {paymentMethod === 'transfer' && (
                        <div style={{color:'#666', fontSize:14, padding:'8px 12px', background:'#f5f5f5', borderRadius:4}}>
                          Реквизиты для перевода будут отправлены после подтверждения заказа
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Наличными */}
                <label style={{display:'flex', alignItems:'center', cursor:'pointer', marginTop:8}}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value="cash" 
                    checked={payment==='cash'} 
                    onChange={()=>setPayment('cash')}
                    style={{marginRight:6}}
                  />
                  Наличными
                </label>
              </div>
            </div>

            {/* Комментарий */}
            <div className="checkout-form-container">
              <div style={{fontWeight:700, marginBottom:12}}>Комментарий к заказу</div>
              <div className="form-group">
                <textarea name="comment" value={form.comment} onChange={handleChange} placeholder="Введите комментарий" />
              </div>
            </div>
          </div>

          {/* Правая колонка - Итоги */}
          <div className="checkout-form">
            <div style={{ height: '60px', marginBottom: 0 }}></div> {/* Невидимый блок для выравнивания с заголовком */}
            {product && (
              <div>
                <div className="checkout-product-card">
                  <img src={product.image || '/images/products/placeholder.png'} alt={product.name} style={{width: 72, height: 72, objectFit: 'contain', borderRadius: 8, background: '#fff', border: '1px solid #e0e0e0'}} />
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600}}>{product.name}</div>
                    <div style={{color:'#666', fontSize:14}}>{quantity} шт.</div>
                  </div>
                  <div style={{fontWeight:700, color:'#1a2236'}}>{Number(total).toFixed(3).replace(/\.?0+$/, '')} ₸</div>
                </div>

                <div style={{marginTop:10, marginBottom:12}}>
                  <label style={{display:'block', marginBottom:6, color:'#333', fontWeight:600}}>Количество</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setQuantity(Number.isNaN(val) || val < 1 ? 1 : val);
                    }}
                    style={{width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #e6e6e6'}}
                  />
                </div>
              </div>
            )}

            <div className="checkout-form-container" style={{marginBottom:12}}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}>
                <span style={{color:'#666'}}>Стоимость заказа:</span>
                <span style={{fontWeight:600}}>{Number(total).toFixed(3).replace(/\.?0+$/, '')} ₸</span>
              </div>
              {deliveryCost > 0 && (
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}>
                  <span style={{color:'#666'}}>Доставка:</span>
                  <span style={{fontWeight:600}}>{Number(deliveryCost).toFixed(3).replace(/\.?0+$/, '')} ₸</span>
                </div>
              )}
              <div style={{display:'flex', justifyContent:'space-between', borderTop:'1px solid #e0e0e0', paddingTop:12}}>
                <span style={{fontWeight:600}}>К оплате:</span>
                <span style={{color:'#FFB300', fontWeight:700}}>{Number(finalTotal).toFixed(3).replace(/\.?0+$/, '')} ₸</span>
              </div>
            </div>

            {siteSettings.showPromoCode && (
              <div className="checkout-form-container" style={{marginBottom:12}}>
                <div style={{display:'flex', gap:8}}>
                  <input type="text" placeholder="Ввести промокод" value={promo} onChange={(e)=>setPromo(e.target.value)} style={{flex:1}} />
                  <button type="button" className="submit-button" style={{padding:'12px 16px', width:160}}>Применить</button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <button type="submit" className="submit-button">Оформить заказ</button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout; 