// Утилита для отправки форм в Telegram

export const sendToTelegram = async (formData, product = null) => {
  try {
    // Определяем базовый URL API (локально шлём на порт сервера)
    // Используем относительный путь для локального API
    const API_BASE = '';

    // Отправляем данные на наш API endpoint
    const response = await fetch(`${API_BASE}/api/send-telegram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: formData.name,
        phone: formData.phone,
        message: formData.message,
        product: product
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      return { success: true, message: 'Заявка успешно отправлена!' };
    } else {
      console.error('Ошибка API:', result.error);
      return { success: false, message: result.error || 'Ошибка отправки заявки' };
    }
    
  } catch (error) {
    console.error('Ошибка отправки в Telegram:', error);
    return { success: false, message: 'Ошибка отправки заявки' };
  }
};

// Функция для валидации формы
export const validateForm = (formData) => {
  const errors = {};

  const nameRaw = String(formData?.name || '').trim();
  const looksLikeEmail = (value) => {
    const v = String(value || '').trim();
    if (!v) return false;
    return /@/.test(v) || /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i.test(v);
  };
  
  if (!nameRaw) {
    errors.name = 'Введите, пожалуйста, имя';
  } else if (looksLikeEmail(nameRaw)) {
    errors.name = 'Введите, пожалуйста, имя';
  }
  
  if (!formData.phone.trim()) {
    errors.phone = 'Телефон обязателен для заполнения';
  } else if (!/^[+]?[0-9\s\-()]{10,}$/.test(formData.phone)) {
    errors.phone = 'Введите корректный номер телефона';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}; 