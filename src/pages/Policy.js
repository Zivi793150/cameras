import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/Policy.css';
import Seo from '../components/Seo';

const Policy = () => {
  return (
    <div className="policy">
      <Seo
        title="Политика и реквизиты — Eltok.kz"
        description="Политика, реквизиты и контактные данные компании Eltok.kz. Юридическая информация и способы связи."
        canonical="https://eltok.kz/policy"
      />
      <Header />
      
      <main className="policy-main">
        <div className="container">
          <h1 className="policy-title">Политика и реквизиты</h1>
          
          {/* Реквизиты компании */}
          <section className="company-details">
            <h2>Реквизиты компании</h2>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Название:</span>
                <span className="detail-value">A-Market</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">БИН:</span>
                <span className="detail-value">940727401776</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">ИИК:</span>
                <span className="detail-value">KZ04722S000042260245</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">КБЕ:</span>
                <span className="detail-value">19</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Банк:</span>
                <span className="detail-value">АО «Kaspi Bank»</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">БИК:</span>
                <span className="detail-value">CASPKZKA</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Юридический адрес:</span>
                <span className="detail-value">г. Алматы, Бокейханова 510, Склад</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Фактический адрес:</span>
                <span className="detail-value">г. Алматы, Бокейханова 510, Склад</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Телефон:</span>
                <span className="detail-value">+7 (707) 517-73-85</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email:</span>
                <span className="detail-value">info@eltok.kz</span>
              </div>
            </div>
          </section>

          {/* Политика конфиденциальности */}
          <section className="privacy-policy">
            <h2>Политика конфиденциальности</h2>
            <div className="policy-content">
              <h3>1. Общие положения</h3>
              <p>
                Настоящая Политика конфиденциальности определяет порядок обработки персональных данных 
                пользователей сайта eltok.kz (далее — Сайт) Eltok.kz (далее — Компания).
              </p>
              
              <h3>2. Сбор информации</h3>
              <p>
                Мы собираем только ту информацию, которую вы предоставляете добровольно при заполнении 
                форм на сайте: имя, телефон, email и сообщение.
              </p>
              
              <h3>3. Использование информации</h3>
              <p>
                Собранная информация используется исключительно для связи с вами по поводу заявок, 
                консультаций и заказов. Мы не передаем ваши данные третьим лицам.
              </p>
              
              <h3>4. Безопасность данных</h3>
              <p>
                Мы принимаем все необходимые меры для защиты ваших персональных данных от несанкционированного 
                доступа, изменения, раскрытия или уничтожения.
              </p>
              
              <h3>5. Права пользователей</h3>
              <p>
                Вы имеете право на получение информации о том, какие ваши персональные данные обрабатываются, 
                а также на их исправление или удаление.
              </p>
            </div>
          </section>

          {/* Условия доставки */}
          <section className="delivery-terms">
            <h2>Условия доставки</h2>
            <div className="delivery-content">
              <h3>🚚 Доставка по Алматы</h3>
              <ul>
                <li>Бесплатная доставка при заказе от 50 000 ₸</li>
                <li>Стоимость доставки при заказе до 50 000 ₸: 2 000 ₸</li>
                <li>Время доставки: в день заказа (при заказе до 15:00)</li>
                <li>Доставка осуществляется с 9:00 до 18:00</li>
              </ul>
              
              <h3>🚚 Доставка по области</h3>
              <ul>
                <li>Стоимость доставки: от 3 000 ₸ (зависит от расстояния)</li>
                <li>Время доставки: на следующий день после заказа</li>
                <li>Доставка в города: Регионы Казахстана</li>
              </ul>
              
              <h3>📦 Самовывоз</h3>
              <ul>
                <li>Адрес: г. Алматы, Бокейханова 510, Склад</li>
                <li>Время работы: Без выходных</li>
                <li>Бесплатно</li>
              </ul>
            </div>
          </section>

          {/* Способы оплаты */}
          <section className="payment-methods">
            <h2>Способы оплаты</h2>
            <div className="payment-grid">
              <div className="payment-item">
                <div className="payment-icon">💳</div>
                <h3>Банковские карты</h3>
                <p>Visa, MasterCard, Kaspi Gold</p>
              </div>
              <div className="payment-item">
                <div className="payment-icon">📱</div>
                <h3>Kaspi.kz</h3>
                <p>Оплата через приложение Kaspi</p>
              </div>
              <div className="payment-item">
                <div className="payment-icon">💰</div>
                <h3>Наличные</h3>
                <p>Оплата при получении товара</p>
              </div>
              <div className="payment-item">
                <div className="payment-icon">🏦</div>
                <h3>Безналичный расчёт</h3>
                <p>Для юридических лиц</p>
              </div>
            </div>
          </section>

          {/* Условия возврата */}
          <section className="return-policy">
            <h2>Условия возврата и обмена</h2>
            <div className="return-content">
              <h3>✅ Возврат товара</h3>
              <p>
                Возврат товара возможен в течение 14 дней с момента покупки при условии сохранения 
                товарного вида и комплектации. Возврат осуществляется в офисе компании.
              </p>
              
              <h3>🔧 Гарантийное обслуживание</h3>
              <p>
                Гарантийный срок на электроинструменты составляет 12 месяцев с момента покупки. 
                Гарантийное обслуживание осуществляется в авторизованных сервисных центрах.
              </p>
              
              <h3>📋 Не подлежит возврату</h3>
              <ul>
                <li>Товары с нарушенной упаковкой</li>
                <li>Товары с признаками использования</li>
                <li>Товары без документов о покупке</li>
                <li>Расходные материалы (диски, свёрла и т.д.)</li>
              </ul>
            </div>
          </section>

          {/* Контактная информация */}
          <section className="contact-info">
            <h2>Контактная информация</h2>
            <div className="contact-grid">
              <div className="contact-item">
                <h3>📞 Телефоны</h3>
                <p>+7 (707) 517-73-85</p>
              </div>
              <div className="contact-item">
                <h3>✉️ Email</h3>
                <p>info@eltok.kz</p>
              </div>
              <div className="contact-item">
                <h3>📍 Адрес</h3>
                <p>г. Алматы, Бокейханова 510, Склад</p>
              </div>
              <div className="contact-item">
                <h3>🕒 Режим работы</h3>
                <p>Без выходных</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Policy; 