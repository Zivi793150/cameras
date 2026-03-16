import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { trackPageView, trackCategoryView } from '../utils/analytics';
import { fetchWithCache } from '../utils/cache';
import '../styles/Catalog.css';
import Seo from '../components/Seo';

const Category = () => {
  const { category } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(24);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Функция для получения оптимального размера изображения
  const getOptimalImage = (product, preferredSize = 'medium') => {
    // Сначала проверяем обложку вариации, если товар является базовым для группы
    if (product.productGroup && product.productGroup.coverImage) {
      const coverImg = String(product.productGroup.coverImage).trim();
      if (coverImg) return coverImg;
    }
    
    // Проверяем варианты изображений
    if (product.imageVariants && product.imageVariants[preferredSize]) {
      const variantImg = String(product.imageVariants[preferredSize]).trim();
      if (variantImg) return variantImg;
    }
    if (product.imageVariants && product.imageVariants.webp) {
      const webpImg = String(product.imageVariants.webp).trim();
      if (webpImg) return webpImg;
    }
    
    // Проверяем coverPhoto
    if (product.coverPhoto) {
      const coverImg = String(product.coverPhoto).trim();
      if (coverImg) return coverImg;
    }
    
    // Проверяем основное изображение
    if (product.image) {
      const mainImg = String(product.image).trim();
      if (mainImg) return mainImg;
    }
    
    // Проверяем массив images
    if (Array.isArray(product.images) && product.images.length > 0) {
      const firstImg = product.images.find(img => img && String(img).trim() !== '');
      if (firstImg) {
        const imgUrl = String(firstImg).trim();
        if (imgUrl) return imgUrl;
      }
    }
    
    // Проверяем массив images2
    if (Array.isArray(product.images2) && product.images2.length > 0) {
      const firstImg = product.images2.find(img => img && String(img).trim() !== '');
      if (firstImg) {
        const imgUrl = String(firstImg).trim();
        if (imgUrl) return imgUrl;
      }
    }
    
    // Проверяем массив images3
    if (Array.isArray(product.images3) && product.images3.length > 0) {
      const firstImg = product.images3.find(img => img && String(img).trim() !== '');
      if (firstImg) {
        const imgUrl = String(firstImg).trim();
        if (imgUrl) return imgUrl;
      }
    }
    
    return '/images/products/placeholder.png';
  };

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
      'периферийный насос': 'peripheral-pump',
      'центробежный насос': 'centrifugal-pump',
      'аргонно-дуговая сварка': 'argon-arc-welding',
      'бензиновый триммер': 'gasoline-trimmer',
      'глубинный насос': 'deep-pump',
      'отбойный молоток': 'jackhammer',
      'плазморезы': 'plasma-cutter',
      'редукционный клапан': 'reduction-valve',
      'сварочный аппарат': 'welding',
      'сварочный аппараты': 'welding',
      'струйный насос': 'jet-pump',
      'насосы': 'nasosy',
      'насос': 'nasosy',
      'струйный самовсасывающий насос': 'jet-pump',
      'точильный станок': 'bench-grinder',
      'ударная дрель': 'impact-drill',
      'фекальный насос': 'fecal-pump',
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
    
    // Нормализуем название: убираем лишние пробелы, приводим к нижнему регистру
    const normalizedName = categoryName.toLowerCase().trim().replace(/\s+/g, ' ');
    
    // Сначала ищем точное совпадение
    if (categoryMap[normalizedName]) {
      return categoryMap[normalizedName];
    }
    
    // Спец-правило: любые варианты с "дизель" + "генератор"
    if (normalizedName.includes('дизель') && normalizedName.includes('генератор')) {
      return 'diesel-generators';
    }
    // Если точного совпадения нет, ищем по частичному совпадению (более длинные ключи приоритетнее)
    const entriesByLength = Object.entries(categoryMap).sort((a,b)=>b[0].length-a[0].length);
    for (const [key, value] of entriesByLength) {
      if (normalizedName.includes(key)) {
        return value;
      }
    }
    
    // Если ничего не найдено, создаем ID из названия
    return normalizedName.replace(/[^a-z0-9]/g, '-');
  };

  // Функция для получения названия категории по ID
  const idToCategory = (categoryId) => {
    const idMap = {
      'drills': 'Дрели',
      'bolgarki': 'Болгарки',
      'screwdrivers': 'Шуруповёрты',
      'hammers': 'Перфораторы',
      'jigsaws': 'Лобзики',
      'levels': 'Лазерные уровни',
      'generators': 'Генераторы',
      'diesel-generators': 'Дизельные генераторы',
      'argon-arc-welding': 'Аргонно-дуговая сварка',
      'gasoline-trimmer': 'Бензиновый триммер',
      'deep-pump': 'Глубинный насос',
      'jackhammer': 'Отбойный молоток',
      'plasma-cutter': 'Плазморезы',
      'reduction-valve': 'Редукционный клапан',
      'welding': 'Сварочные аппараты',
      'jet-pump': 'Струйный насос',
      'bench-grinder': 'Точильный станок',
      'impact-drill': 'Ударная дрель',
      'fecal-pump': 'Фекальный насос',
      'nasosy': 'Насосы',
      'peripheral-pump': 'Периферийный насос',
      'centrifugal-pump': 'Центробежный насос',
      'measuring': 'Измерители',
      // Новые категории
      'impact-wrench': 'Гайковерт ударный',
      'hedge-trimmers': 'Кусторезы',
      'mixers': 'Миксеры',
      'power-tool-sets': 'Наборный электроинструмент',
      'hacksaws': 'Ножовки',
      'saws': 'Пила',
      'chainsaws': 'Пила цепная',
      'polishing-machines': 'Полировальные машины',
      'bees': 'Пчёлки',
      'reciprocating-saws': 'Сабельная пила',
      'pruners': 'Секаторы',
      'routers': 'Фрезер',
      'electric-planers': 'Электрорубанок'
    };
    
    // Если есть точное совпадение в маппинге, возвращаем его
    if (idMap[categoryId]) {
      return idMap[categoryId];
    }
    
    // Если нет точного совпадения, ищем по частичному совпадению
    const foundCategory = categories.find(cat => cat.id === categoryId);
    if (foundCategory) {
      return foundCategory.name;
    }
    
    // Если ничего не найдено, возвращаем ID как есть
    return categoryId;
  };

  // Статические категории для fallback
  const staticCategories = [
    { id: 'drills', name: 'Дрели' },
    { id: 'bolgarki', name: 'Болгарки' },
    { id: 'screwdrivers', name: 'Шуруповёрты' },
    { id: 'hammers', name: 'Перфораторы' },
    { id: 'jigsaws', name: 'Лобзики' },
    { id: 'levels', name: 'Лазерные уровни' },
    { id: 'generators', name: 'Генераторы' },
    { id: 'diesel-generators', name: 'Дизельные генераторы' },
    { id: 'nasosy', name: 'Насосы' },
    { id: 'measuring', name: 'Измерители' },
    // Новые категории
    { id: 'impact-wrench', name: 'Гайковерт ударный' },
    { id: 'hedge-trimmers', name: 'Кусторезы' },
    { id: 'mixers', name: 'Миксеры' },
    { id: 'power-tool-sets', name: 'Наборный электроинструмент' },
    { id: 'hacksaws', name: 'Ножовки' },
    { id: 'saws', name: 'Пила' },
    { id: 'chainsaws', name: 'Пила цепная' },
    { id: 'polishing-machines', name: 'Полировальные машины' },
    { id: 'bees', name: 'Пчёлки' },
    { id: 'reciprocating-saws', name: 'Сабельная пила' },
    { id: 'pruners', name: 'Секаторы' },
    { id: 'routers', name: 'Фрезер' },
    { id: 'electric-planers', name: 'Электрорубанок' }
  ];

  const API_URL = '/api/products';

  // Фильтруем товары по категории (перенесено наверх)
  const filteredProducts = products.filter(product => {
    // Сначала проверяем готовый categorySlug из MongoDB
    if (product.categorySlug) {
      return product.categorySlug === category;
    }
    
    // Fallback: если categorySlug нет, используем старую логику
    if (!product.category) return false;
    const productCategoryId = categoryToId(product.category.trim());
    
    // Спец-обработка для насосов: жёстко делим периферийные/центробежные
    if (category === 'peripheral-pump') {
      const t = product.category.toLowerCase();
      return t.includes('перифер') && !t.includes('центробеж');
    }
    if (category === 'centrifugal-pump') {
      const t = product.category.toLowerCase();
      return t.includes('центробеж');
    }

    // Общая группа «насосы»: включаем все товары, где в человеко-читаемой категории встречается «насос»
    if (category === 'nasosy') {
      const t = product.category.toLowerCase();
      return t.includes('насос');
    }

    // Прямое сравнение ID категорий
    return productCategoryId === category;
  });

  // Загрузка товаров с кэшированием
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    fetchWithCache(API_URL, {}, 10 * 60 * 1000) // Кэш на 10 минут
      .then(data => {
        // Фильтруем товары - показываем только доступные для продажи
        const saleProducts = data.filter(p => p.saleAvailable !== false);
        setProducts(saleProducts);
        setLoading(false);
      })
      .catch(err => {
        setError('Ошибка загрузки товаров');
        setLoading(false);
      });
  }, []);

  // Отслеживаем просмотр страницы категории
  useEffect(() => {
    trackPageView(`category_${category}`);
  }, [category]);
  
  // Отслеживаем просмотр категории с количеством товаров (отдельный useEffect)
  useEffect(() => {
    if (filteredProducts.length > 0 && categories.length > 0) {
      const categoryName = categories.find(cat => cat.id === category)?.name || idToCategory(category);
      trackCategoryView(categoryName, category, filteredProducts.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, filteredProducts.length, categories]);

  // Извлечение категорий из товаров
  useEffect(() => {
    if (products.length > 0) {
      setCategoriesLoading(true);
      
      // Извлекаем уникальные категории из товаров, используя готовые categorySlug
      const categoryMap = new Map();
      
      products.forEach(product => {
        if (product.categorySlug && product.category) {
          // Используем готовый categorySlug как ID и оригинальное название категории
          const categorySlug = product.categorySlug.trim();
          const originalCategory = product.category.trim();
          
          // Если такой categorySlug еще нет, добавляем её
          if (!categoryMap.has(categorySlug)) {
            categoryMap.set(categorySlug, originalCategory);
          }
        }
      });
      
      const uniqueCategories = Array.from(categoryMap.entries()).map(([slug, name]) => ({
        id: slug,
        name: name
      })).sort((a, b) => a.name.localeCompare(b.name, 'ru'));
      
      if (uniqueCategories.length > 0) {
        setCategories(uniqueCategories);
      } else {
        // Fallback: если нет categorySlug, используем старую логику
        const categoryMapOld = new Map();
        
        products.forEach(product => {
          if (product.category) {
            const normalizedCategory = product.category.trim().toLowerCase().replace(/\s+/g, ' ');
            const originalCategory = product.category.trim();
            
            if (!categoryMapOld.has(normalizedCategory)) {
              categoryMapOld.set(normalizedCategory, originalCategory);
            }
          }
        });
        
        const uniqueCategoriesOld = Array.from(categoryMapOld.values()).sort();
        
        if (uniqueCategoriesOld.length > 0) {
          const realCategories = uniqueCategoriesOld.map(category => ({
            id: categoryToId(category),
            name: category
          }));
          setCategories(realCategories);
        } else {
          setCategories(staticCategories);
        }
      }
      setCategoriesLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  // Принудительное применение стилей для карточек
  useEffect(() => {
    const forceStyles = () => {
      const grid = document.querySelector('.catalog-products-grid');
      const cards = document.querySelectorAll('.product-card');
      const images = document.querySelectorAll('.product-image');
      const infos = document.querySelectorAll('.product-info');
      
      if (grid) {
        grid.style.display = 'grid';
        grid.style.gap = '0';
        grid.style.margin = '0';
        grid.style.padding = '0';
        grid.style.borderCollapse = 'collapse';
        grid.style.borderSpacing = '0';
      }
      
      cards.forEach(card => {
        card.style.margin = '-1px';
        card.style.border = '1px solid #e3e6ea';
        card.style.borderRadius = '0';
        card.style.padding = '0';
        card.style.background = '#fff';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.height = '100%';
        card.style.position = 'relative';
        card.style.overflow = 'hidden';
        card.style.boxSizing = 'border-box';
        card.style.minHeight = 'auto';
      });
      
      images.forEach(img => {
        img.style.height = '160px';
        img.style.padding = '0';
        img.style.margin = '0';
      });
      
      infos.forEach(info => {
        info.style.padding = '6px';
        info.style.minHeight = '80px';
      });
    };

    // Применяем стили сразу и после загрузки
    forceStyles();
    setTimeout(forceStyles, 50);
    setTimeout(forceStyles, 100);
    setTimeout(forceStyles, 200);
    setTimeout(forceStyles, 500);
    setTimeout(forceStyles, 1000);

    // Применяем стили при изменении размера окна
    const handleResize = () => {
      setTimeout(forceStyles, 100);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [products]);


  // Пагинация
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  // Сброс на первую страницу при смене категории
  useEffect(() => {
    setCurrentPage(1);
  }, [category]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Функция для получения названия товара с приоритетом: productGroup -> category -> product name
  const getProductDisplayName = (product) => {
    // 1. Проверяем мастер-товар (productGroup)
    if (product.productGroup && product.productGroup.name) {
      return product.productGroup.name;
    }
    
    // 2. Проверяем название категории
    if (product.category) {
      return product.category;
    }
    
    // 3. Используем название продукта
    return product.name;
  };

  // Получаем название категории для отображения
  const getCategoryDisplayName = () => {
    // Сначала ищем в списке категорий из товаров
    const foundCategory = categories.find(cat => cat.id === category);
    if (foundCategory) {
      return foundCategory.name;
    }
    
    // Fallback: используем старую логику
    return idToCategory(category);
  };

  return (
    <div className="catalog">
      <Seo
        title={`${getCategoryDisplayName()} — каталог | Eltok.kz`}
        description={`Категория: ${getCategoryDisplayName()}. Электроинструменты и оборудование ТАНКЕР. Доставка по Казахстану, бесплатная доставка по Алматы.`}
        canonical={`https://eltok.kz/catalog/${category}`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://eltok.kz/' },
            { '@type': 'ListItem', position: 2, name: 'Каталог', item: 'https://eltok.kz/catalog' },
            { '@type': 'ListItem', position: 3, name: getCategoryDisplayName(), item: `https://eltok.kz/catalog/${category}` }
          ]
        }}
      />
      <Header />
      <main className="catalog-main">
        <div className="container catalog-layout no-sidebar">
          <div className="catalog-content center">
            {/* Хлебные крошки как на странице продукта */}
            <nav className="breadcrumbs" style={{paddingBottom: '12px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px'}}>
              <a href="/">Главная</a>
              <span style={{margin: '0 8px', color: '#bdbdbd', fontSize: '18px'}}>&rarr;</span>
              <a href="/catalog">Каталог</a>
              <span style={{margin: '0 8px', color: '#bdbdbd', fontSize: '18px'}}>&rarr;</span>
              <span style={{color:'#1a2236', fontWeight:500}}>{getCategoryDisplayName()}</span>
            </nav>
            <h1 className="catalog-title" style={{textAlign: 'left', marginLeft: 0}}>
              {categoriesLoading 
                ? 'Каталог товаров' 
                : getCategoryDisplayName()
              }
            </h1>
            {loading ? (
              <div style={{padding: 32}}>Загрузка...</div>
            ) : error ? (
              <div style={{color: 'red', padding: 32}}>{error}</div>
            ) : filteredProducts.length === 0 ? (
              <div style={{padding: 32, textAlign: 'center', color: '#666'}}>
                <h2>Товары не найдены</h2>
                <p>В данной категории пока нет товаров.</p>
                <Link to="/catalog" style={{ color: '#007bff', textDecoration: 'none' }}>
                  ← Вернуться в каталог
                </Link>
          </div>
            ) : (
              <div className="catalog-products-grid" style={{gap: 0}}>
                {currentProducts.map(product => (
                  <Link
                    to={product.slug ? `/catalog/${category}/${product.slug}` : `/product/${product._id}`}
                    key={product._id}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div
                      className="product-card kaspi-style mini-product-card"
                      style={{ cursor: 'pointer', minHeight: 'auto', position: 'relative', fontFamily: 'Roboto, Arial, sans-serif', fontWeight: 400, background: '#fff', border: '1px solid #e3e6ea', margin: '-1px' }}
                    >
                      <div className="product-image" style={{height: '160px', padding: 0, margin: 0, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <picture style={{width: '100%', height: '100%'}}>
                          <source 
                            srcSet={getOptimalImage(product, 'webp')} 
                            type="image/webp"
                          />
                          <img 
                            src={getOptimalImage(product, 'medium')} 
                            alt={product.name} 
                            style={{width: '100%', height: '100%', objectFit: 'contain', display: 'block', background:'#fff'}} 
                            loading="lazy"
                            width="260"
                            height="160"
                          />
                        </picture>
          </div>
                      <div style={{width:'90%',maxWidth:'260px',borderTop:'1px solid #bdbdbd',margin:'0 auto 2px auto', alignSelf:'center'}}></div>
                      <div className="product-info" style={{padding: '0 8px 6px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, minHeight: 'auto'}}>
                        <span style={{fontSize: '1rem', fontWeight: 700, color: '#1a2236', margin: 0, lineHeight: 1.2, textDecoration:'none',cursor:'pointer',display:'block', textAlign:'center', width:'100%'}}>
                          {getProductDisplayName(product)}
                        </span>
                      </div>
                </div>
                  </Link>
              ))}
            </div>
            )}
            
            {/* Пагинация */}
            {totalPages > 1 && (
              <div className="pagination-container" style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: '40px',
                marginBottom: '20px',
                gap: '8px'
              }}>
                {/* Кнопка "Предыдущая" */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #e3e6ea',
                    background: currentPage === 1 ? '#f5f5f5' : '#fff',
                    color: currentPage === 1 ? '#999' : '#333',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  ← Назад
                </button>
                
                {/* Номера страниц */}
                {Array.from({ length: totalPages }, (_, index) => index + 1).map(pageNumber => {
                  // Показываем только первые 5 страниц, последние 5 и текущую с соседними
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #e3e6ea',
                          background: currentPage === pageNumber ? '#e86c0a' : '#fff',
                          color: currentPage === pageNumber ? '#fff' : '#333',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          fontSize: '14px',
                          fontWeight: '500',
                          minWidth: '40px'
                        }}
                      >
                        {pageNumber}
                      </button>
                    );
                  } else if (
                    pageNumber === currentPage - 2 ||
                    pageNumber === currentPage + 2
                  ) {
                    return (
                      <span
                        key={pageNumber}
                        style={{
                          padding: '8px 4px',
                          color: '#999',
                          fontSize: '14px'
                        }}
                      >
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
                
                {/* Кнопка "Следующая" */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #e3e6ea',
                    background: currentPage === totalPages ? '#f5f5f5' : '#fff',
                    color: currentPage === totalPages ? '#999' : '#333',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Вперед →
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Category; 