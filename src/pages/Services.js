import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Modal from '../components/Modal';
import Seo from '../components/Seo';
import '../styles/Services.css';

const Services = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const handleSubmitForm = () => {};

  const services = [
    {
      id: 'video',
      title: 'Видеонаблюдение и Видеоаналитика',
      description: 'Мы проектируем и монтируем системы визуального мониторинга любой сложности. Наша задача — не просто установить камеру, а дать вам инструмент для контроля ситуации в реальном времени.',
      items: [
        { title: 'Цифровое (IP) видеонаблюдение', text: 'Высокая детализация (4K), интеллектуальный поиск в архиве и удаленный доступ через мобильное приложение.' },
        { title: 'Аналоговые системы (AHD/TVI)', text: 'Экономичное решение для модернизации существующих сетей с сохранением кабельных трасс.' },
        { title: 'Проектирование', text: 'Грамотный расчет углов обзора, исключение «мертвых зон» и подбор оптимальных хранилищ данных.' }
      ]
    },
    {
      id: 'access',
      title: 'Системы Контроля и Управления Доступом (СКУД)',
      description: 'Ограничение доступа посторонних и автоматизация пропускного режима. Мы внедряем решения, которые делают объект «умным» и защищенным.',
      items: [
        { title: 'Идентификация', text: 'Установка считывателей карт, бесконтактных меток и современных биометрических сканеров (лицо, отпечаток пальца).' },
        { title: 'Учет рабочего времени', text: 'Автоматический мониторинг дисциплины персонала, фиксация опозданий и ранних уходов.' },
        { title: 'Интеграция', text: 'Связка СКУД с видеонаблюдением и охранной системой для комплексного отклика на инциденты.' }
      ]
    },
    {
      id: 'automation',
      title: 'Автоматизация проездов и проходов',
      description: 'Оптимизация трафика на территории вашего предприятия, ЖК или парковки.',
      items: [
        { title: 'Шлагбаумы и болларды', text: 'Установка скоростных барьеров с управлением через пульт, телефон или систему распознавания номеров.' },
        { title: 'Турникеты', text: 'Монтаж полноростовых или поясных моделей для фиксации потока людей на проходных.' },
        { title: 'Приводы для ворот', text: 'Автоматизация распашных и откатных конструкций для комфортного въезда.' }
      ]
    },
    {
      id: 'security',
      title: 'Охранно-пожарная безопасность (ОПС)',
      description: 'Защита жизни людей и сохранности имущества — приоритет любого бизнеса.',
      items: [
        { title: 'Пожарная сигнализация', text: 'Монтаж систем обнаружения возгорания, систем оповещения и управления эвакуацией (СОУЭ) согласно действующим ГОСТам.' },
        { title: 'Охранный мониторинг', text: 'Установка датчиков движения, вибрации и акустических сенсоров для защиты периметра от вторжения.' },
        { title: 'Пультовая охрана', text: 'Подключение систем к централизованным пультам быстрого реагирования.' }
      ]
    },
    {
      id: 'maintenance',
      title: 'Техническое обслуживание и Модернизация',
      description: 'Любая сложная система требует профессионального ухода. Мы берем на себя «здоровье» вашего оборудования.',
      items: [
        { title: 'Регламентный сервис', text: 'Чистка оптики, проверка емкости аккумуляторов, обновление программного обеспечения.' },
        { title: 'Реновация', text: 'Замена устаревших компонентов на современные аналоги без полной остановки работы системы.' },
        { title: 'Аварийный ремонт', text: 'Оперативное устранение неисправностей и восстановление работоспособности системы в кратчайшие сроки.' }
      ]
    }
  ];

  const advantages = [
    { title: 'Индивидуальное проектирование', text: 'Мы не предлагаем шаблонных решений. Каждая смета составляется под задачи заказчика.' },
    { title: 'Эстетика монтажа', text: 'Наши специалисты работают чисто, скрывая коммуникации и соблюдая интерьерные особенности объекта.' },
    { title: 'Гарантийные обязательства', text: 'Мы сопровождаем объект после сдачи, обеспечивая полную информационную и техническую поддержку.' }
  ];

  return (
    <div className="services">
      <Seo
        title="Наши услуги — Cameras.kz"
        description="Полный цикл внедрения систем безопасности: видеонаблюдение, СКУД, охранно-пожарная сигнализация, автоматизация проездов. Проектирование, монтаж, обслуживание."
        canonical="https://cameras.kz/services"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: 'Услуги систем безопасности',
          provider: {
            '@type': 'Organization',
            name: 'Cameras.kz',
            url: 'https://cameras.kz'
          },
          serviceType: 'Системы безопасности и видеонаблюдения'
        }}
      />
      <Header />
      <main className="services-main">
        <div className="container">
          <section className="services-hero">
            <h1 className="services-title">Наши Услуги</h1>
            <p className="services-intro">
              Мы обеспечиваем полный цикл внедрения слаботочных систем: от разработки концепции до регулярного сервисного сопровождения.
            </p>
          </section>

          <section className="services-list">
            {services.map((service) => (
              <div key={service.id} className="service-card">
                <div className="service-header">
                  <h2 className="service-name">{service.title}</h2>
                  <p className="service-description">{service.description}</p>
                </div>
                <div className="service-items">
                  {service.items.map((item, index) => (
                    <div key={index} className="service-item">
                      <h3 className="service-item-title">{item.title}</h3>
                      <p className="service-item-text">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section className="services-advantages">
            <h2 className="advantages-title">Почему доверяют нам?</h2>
            <div className="advantages-grid">
              {advantages.map((adv, index) => (
                <div key={index} className="advantage-card">
                  <h3 className="advantage-title">{adv.title}</h3>
                  <p className="advantage-text">{adv.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="services-cta">
            <div className="cta-card">
              <h2 className="cta-title">Хотите рассчитать предварительную стоимость проекта?</h2>
              <p className="cta-text">Оставьте заявку, и наш специалист свяжется с вами для консультации</p>
              <button className="btn-cta" onClick={handleOpenModal}>
                Оставить заявку
              </button>
            </div>
          </section>
        </div>
      </main>
      <Footer />
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} onSubmit={handleSubmitForm} />
    </div>
  );
};

export default Services;
