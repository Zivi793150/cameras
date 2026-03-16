import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateForm, sendToTelegram } from '../utils/telegram';
import { trackFormSubmit } from '../utils/analytics';
import '../styles/Modal.css';

const Modal = ({ isOpen, onClose, onSubmit, product = null }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (name === 'name') {
      const v = String(value || '').trim();
      const emailLike = /@/.test(v) || /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i.test(v);
      if (!v || v.length < 2 || emailLike) {
        setErrors(prev => ({ ...prev, name: 'Введите, пожалуйста, имя' }));
        return;
      }
      if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
      return;
    }

    // Очищаем ошибку при вводе
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Валидация формы
    const validation = validateForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Отправка в Telegram
      const result = await sendToTelegram(formData, product);
      
      if (result.success) {
        // Отслеживание отправки формы — отправляем событие
        try {
          trackFormSubmit('contact_form', product?._id || product?.id || null);
        } catch (e) {
          console.warn('trackFormSubmit error:', e);
        }

        onSubmit(formData);
        setFormData({ name: '', phone: '', message: '' });
        setErrors({});
        onClose();
        navigate('/thanks');
      } else {
        alert('Ошибка отправки заявки. Попробуйте позже.');
      }
    } catch (error) {
      console.error('Ошибка отправки:', error);
      alert('Ошибка отправки заявки. Попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Оставить заявку</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="name">Имя *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">Телефон *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={errors.phone ? 'error' : ''}
              placeholder="+7 (777) 777-77-77"
            />
            {errors.phone && <span className="error-message">{errors.phone}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="message">Сообщение</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows="4"
              placeholder="Опишите ваш запрос..."
            />
          </div>
          
          <button 
            type="submit" 
            className="btn-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Отправка...' : 'Отправить'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Modal; 