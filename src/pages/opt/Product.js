import React, { useState, useEffect } from 'react';
import { formatTenge } from '../../utils/price';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Modal from '../../components/Modal';
import { trackProductView, trackButtonClick, trackPurchaseStart } from '../../utils/analytics';
import { fetchWithCache } from '../../utils/cache';
import '../../styles/Product.css';
import '../../styles/ProductVariations.css';
import '../../components/ImageModal.css';

// Надёжный fetch с повторами и таймаутом
const fetchWithRetry = async (url, options = {}, retries = 2, backoffMs = 800, timeoutMs = 12000) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        ...options,
        headers: { 'Accept': 'application/json', ...(options.headers || {}) },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (attempt === retries) throw error;
      await new Promise(r => setTimeout(r, backoffMs * Math.pow(2, attempt)));
    }
  }
};

const categories = [
  { id: 'bolgarki', name: 'Болгарки' },
  { id: 'screwdrivers', name: 'Шуруповёрты' },
  { id: 'hammers', name: 'Перфораторы' },
  { id: 'drills', name: 'Дрели' },
  { id: 'jigsaws', name: 'Лобзики' },
  { id: 'levels', name: 'Лазерные уровни' },
  { id: 'generators', name: 'Генераторы' },
  { id: 'measuring', name: 'Измерители' }
];

const OptProduct = () => {
  const { id, slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [miniProducts, setMiniProducts] = useState([]);
  const [siteSettings, setSiteSettings] = useState({
    city: 'Алматы',
    productPageText: '',
    deliveryInfo: {
      freeDelivery: 'Бесплатная доставка по городу',
      freeDeliveryNote: 'Сегодня — БЕСПЛАТНО',
      pickupAddress: 'Бокейханова 510, Склад',
      pickupInfo: 'Сегодня с 9:00 до 18:00 — больше 5',
      deliveryNote: 'Срок доставки рассчитывается менеджером после оформления заказа'
    }
  });
  
  // Состояние для вариаций товара
  const [productGroup, setProductGroup] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedParameters, setSelectedParameters] = useState({});
  
  // Список городов Казахстана
  const cities = [
    'Алматы',
    'Астана',
    'Шымкент',
    'Актобе',
    'Караганда',
    'Тараз',
    'Павлодар',
    'Семей',
    'Усть-Каменогорск',
    'Уральск',
    'Кызылорда',
    'Костанай',
    'Петропавловск',
    'Атырау',
    'Актау',
    'Темиртау',
    'Туркестан',
    'Кокшетау',
    'Талдыкорган',
    'Экибастуз',
    'Рудный',
    'Жанаозен',
    'Жезказган',
    'Балхаш',
    'Кентау',
    'Сатпаев',
    'Капчагай',
    'Риддер',
    'Степногорск',
    'Аральск',
    'Аркалык',
    'Житикара',
    'Кандыагаш',
    'Лисаковск',
    'Шахтинск',
    'Абай',
    'Аягоз',
    'Зайсан',
    'Курчатов',
    'Приозерск',
    'Серебрянск',
    'Текели',
    'Уштобе',
    'Чарск',
    'Шемонаиха',
    'Щучинск'
  ];
  
  // Объединяем все изображения из разных полей
  const getAllImages = () => {
    const currentProduct = getCurrentProduct();
    const images = [];
    
    // Добавляем основное изображение из поля image (если есть и не пустое)
    if (currentProduct?.image && String(currentProduct.image).trim() !== '') {
      const imgUrl = String(currentProduct.image).trim();
      images.push(imgUrl);
    }
    
    // Добавляем изображения из поля images (фильтруем пустые)
    if (Array.isArray(currentProduct?.images)) {
      currentProduct.images
        .filter(img => img && String(img).trim() !== '')
        .forEach(img => {
          const imgUrl = String(img).trim();
          if (imgUrl && !images.includes(imgUrl)) { // Избегаем дубликатов
            images.push(imgUrl);
          }
        });
    }
    
    // Добавляем изображения из поля images2 (фильтруем пустые)
    if (Array.isArray(currentProduct?.images2)) {
      currentProduct.images2
        .filter(img => img && String(img).trim() !== '')
        .forEach(img => {
          const imgUrl = String(img).trim();
          if (imgUrl && !images.includes(imgUrl)) { // Избегаем дубликатов
            images.push(imgUrl);
          }
        });
    }
    
    // Добавляем изображения из поля images3 (фильтруем пустые)
    if (Array.isArray(currentProduct?.images3)) {
      currentProduct.images3
        .filter(img => img && String(img).trim() !== '')
        .forEach(img => {
          const imgUrl = String(img).trim();
          if (imgUrl && !images.includes(imgUrl)) { // Избегаем дубликатов
            images.push(imgUrl);
          }
        });
    }
    
    // Если нет изображений, добавляем placeholder
    if (images.length === 0) {
      images.push('/images/products/placeholder.png');
    }
    
    return images;
  };
  
  const navigate = useNavigate();

  const API_URL = '/api/products';

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    const fetchProductAndGroup = async () => {
      try {
        // Загружаем товар: по id или по slug
        let productData;
        if (id) {
          productData = await fetchWithCache(`${API_URL}/${id}`, {}, 5 * 60 * 1000);
        } else if (slug) {
          // Загружаем все товары и ищем по slug
          try {
            const allProducts = await fetchWithCache(`${API_URL}`, {}, 5 * 60 * 1000);
            productData = allProducts.find(p => p.slug === slug);
            if (!productData) {
              productData = { error: 'Товар не найден' };
            }
          } catch (error) {
            productData = { error: 'Ошибка при загрузке товара' };
          }
        }
        
        if (productData.error) {
          setError(productData.error);
          setProduct(null);
          setLoading(false);
          return;
        }
        
        setProduct(productData);
        
        // Отслеживаем просмотр товара с дополнительными данными
        trackProductView(
          productData._id, 
          productData.name, 
          productData.price,
          productData.category
        );
        
        // Загружаем группу вариаций для этого товара
        try {
         const groupRes = await fetchWithRetry(`/api/product-groups/by-product/${productData._id}`);
          if (groupRes.ok) {
            const groupData = await groupRes.json();
            setProductGroup(groupData);
            
             // Инициализация выбранной вариации
             if (groupData.baseProductId?._id === productData._id) {
               // Открыли страницу базового товара
               setSelectedVariant(null);
               setSelectedParameters({});
             } else {
               // Открыли страницу вариации — находим её и выставляем параметры
               const currentVariant = (groupData.variants || []).find(v => v.productId && (v.productId._id === id));
               if (currentVariant) {
                 setSelectedVariant(currentVariant);
                 setSelectedParameters(currentVariant.parameters || {});
               }
            }
          }
        } catch (groupError) {
          console.log('Группа вариаций не найдена для товара:', groupError);
        }
        
        setLoading(false);
      } catch (error) {
        setError('Ошибка загрузки товара');
        setLoading(false);
      }
    };
    
    fetchProductAndGroup();
  }, [id, slug]);

  useEffect(() => {
    fetchWithCache(`${API_URL}?limit=4`, {}, 5 * 60 * 1000) // Кэш на 5 минут
      .then(data => {
        if (Array.isArray(data)) setMiniProducts(data);
      });
  }, []);

  // Загружаем информацию сайта
  useEffect(() => {
   fetchWithRetry('/api/information')
      .then(res => res.json())
      .then(data => {
        if (data.information) {
          setSiteSettings(data.information);
        }
      })
      .catch(error => {
        console.log('Ошибка загрузки информации, используются значения по умолчанию:', error);
      });
  }, []);
  
  // Сбрасываем активное изображение при смене товара
  useEffect(() => {
    setActiveImage(0);
  }, [selectedVariant]);

  if (loading) {
    return <div style={{padding: 48, textAlign: 'center'}}>Загрузка...</div>;
  }
  if (error || !product) {
    return (
      <div className="product">
        <Header />
        <main className="product-main">
          <div className="container" style={{padding: '48px 0', textAlign: 'center'}}>
            <h1>Товар не найден</h1>
            <p>Проверьте правильность ссылки или вернитесь в <a href="/opt/catalog">каталог</a>.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Найти категорию для хлебных крошек
  const categoryObj = categories.find(cat => cat.id === product.category);
  const categoryName = categoryObj ? categoryObj.name : '';

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const handleSubmitForm = (formData) => {
    console.log('Заявка на товар:', { ...formData, product: getCurrentProduct().name });
  };

  const handleBuy = () => {
    const currentProduct = getCurrentProduct();
    const currentPrice = getCurrentPrice();
    
    // Отслеживаем начало покупки
    trackPurchaseStart(
      currentProduct._id, 
      currentProduct.name, 
      currentPrice, 
      'opt_product_page'
    );
    
    navigate('/opt/checkout', { 
      state: { 
        product: currentProduct,
        selectedVariant,
        selectedParameters,
        originalPrice: product.price,
        currentPrice
      } 
    });
  };

  // Функции для работы с вариациями
  const normalize = (val) => {
    if (val === undefined || val === null) return '';
    return String(val).trim();
  };

  const handleParameterChange = (paramName, value) => {
    const newParameters = { ...selectedParameters, [paramName]: value };
    setSelectedParameters(newParameters);
    
    // Находим подходящую вариацию
    if (productGroup) {
      // Удаляем параметр из поиска, если значение пустое или false
      const filteredParameters = {};
      Object.entries(newParameters).forEach(([key, val]) => {
        if (val && val !== 'false') {
          filteredParameters[key] = val;
        }
      });
      
      // Если нет выбранных параметров, сбрасываем на базовый товар
      if (Object.keys(filteredParameters).length === 0) {
        setSelectedVariant(null);
        return;
      }
      
      // Ищем вариацию с точным совпадением всех параметров
      let matchingVariant = productGroup.variants.find(variant => {
        if (!variant.isActive) return false;
        
        // Проверяем, что все выбранные параметры совпадают
        return Object.entries(filteredParameters).every(([key, val]) => {
          return normalize(variant.parameters[key]) === normalize(val);
        });
      });
      
      if (matchingVariant) {
        setSelectedVariant(matchingVariant);
      } else {
        // Нет точной комбинации — не подставляем другой товар
        setSelectedVariant(null);
      }
    }
  };

  // Получаем текущий товар для отображения (с учетом выбранной вариации)
  const getCurrentProduct = () => {
    if (selectedVariant && selectedVariant.productId) {
      // Убеждаемся, что у нас есть полная информация о товаре
      return selectedVariant.productId;
    }
    return product;
  };

  // Получаем текущую цену
  const getCurrentPrice = () => {
    if (selectedVariant && selectedVariant.productId) {
      return selectedVariant.productId.price;
    }
    return product?.price;
  };

  // Проверяем, есть ли вариации с определенным параметром
  const hasVariationsWithParameter = (paramName) => {
    if (!productGroup) return false;
    return productGroup.variants.some(variant => 
      variant.isActive && variant.parameters[paramName]
    );
  };

  // Получаем доступные значения для параметра
  const getAvailableValuesForParameter = (paramName) => {
    if (!productGroup) return [];
    // Учитываем другие выбранные параметры, чтобы не предлагать невозможные комбинации
    const otherParams = { ...selectedParameters };
    delete otherParams[paramName];
    const values = new Set();
    productGroup.variants.forEach(variant => {
      if (!variant.isActive) return;
      // Совпадает ли вариант по всем другим выбранным параметрам?
      const matchesOthers = Object.entries(otherParams).every(([k, v]) => {
        if (!v || v === 'false') return true;
        return normalize(variant.parameters[k]) === normalize(v);
      });
      if (!matchesOthers) return;
      const val = variant.parameters[paramName];
      if (val) values.add(val);
    });
    return Array.from(values);
  };

  // Все возможные значения параметра (без учёта выбранных других параметров)
  const getAllValuesForParameter = (param) => {
    if (Array.isArray(param.values) && param.values.length > 0) return param.values;
    if (!productGroup) return [];
    const values = new Set();
    productGroup.variants.forEach(variant => {
      const val = variant.parameters[param.name];
      if (val) values.add(val);
    });
    return Array.from(values);
  };

  // Модалка фото
  const handleImageClick = () => setShowImageModal(true);
  const handleCloseImageModal = () => setShowImageModal(false);
   const handlePrevImage = (e) => {
     e.stopPropagation();
     const images = getAllImages();
     setActiveImage((prev) => {
       const newIndex = (prev - 1 + images.length) % images.length;
       return newIndex >= 0 && newIndex < images.length ? newIndex : 0;
     });
   };
  const handleNextImage = (e) => {
    e.stopPropagation();
    const images = getAllImages();
    setActiveImage((prev) => {
      const newIndex = (prev + 1) % images.length;
      return newIndex >= 0 && newIndex < images.length ? newIndex : 0;
    });
  };

  const shortDesc = getCurrentProduct()['Short description'] || 'краткое описание';

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

  return (
    <div className="product-page">
      <Header />
      <main className="product-main">
        <div className="product-container">
          <nav className="breadcrumbs" style={{paddingBottom: '18px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px'}}>
            <a href="/opt">Оптовикам</a>
            <span style={{margin: '0 8px', color: '#bdbdbd', fontSize: '18px'}}>&rarr;</span>
            <a href="/opt/catalog">Каталог</a>
            {categoryName && (
              <>
                <span style={{margin: '0 8px', color: '#bdbdbd', fontSize: '18px'}}>&rarr;</span>
                <a href={`/opt/catalog?category=${product.category}`}>{categoryName}</a>
              </>
            )}
            <span style={{margin: '0 8px', color: '#bdbdbd', fontSize: '18px'}}>&rarr;</span>
            <span style={{color:'#1a2236', fontWeight:500}}>{product.name}</span>
          </nav>
          <div className="product-flex">
            {/* Фото и миниатюры */}
            <div className="product-gallery">
              <div className="product-gallery-inner">
                <div className="product-image-main" onClick={handleImageClick} style={{cursor:'zoom-in'}}>
                  <img 
                    src={getAllImages()[activeImage]} 
                    alt={product.name} 
                    loading="lazy"
                    style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'}}
                    onError={(e) => { e.currentTarget.src = '/images/products/placeholder.png'; }}
                  />
                </div>
                {getAllImages().length > 1 && (
                  <>
                    <div className="product-thumbs">
                      {getAllImages().map((img, idx) => (
                        <img 
                          key={idx} 
                          src={img} 
                          alt={product.name + idx} 
                          className={activeImage === idx ? "active" : ""} 
                          onClick={() => setActiveImage(idx)} 
                          loading="lazy"
                          width="80"
                          height="80"
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            {/* Инфо и цена справа */}
            <div className="product-info-block">
              <>
                <h1 className="product-title" style={{fontWeight: 700, fontSize: '1.4rem', maxWidth: 320, marginBottom: 4, wordBreak: 'break-word', marginTop: 0, lineHeight: 1.2}}>{getCurrentProduct().name}</h1>
                <div className="product-short-desc" style={{fontSize: '1rem', color: '#222', marginBottom: 6, fontWeight: 500, marginTop: 0, lineHeight: 1.3}}>{shortDesc}</div>
                <div className="product-subtitle" style={{width: '100%', maxWidth: 'none'}}>{getCurrentProduct().subtitle}</div>
                <div className="product-divider"></div>
                {/* Компонент выбора вариаций */}
                {productGroup && productGroup.parameters.length > 0 && (
                  <div className="product-variations" style={{
                    marginTop: '4px',
                    marginBottom: '4px'
                  }}>
                    {productGroup.parameters
                      .filter(param => {
                        const visibleByDefault = param.visibleByDefault !== false;
                        if (visibleByDefault) return true;

                        const allowed = new Set((Array.isArray(param.visibleForProductIds) ? param.visibleForProductIds : []).map(String));
                        if (allowed.size === 0) return false;

                        const currentId = getCurrentProduct()?._id ? String(getCurrentProduct()._id) : '';
                        if (currentId && allowed.has(currentId)) return true;

                        // If a variant from the allowed list is still possible given the selected parameters (excluding this param), show it
                        const otherParams = { ...selectedParameters };
                        delete otherParams[param.name];
                        // Если другие параметры ещё не выбраны, изначально скрываем
                        const hasAnyOther = Object.values(otherParams).some(v => v && v !== 'false' && String(v).trim() !== '');
                        if (!hasAnyOther) return false;
                        const matchesOtherParams = (variant) => {
                          return Object.entries(otherParams).every(([k, v]) => {
                            if (!v || v === 'false') return true;
                            return normalize(variant.parameters[k]) === normalize(v);
                          });
                        };
                        const hasCandidate = (productGroup.variants || []).some(v => {
                          if (!v.isActive || !v.productId) return false;
                          const vid = typeof v.productId === 'string' ? v.productId : (v.productId._id || v.productId);
                          if (!vid) return false;
                          if (!allowed.has(String(vid))) return false;
                          return matchesOtherParams(v);
                        });
                        return hasCandidate;
                      })
                      .map((param, index) => {
                      // Для чекбоксов проверяем, есть ли вариации с этим параметром
                      if (param.type === 'checkbox' && !hasVariationsWithParameter(param.name)) {
                        return null; // Не показываем чекбокс, если нет вариаций с этим параметром
                      }
                      
                      // Для select и radio показываем все возможные значения, но недоступные отключаем
                      const allValues = param.type === 'select' || param.type === 'radio'
                        ? getAllValuesForParameter(param)
                        : param.values;
                      const availableValues = param.type === 'select' || param.type === 'radio' 
                        ? getAvailableValuesForParameter(param.name)
                        : param.values;
                      
                      return (
                        <div key={index} style={{ marginBottom: '2px' }}>
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '4px', 
                            fontWeight: '500',
                            color: '#333'
                          }}>
                            {param.name}
                            {param.required && <span style={{ color: '#e74c3c' }}> *</span>}
                          </label>
                          
                          {param.type === 'select' && (
                            <select
                              value={selectedParameters[param.name] || ''}
                              onChange={(e) => handleParameterChange(param.name, e.target.value)}
                              required={param.required}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '14px',
                                background: 'transparent'
                              }}
                            >
                              <option value="">Выберите {param.name.toLowerCase()}</option>
                              {allValues.map((value, valueIndex) => (
                                <option key={valueIndex} value={value} disabled={!availableValues.includes(value)}>
                                  {value}
                                </option>
                              ))}
                            </select>
                          )}
                          
                          {param.type === 'radio' && (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {allValues.map((value, valueIndex) => (
                                <label key={valueIndex} style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  cursor: 'pointer',
                                  fontSize: '14px'
                                }}>
                                  <input
                                    type="radio"
                                    name={param.name}
                                    value={value}
                                    checked={selectedParameters[param.name] === value}
                                    onChange={(e) => handleParameterChange(param.name, e.target.value)}
                                    required={param.required}
                                    style={{ marginRight: '6px' }}
                                    disabled={!availableValues.includes(value)}
                                  />
                                  {value}
                                </label>
                              ))}
                            </div>
                          )}
                          
                          {param.type === 'checkbox' && (
                            <label style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              cursor: 'pointer',
                              fontSize: '14px'
                            }}>
                              <input
                                type="checkbox"
                                checked={selectedParameters[param.name] === 'true'}
                                onChange={(e) => handleParameterChange(param.name, e.target.checked ? 'true' : 'false')}
                                style={{ marginRight: '6px' }}
                              />
                              {param.name}
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {productGroup && productGroup.parameters.length > 0 && (
                  <div className="product-divider"></div>
                )}

                <div className="product-buy-row">
                  <div className="product-price-block">
                    <div className="product-price-label-value">
                      <div className="product-price-label">Оптовая цена</div>
                      <div className="product-price-value">
                        {formatTenge(getCurrentPrice())}
                        <span className="product-currency">₸</span>
                      </div>
                    </div>

                    {getCurrentProduct().article && (
                      <div style={{
                        fontSize: '0.85rem', 
                        color: '#666', 
                        marginTop: 6, 
                        textAlign: 'left',
                        wordBreak: 'break-word',
                        width: '140px',
                        minWidth: '140px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start'
                      }}>
                        <span style={{fontWeight: 500, color: '#495057'}}>Артикул</span>
                        <span style={{marginTop: 2}}>{getCurrentProduct().article}</span>
                      </div>
                    )}
                  </div>
                  <span className="product-price-divider"></span>
                  <div className="product-buy-btns">
                    <button 
                      className="product-btn-ask" 
                      onClick={() => {
                        trackButtonClick('Задать вопрос', 'opt_product_page', id);
                        handleOpenModal();
                      }}
                      data-analytics-context="opt_product_page"
                    >
                      Запросить прайс
                    </button>
                    <div className="product-btns-divider"></div>
                    <button 
                      className="product-btn-buy" 
                      onClick={handleBuy}
                      data-analytics-context="opt_product_page"
                    >
                      Заказать
                    </button>
                  </div>
                </div>
                <div className="product-divider"></div>
                 {siteSettings.productPageText && (
                   <div className="product-page-text" style={{
                     fontSize: '1rem',
                     color: '#222',
                     marginBottom: 6,
                     fontWeight: 500,
                     marginTop: 12,
                     lineHeight: 1.3,
                     wordWrap: 'break-word',
                     wordBreak: 'break-word',
                     overflowWrap: 'break-word',
                     whiteSpace: 'pre-wrap',
                     maxWidth: '100%',
                     width: '100%'
                   }}>
                     {siteSettings.productPageText}
                   </div>
                 )}
                {/* Блок доставки скрыт по требованию */}
              </>
            </div>
          </div>
          {/* Вкладки снизу */}
          <div className="product-tabs-wrap">
            <Tabs product={getCurrentProduct()} />
          </div>
        </div>
      </main>
      {/* Мини-каталог популярных товаров */}
      <section className="mini-catalog-section">
        <div className="mini-catalog-header">
          <h2>Популярные товары</h2>
        </div>
        <div className="mini-catalog-slider-wrapper">
          <div className="mini-catalog-slider">
            {/* Первый набор карточек */}
            {miniProducts.map(product => (
              <div
                key={`first-${product._id}`}
                className="product-card catalog-mini-product-card"
                onClick={() => window.location.href = `/opt/product/${product._id}`}
                style={{ cursor: 'pointer', minHeight: 0, position: 'relative', fontFamily: 'Roboto, Arial, sans-serif', fontWeight: 400, background: '#fff', minWidth: 200, maxWidth: 220, margin: '0 4px', border: '1px solid #e3e6ea', borderRadius: 0 }}
              >
                <div className="product-image" style={{height: '120px', padding: 0, margin: 0, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <picture style={{width: '100%', height: '100%'}}>
                    <source 
                      srcSet={getOptimalImage(product, 'thumb')} 
                      type="image/webp"
                    />
                    <img 
                      src={getOptimalImage(product, 'thumb')} 
                      alt={product.name} 
                      style={{width: '100%', height: '100%', objectFit: 'contain', display: 'block', background:'#fff'}} 
                      loading="lazy"
                      width="200"
                      height="120"
                    />
                  </picture>
                </div>
                <div className="catalog-mini-product-divider" style={{width:'90%',maxWidth:'200px',borderTop:'1px solid #bdbdbd',margin:'0 auto', alignSelf:'center'}}></div>
                <div className="product-info" style={{padding: '0 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0}}>
                  <span style={{fontSize: '0.9rem', fontWeight: 500, color: '#1a2236', margin: '0 0 2px 0', lineHeight: 1.15, textDecoration:'none',cursor:'pointer',display:'block', textAlign:'center', width:'100%'}}>{product.name}</span>
                  </div>
                  </div>
            ))}
            {/* Дублированный набор карточек для бесконечной прокрутки */}
            {miniProducts.map(product => (
              <div
                key={`second-${product._id}`}
                className="product-card catalog-mini-product-card"
                onClick={() => window.location.href = `/opt/product/${product._id}`}
                style={{ cursor: 'pointer', minHeight: 0, position: 'relative', fontFamily: 'Roboto, Arial, sans-serif', fontWeight: 400, background: '#fff', minWidth: 200, maxWidth: 220, margin: '0 4px', border: '1px solid #e3e6ea', borderRadius: 0 }}
              >
                <div className="product-image" style={{height: '120px', padding: 0, margin: 0, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <picture style={{width: '100%', height: '100%'}}>
                    <source 
                      srcSet={getOptimalImage(product, 'thumb')} 
                      type="image/webp"
                    />
                    <img 
                      src={getOptimalImage(product, 'thumb')} 
                      alt={product.name} 
                      style={{width: '100%', height: '100%', objectFit: 'contain', display: 'block', background:'#fff'}} 
                      loading="lazy"
                      width="200"
                      height="120"
                    />
                  </picture>
                </div>
                <div className="catalog-mini-product-divider" style={{width:'90%',maxWidth:'200px',borderTop:'1px solid #bdbdbd',margin:'0 auto', alignSelf:'center'}}></div>
                <div className="product-info" style={{padding: '0 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0}}>
                  <span style={{fontSize: '0.9rem', fontWeight: 500, color: '#1a2236', margin: '0 0 2px 0', lineHeight: 1.15, textDecoration:'none',cursor:'pointer',display:'block', textAlign:'center', width:'100%'}}>{product.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} onSubmit={handleSubmitForm} product={getCurrentProduct().name} />
      {/* Модальное окно для увеличенного фото */}
      {showImageModal && (
        <div className="image-modal-overlay" onClick={handleCloseImageModal}>
          <div className="image-modal-content" onClick={e=>e.stopPropagation()}>
            <img 
              src={getAllImages()[activeImage]} 
              alt={getCurrentProduct().name} 
              className="image-modal-img"
              style={{objectFit:'contain'}}
            />
            {getAllImages().length > 1 && (
              <>
                <button 
                  onClick={handlePrevImage} 
                  className="image-modal-arrow left"
                >
                  ‹
                </button>
                <button 
                  onClick={handleNextImage} 
                  className="image-modal-arrow right"
                >
                  ›
                </button>
                <div style={{position:'absolute',bottom:'20px',left:'50%',transform:'translateX(-50%)',color:'#666',fontSize:'14px',background:'rgba(255,255,255,0.9)',padding:'4px 12px',borderRadius:'16px'}}>
                  {activeImage + 1} из {getAllImages().length}
                </div>
              </>
            )}
            <button onClick={handleCloseImageModal} className="image-modal-close">&times;</button>
          </div>
        </div>
      )}
    </div>
  );
};

function Tabs({product}) {
  const [tab,setTab]=React.useState('desc');
  
  // Функция для парсинга характеристик из строки
  const parseCharacteristics = (characteristicsStr) => {
    if (!characteristicsStr) return [];
    
    try {
      // Пытаемся распарсить как JSON
      return JSON.parse(characteristicsStr);
    } catch {
      // Если не JSON, разбиваем по строкам
      return characteristicsStr.split('\n').filter(line => line.trim()).map(line => {
        const [name, value] = line.split(':').map(s => s.trim());
        return { name, value };
      });
    }
  };
  
  // Функция для парсинга комплектации из строки
  const parseEquipment = (equipmentStr) => {
    if (!equipmentStr) return [];
    
    try {
      // Пытаемся распарсить как JSON
      return JSON.parse(equipmentStr);
    } catch {
      // Если не JSON, разбиваем по строкам или запятым
      return equipmentStr.split(/[\n,]/).filter(item => item.trim()).map(item => item.trim());
    }
  };
  
  const characteristics = parseCharacteristics(product.characteristics);
  const equipment = parseEquipment(product.equipment);
  return (
    <div className="product-tabs">
      <div className="product-tabs-header">
        <button className={tab==='desc'?'active':''} onClick={()=>setTab('desc')}>Описание</button>
        <button className={tab==='specs'?'active':''} onClick={()=>setTab('specs')}>Характеристики</button>
        <button className={tab==='equip'?'active':''} onClick={()=>setTab('equip')}>Комплектация</button>
        <button className={tab==='warranty'?'active':''} onClick={()=>setTab('warranty')}>Гарантия</button>
      </div>
      <div className="product-tabs-content">
        {tab==='desc' && (
          <div className="product-desc-kaspi-block">
            {product.description ? (
              <div dangerouslySetInnerHTML={{ __html: product.description.replace(/\n/g, '<br/>') }} />
            ) : (
              <div style={{color: '#888', fontStyle: 'italic'}}>Описание товара отсутствует</div>
            )}
          </div>
        )}
        {tab==='specs' && (
          <div className="product-specs-kaspi-block">
            <h2 className="product-specs-title">Характеристики {product.name}</h2>
            {characteristics.length > 0 ? (
              <div className="product-specs-group">
                <div className="product-specs-flex-table">
                  {characteristics.map((spec, i) => (
                    <div className={"product-specs-flex-row" + (!spec.value ? " no-value" : "")} key={i}>
                      <span className="product-specs-flex-name">{spec.name}</span>
                      <span className="product-specs-flex-dots"></span>
                      {spec.value && <span className="product-specs-flex-value">{spec.value}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{color: '#888', fontStyle: 'italic', padding: '20px 0'}}>Характеристики товара отсутствуют</div>
            )}
          </div>
        )}
        {tab==='equip' && (
          <div className="product-desc-kaspi-block">
            {equipment.length > 0 ? (
              <ul style={{margin: 0, paddingLeft: 20}}>
                {equipment.map((item, idx) => (
                  <li key={idx} style={{marginBottom: 8, lineHeight: 1.5}}>{item}</li>
                ))}
              </ul>
            ) : (
              <div style={{color: '#888', fontStyle: 'italic'}}>Информация о комплектации отсутствует</div>
            )}
          </div>
        )}
        {tab==='warranty' && (
          <div className="product-desc-kaspi-block">
            <div className="warranty-content">
              <p style={{margin: '0 0 20px 0', lineHeight: '1.6', color: '#4b5563', fontSize: '1.05rem'}}>
                Мы уверены в качестве каждого инструмента, который продаём. Поэтому предоставляем
                официальную гарантию на 12 месяцев со дня покупки без скрытых условий и мелкого шрифта.
                Если ваш электроинструмент перестал работать не по вашей вине, вы защищены: мы вернём деньги,
                отремонтируем бесплатно или заменим на новый.
              </p>
              
              <div className="warranty-divider"></div>
              
              <div style={{marginBottom: '20px'}}>
                <h4 style={{fontSize: '1rem', fontWeight: '600', margin: '0 0 12px 0', color: '#374151'}}>Что покрывает гарантия?</h4>
                <p style={{margin: '0 0 8px 0', lineHeight: '1.6', color: '#4b5563'}}>
                  Гарантия распространяется на все случаи, когда неисправность возникла по вине производителя —
                  из-за заводского брака или скрытых дефектов.
                </p>
                <p style={{margin: '0 0 8px 0', lineHeight: '1.6', color: '#4b5563'}}>
                  Она действует на протяжении всего года после покупки, включая 11-й и последний месяц. До
                  последнего дня срока вы можете рассчитывать на нашу поддержку и полное выполнение
                  обязательств.
                </p>
              </div>

              <div className="warranty-divider"></div>

              <div style={{marginBottom: '20px'}}>
                <h4 style={{fontSize: '1rem', fontWeight: '600', margin: '0 0 12px 0', color: '#374151'}}>Условия гарантийного обслуживания</h4>
                <p style={{margin: '0 0 8px 0', lineHeight: '1.6', color: '#4b5563'}}>
                  Чтобы воспользоваться гарантией, необходимо:
                </p>
                <ol style={{margin: '0 0 8px 0', paddingLeft: '20px', lineHeight: '1.6', color: '#4b5563'}}>
                  <li style={{marginBottom: '6px'}}>Сохранить товарный вид, комплектность и упаковку изделия.</li>
                  <li style={{marginBottom: '6px'}}>Убедиться в отсутствии следов неправильной эксплуатации, падений или вскрытия корпуса.</li>
                  <li style={{marginBottom: '6px'}}>Подтвердить, что неисправность возникла по причине заводского дефекта.</li>
                  <li style={{marginBottom: '6px'}}>Иметь документ, подтверждающий покупку (чек или накладную).</li>
                  <li style={{marginBottom: '6px'}}>Обратиться в течение 12 месяцев с момента покупки.</li>
                </ol>
              </div>

              <div className="warranty-divider"></div>

              <div style={{marginBottom: '20px'}}>
                <h4 style={{fontSize: '1rem', fontWeight: '600', margin: '0 0 12px 0', color: '#374151'}}>Порядок обращения по гарантии</h4>
                <ol style={{margin: '0 0 8px 0', paddingLeft: '20px', lineHeight: '1.6', color: '#4b5563'}}>
                  <li style={{marginBottom: '6px'}}>Сообщите о неисправности любым удобным способом.</li>
                  <li style={{marginBottom: '6px'}}>Мы проведём диагностику — по фото, видео или при осмотре изделия.</li>
                  <li style={{marginBottom: '6px'}}>Если случай подтверждён как гарантийный, предоставляем одно из решений:</li>
                </ol>
                <ul style={{margin: '0 0 8px 0', paddingLeft: '40px', lineHeight: '1.6', color: '#4b5563'}}>
                  <li style={{marginBottom: '4px'}}>возврат денежных средств в полном объёме;</li>
                  <li style={{marginBottom: '4px'}}>бесплатный ремонт в сервисном отделе;</li>
                  <li style={{marginBottom: '4px'}}>замену товара на новый аналогичной модели.</li>
                </ul>
                <p style={{margin: '0 0 8px 0', lineHeight: '1.6', color: '#4b5563'}}>
                  Все процессы прозрачны и без лишней бюрократии — мы ценим ваше время и доверие.
                </p>
              </div>

              <div className="warranty-divider"></div>

              <div style={{marginBottom: '0'}}>
                <h4 style={{fontSize: '1rem', fontWeight: '600', margin: '0 0 12px 0', color: '#374151'}}>Когда гарантия не действует</h4>
                <p style={{margin: '0 0 8px 0', lineHeight: '1.6', color: '#4b5563'}}>
                  Гарантия не распространяется на:
                </p>
                <ul style={{margin: '0 0 0 0', paddingLeft: '20px', lineHeight: '1.6', color: '#4b5563'}}>
                  <li style={{marginBottom: '6px'}}>механические повреждения, удары, падения, перегрузку или попадание влаги;</li>
                  <li style={{marginBottom: '6px'}}>неисправности, возникшие из-за неправильного подключения или нарушения правил эксплуатации;</li>
                  <li style={{marginBottom: '6px'}}>случаи самостоятельного вскрытия или ремонта;</li>
                  <li style={{marginBottom: '6px'}}>естественный износ деталей и расходных материалов (щётки, кабели, патроны, аккумуляторы и т. д.).</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OptProduct;
