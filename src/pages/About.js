import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/About.css';
import Seo from '../components/Seo';

const About = () => (
    <div className="about">
      <Seo
        title="О компании — Cameras.kz"
        description="Cameras.kz — профессиональные системы видеонаблюдения и безопасности в Казахстане. Продажа, установка, обслуживание."
        canonical="https://cameras.kz/about"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Cameras.kz',
          url: 'https://cameras.kz'
        }}
      />
      <Header />
      <main className="about-main">
        <div className="container">
          <h1 className="about-title">О компании</h1>
          <section className="about-hero">
            <div className="about-hero-content">
              <p className="about-subtitle">Ведущий поставщик систем видеонаблюдения и безопасности в Казахстане</p>
              <p>Мы предлагаем комплексные решения для защиты вашего дома, офиса, магазина или промышленного объекта. В нашем каталоге — современные камеры видеонаблюдения, системы контроля доступа и оборудование для умного дома.</p>
              <p>Мы работаем только с проверенными мировыми производителями и гарантируем качество и надёжность каждого устройства. Наша цель — обеспечить вас современными системами безопасности, которые работают круглосуточно и эффективно защищают то, что вам дорого.</p>
            </div>
            <div className="about-hero-image">
              <img src="/cam2.webp" alt="Логотип Cameras.kz" loading="lazy" width="500" height="300" />
            </div>
          </section>
          <section className="about-experience">
            <h2>Наш опыт</h2>
            <div className="experience-grid">
            <div className="experience-item"><div className="experience-number">5</div><div className="experience-text">Лет на рынке</div></div>
            <div className="experience-item"><div className="experience-number">2000+</div><div className="experience-text">Установленных систем</div></div>
            <div className="experience-item"><div className="experience-number">500+</div><div className="experience-text">Товаров в каталоге</div></div>
            <div className="experience-item"><div className="experience-number">24/7</div><div className="experience-text">Техническая поддержка</div></div>
            </div>
          </section>
          <section className="about-history">
            <h2>История компании</h2>
            <div className="history-content">
            <p>Компания Cameras.kz была основана в 2019 году с целью предоставить качественные решения для видеонаблюдения в Казахстане. Начав с небольшого склада в Алматы, мы быстро выросли в одного из ведущих поставщиков систем безопасности.</p>
            <p>С первых дней мы делаем ставку на качество оборудования и высокий уровень сервиса. Постепенно расширяя ассортимент, мы сформировали комплексное предложение: от IP-камер и видеорегистраторов до полноценных систем контроля доступа и умного дома.</p>
            <p>Сегодня Cameras.kz обслуживает как крупные коммерческие объекты и промышленные предприятия, так и частных домовладельцев. Репутация компании строится на доверии клиентов, надёжности оборудования и профессиональном подходе к каждому проекту.</p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );

export default About; 