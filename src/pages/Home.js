import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Modal from '../components/Modal';
import AboutCompanySection from '../components/AboutCompanySection';
// SimpleSlider временно отключён по требованию: возвращаем статичное изображение
import { fetchWithCache } from '../utils/cache';
import '../styles/Home.css';
import Seo from '../components/Seo';
import HeroSlider from '../components/HeroSlider';
import WhyChooseUsSection from '../components/WhyChooseUsSection';
import SolutionsSection from '../components/SolutionsSection';
import PlansSection from '../components/PlansSection';

// Удалён неиспользуемый fetchWithRetry

const Home = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [miniProducts, setMiniProducts] = useState([]);
  const [slideIndex, setSlideIndex] = useState(0);
  // Слайдер отключён — состояния для карусели не нужны
  const navigate = useNavigate();

  // Универсально получаем URL картинки товара
  const getOptimalImage = (product, preferredSize = 'medium') => {
    const pick = (url) => (typeof url === 'string' && url.trim() ? url : null);

    // 1) обложка группы
    if (product.productGroup && pick(product.productGroup.coverImage)) return product.productGroup.coverImage;

    // 2) варианты размеров
    if (product.imageVariants) {
      if (pick(product.imageVariants[preferredSize])) return product.imageVariants[preferredSize];
      if (pick(product.imageVariants.webp)) return product.imageVariants.webp;
      if (pick(product.imageVariants.original)) return product.imageVariants.original;
    }

    // 3) coverPhoto
    if (pick(product.coverPhoto)) return product.coverPhoto;

    // 4) основное изображение
    if (pick(product.image)) return product.image;

    // 5) массив images
    if (Array.isArray(product.images) && product.images.length) {
      const firstImg = product.images.find(img => pick(img));
      if (firstImg) return firstImg;
    }

    // 6) массив images2
    if (Array.isArray(product.images2) && product.images2.length) {
      const firstImg = product.images2.find(img => pick(img));
      if (firstImg) return firstImg;
    }

    // 7) массив images3
    if (Array.isArray(product.images3) && product.images3.length) {
      const firstImg = product.images3.find(img => pick(img));
      if (firstImg) return firstImg;
    }

    // 8) imageUrl (устаревшее поле)
    if (pick(product.imageUrl)) return product.imageUrl;

    return '/images/products/placeholder.png';
  };

  const API_URL = '/api/products';

  // Слайдер отключён

  useEffect(() => {
    fetchWithCache(API_URL, {}, 5 * 60 * 1000) // кэш на 5 минут, загружаем все товары
      .then(data => {
        if (Array.isArray(data)) {
          setMiniProducts(data);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Фильтруем товары для мини-каталога - показываем все товары как в каталоге
  const filteredMiniProducts = miniProducts.filter(p => p.saleAvailable !== false);

  // Автопрокрутка каждые 10 секунд
  useEffect(() => {
    if (filteredMiniProducts.length <= 8) return;
    const totalSlides = Math.ceil(filteredMiniProducts.length / 8);
    const id = setInterval(() => {
      setSlideIndex(prev => (prev + 1) % totalSlides);
    }, 10000);
    return () => clearInterval(id);
  }, [filteredMiniProducts]);

  const totalSlides = Math.ceil(filteredMiniProducts.length / 8);
  const nextSlide = () => setSlideIndex(prev => (prev + 1) % totalSlides);
  const prevSlide = () => setSlideIndex(prev => (prev - 1 + totalSlides) % totalSlides);
  const visibleProducts = filteredMiniProducts.slice(slideIndex * 8, slideIndex * 8 + 8);



  const handleOpenModal = () => setIsModalOpen(true);
  // Функция для преобразования кириллического названия категории в латинский ID
  const categoryToId = (categoryName) => {
    const categoryMap = {
      'дрели': 'drills',
      'болгарки': 'bolgarki',
      'шуруповёрты': 'screwdrivers',
      'перфораторы': 'hammers',
      'лобзики': 'jigsaws',
      'лазерные уровни': 'levels',
      'генераторы': 'generators',
      'генераторы для дома': 'generators',
      'дизельные генераторы': 'diesel-generators',
      'дизельные генератор': 'diesel-generators',
      'дизельный генератор': 'diesel-generators',
      'аргонно-дуговая сварка': 'argon-arc-welding',
      'бензиновый триммер': 'gasoline-trimmer',
      'глубинный насос': 'deep-pump',
      'отбойный молоток': 'jackhammer',
      'плазморезы': 'plasma-cutter',
      'редукционный клапан': 'reduction-valve',
      'сварочный аппарат': 'welding',
      'сварочный аппараты': 'welding',
      'струйный насос': 'jet-pump',
      'струйный самовсасывающий насос': 'jet-pump',
      'точильный станок': 'bench-grinder',
      'ударная дрель': 'impact-drill',
      'фекальный насос': 'fecal-pump',
      'периферийный насос': 'peripheral-pump',
      'центробежный насос': 'centrifugal-pump',
      'насосы': 'nasosy',
      'насос': 'nasosy',
      'измерители': 'measuring',
      'дрель': 'drills',
      'дрель-шуруповёрты': 'drills',
      'дрели-шуруповёрты': 'drills',
      'болгарка': 'bolgarki',
      'шуруповёрт': 'screwdrivers',
      'перфоратор': 'hammers',
      'лобзик': 'jigsaws',
      'лазерный уровень': 'levels',
      'генератор': 'generators',
      'измеритель': 'measuring',
      // Новые категории
      'гайковерт ударный': 'impact-wrench',
      'кусторезы': 'hedge-trimmers',
      'миксеры': 'mixers',
      'наборный электроинструмент': 'power-tool-sets',
      'ножовки': 'hacksaws',
      'пила': 'saws',
      'пила цепная': 'chainsaws',
      'полировальные машины': 'polishing-machines',
      'пчёлки': 'bees',
      'сабельная пила': 'reciprocating-saws',
      'секаторы': 'pruners',
      'фрезер': 'routers',
      'электрорубанок': 'electric-planers'
    };
    
    const normalizedName = categoryName.toLowerCase().trim().replace(/\s+/g, ' ');
    
    // Сначала ищем точное совпадение
    if (categoryMap[normalizedName]) {
      return categoryMap[normalizedName];
    }
    
    // Спец-правило: любые варианты с "дизель" + "генератор"
    if (normalizedName.includes('дизель') && normalizedName.includes('генератор')) {
      return 'diesel-generators';
    }
    
    // Если точного совпадения нет, ищем по частичному совпадению, 
    // предпочитая более длинные (более специфичные) ключи
    const entriesByLength = Object.entries(categoryMap).sort((a, b) => b[0].length - a[0].length);
    for (const [key, value] of entriesByLength) {
      if (normalizedName.includes(key)) {
        return value;
      }
    }
    
    return normalizedName.replace(/[^a-z0-9]/g, '-');
  };

  const handleCloseModal = () => setIsModalOpen(false);
  const handleSubmitForm = () => {};
  
  // Функция для перехода в каталог с фильтром по категории товара
  const handleProductClick = (product) => {
    if (product.categorySlug) {
      // Используем готовый categorySlug из MongoDB
      console.log(`Home: product.categorySlug="${product.categorySlug}"`);
      navigate(`/catalog/${product.categorySlug}`);
    } else if (product.category) {
      // Fallback: используем старую логику
      const categoryId = categoryToId(product.category.trim());
      console.log(`Home: product.category="${product.category}", categoryId="${categoryId}"`);
      navigate(`/catalog/${categoryId}`);
    } else {
      // Если категории нет, переходим в общий каталог
      navigate('/catalog');
    }
  };

  const advantages = [
    'Профессиональная установка и настройка',
    'Гарантия 12 месяцев на оборудование',
    'Консультация и техническая поддержка',
    'Быстрая доставка по всему Казахстану',
    'Работа с частными и корпоративными клиентами'
  ];

  return (
    <div className="home">
      <Seo
        title="Системы видеонаблюдения — продажа, установка, доставка по Казахстану | Cameras.kz"
        description="Камеры видеонаблюдения и системы безопасности. Продажа и профессиональная установка. Доставка по Алматы и Казахстану. Гарантия 12 месяцев."
        canonical="https://cameras.kz/"
        jsonLd={JSON.stringify([
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Cameras.kz',
            url: 'https://cameras.kz',
            logo: 'https://cameras.kz/logo.webp',
            contactPoint: {
              '@type': 'ContactPoint',
              telephone: '+7-707-517-73-85',
              contactType: 'customer service',
              areaServed: 'KZ',
              availableLanguage: ['Russian', 'Kazakh']
            },
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Алматы',
              addressCountry: 'KZ'
            },
            sameAs: [
              'https://www.instagram.com/cameras.kz',
              'https://wa.me/77075177385',
              'https://www.facebook.com/cameras.kz'
            ]
          },
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            url: 'https://cameras.kz/',
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://cameras.kz/catalog?search={search_term_string}',
              'query-input': 'required name=search_term_string'
            }
          }
        ])}
      />
      <Header />
      <HeroSlider onLeadClick={handleOpenModal} />
      <div className="section-divider">
        <div className="section-divider__line"></div>
        <div className="section-divider__dot"></div>
        <div className="section-divider__line"></div>
      </div>
      <WhyChooseUsSection />
      <SolutionsSection onLeadClick={handleOpenModal} />
      <PlansSection onLeadClick={handleOpenModal} />
      <section className="mini-catalog-section">
        <div className="mini-catalog-header">
          <h2>Каталог товаров</h2>
          <a href="/catalog" className="mini-catalog-link">Смотреть все</a>
        </div>
        <div style={{maxWidth: 1200, margin: '0 auto', width: '100%', position: 'relative'}}>
           {/* Навигация по слайдам */}
           {totalSlides > 1 && (
            <>
              <button aria-label="prev" onClick={prevSlide} style={{position:'absolute',left:-40,top:'45%',transform:'translateY(-50%)',background:'#fff',border:'1px solid #e3e6ea',borderRadius:6,padding:'6px 10px',cursor:'pointer',zIndex:2}}>{'‹'}</button>
              <button aria-label="next" onClick={nextSlide} style={{position:'absolute',right:-40,top:'45%',transform:'translateY(-50%)',background:'#fff',border:'1px solid #e3e6ea',borderRadius:6,padding:'6px 10px',cursor:'pointer',zIndex:2}}>{'›'}</button>
            </>
          )}
          <div className="home-products-grid" style={{gap: 0, height: 'auto', minHeight: 'auto', maxHeight: 'none', alignItems: 'flex-start'}}>
            {visibleProducts.map((product) => (
              <div
                key={product._id}
                onClick={() => handleProductClick(product)}
                style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer', height: 'auto', minHeight: 'auto', maxHeight: 'none', display: 'flex', flexDirection: 'column' }}
              >
                <div
                  className="product-card kaspi-style mini-product-card"
                  style={{ cursor: 'pointer', height: 'auto', minHeight: 'auto', maxHeight: 'none', position: 'relative', fontFamily: 'Roboto, Arial, sans-serif', fontWeight: 400, background: '#fff', display: 'flex', flexDirection: 'column', flex: 'none', flexGrow: 0, flexShrink: 0 }}
                >
                  <div className="product-image" style={{height: '170px', padding: 0, margin: 0, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <picture style={{width: '100%', height: '100%'}}>
                      <source 
                        media="(max-width: 600px)"
                        srcSet={getOptimalImage(product, 'thumb')} 
                        type="image/webp"
                      />
                      <source 
                        media="(min-width: 601px)"
                        srcSet={getOptimalImage(product, 'medium')} 
                        type="image/webp"
                      />
                      <img 
                        src={getOptimalImage(product)} 
                        alt={product.name} 
                        style={{width: '100%', height: '100%', objectFit: 'contain', display: 'block', background:'#fff'}} 
                        loading="lazy"
                        width="260"
                        height="170"
                      />
                    </picture>
                  </div>
                  <div style={{width:'90%',maxWidth:'260px',borderTop:'1px solid #bdbdbd',margin:'0 auto 4px auto', alignSelf:'center'}}></div>
                  <div className="product-info" style={{padding: '2px 8px 18px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, flex: 'none', height: '60px', minHeight: '60px', maxHeight: '60px', margin: 0, border: 'none', background: '#fff'}}>
                    <span style={{fontSize: '1.05rem', fontWeight: 500, color: '#1a2236', margin: '8px 0 0 0', padding: 0, lineHeight: 1.18, textDecoration:'none',cursor:'pointer',display:'block', textAlign:'center', width:'100%', minHeight: 'auto', maxHeight: 'none'}}>
                      {product.productGroup ? product.productGroup.name : product.name}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
      <Modal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitForm}
      />
    </div>
  );
};

export default Home; 