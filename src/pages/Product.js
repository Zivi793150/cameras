import React, { useState, useEffect, useRef } from 'react';
import { formatTenge } from '../utils/price';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Modal from '../components/Modal';
// import DeliveryInfo from '../components/DeliveryInfo';
import { trackProductView, trackButtonClick, trackPurchaseStart } from '../utils/analytics';
import { fetchWithCache } from '../utils/cache';
import Seo from '../components/Seo';
import '../styles/Product.css';
import '../styles/ProductVariations.css';
import '../components/ImageModal.css';

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

const Product = () => {
  const { id, slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageZoom, setImageZoom] = useState({ scale: 1, x: 0, y: 0 });
  const touchStateRef = useRef({
    x0: null,
    y0: null,
    xLast: null,
    yLast: null,
    hasMoved: false
  });
  const gestureRef = useRef({
    mode: null, // 'swipe' | 'pinch' | 'pan'
    pinchStartDist: 0,
    pinchStartScale: 1,
    pinchStartMid: { x: 0, y: 0 },
    pinchStartOffset: { x: 0, y: 0 },
    panStart: { x: 0, y: 0 },
    panStartOffset: { x: 0, y: 0 }
  });
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
    
    // Добавляем основное изображение из поля image (если есть)
    if (currentProduct?.image) {
      images.push(currentProduct.image);
    }
    
    // Добавляем изображения из поля images
    if (Array.isArray(currentProduct?.images)) {
      images.push(...currentProduct.images);
    }
    
    // Добавляем изображения из поля images2
    if (Array.isArray(currentProduct?.images2)) {
      images.push(...currentProduct.images2);
    }
    
    // Добавляем изображения из поля images3
    if (Array.isArray(currentProduct?.images3)) {
      images.push(...currentProduct.images3);
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
          // Загружаем товар по slug через специальный endpoint (включает вариации!)
          try {
            productData = await fetchWithCache(`${API_URL}/by-slug/${slug}`, {}, 5 * 60 * 1000);
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
          // Если товар уже пришёл с информацией о группе (из endpoint /api/products/by-slug), используем её
          if (productData.productGroup) {
            const groupData = productData.productGroup;
            setProductGroup(groupData);
            
            // Инициализация выбранной вариации
            const baseProductId = groupData.baseProductId?._id || groupData.baseProductId;
            if (baseProductId === productData._id) {
              // Открыли страницу базового товара
              setSelectedVariant(null);
              setSelectedParameters({});
            } else {
              // Открыли страницу вариации — находим её и выставляем параметры
              const currentVariant = (groupData.variants || []).find(v => {
                if (!v.productId) return false;
                const variantId = v.productId._id || v.productId;
                return variantId === productData._id;
              });
              if (currentVariant) {
                setSelectedVariant(currentVariant);
                setSelectedParameters(currentVariant.parameters || {});
              }
            }
          } else {
            // Загружаем группу отдельно если её нет в ответе
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
                const currentVariant = (groupData.variants || []).find(v => {
                  if (!v.productId) return false;
                  const variantId = v.productId._id || v.productId;
                  const variantSlug = v.productId.slug;
                  return (id && variantId === id) || (slug && variantSlug === slug);
                });
                if (currentVariant) {
                  setSelectedVariant(currentVariant);
                  setSelectedParameters(currentVariant.parameters || {});
                }
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

  const variationProducts = React.useMemo(() => {
    if (!productGroup) return [];

    const current = getCurrentProduct();
    const currentId = current?._id;

    const base = productGroup.baseProductId && typeof productGroup.baseProductId === 'object'
      ? productGroup.baseProductId
      : null;

    const variants = Array.isArray(productGroup.variants)
      ? productGroup.variants
          .map(v => (v && v.productId && typeof v.productId === 'object' ? v.productId : null))
          .filter(Boolean)
      : [];

    const all = [];
    if (base) all.push(base);
    all.push(...variants);

    const uniqById = new Map();
    all.forEach(p => {
      if (!p || !p._id) return;
      uniqById.set(String(p._id), p);
    });

    return Array.from(uniqById.values()).filter(p => String(p._id) !== String(currentId));
  }, [productGroup, selectedVariant]);

  const [randomProducts, setRandomProducts] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const loadRandom = async () => {
      try {
        if (!product) return;
        if (variationProducts.length > 0) {
          if (!cancelled) setRandomProducts([]);
          return;
        }

        const listData = await fetchWithCache(`${API_URL}?limit=0`, {}, 5 * 60 * 1000);
        const all = Array.isArray(listData) ? listData : (Array.isArray(listData?.products) ? listData.products : []);
        const currentId = String(getCurrentProduct()?._id || product?._id || '');
        const pool = all.filter(p => p && p._id && String(p._id) !== currentId);

        const currentCategory = product?.category ?? getCurrentProduct()?.category;
        const sameCategory = currentCategory
          ? pool.filter(p => p?.category === currentCategory)
          : [];

        const shuffle = (arr) => arr
          .map(p => ({ p, r: Math.random() }))
          .sort((a, b) => a.r - b.r)
          .map(x => x.p);

        const targetCount = 12;
        const minSameCategory = 5;

        const picked = [];
        const sameShuffled = shuffle(sameCategory);
        picked.push(...sameShuffled.slice(0, targetCount));

        if (picked.length < Math.min(minSameCategory, targetCount)) {
          const anyShuffled = shuffle(pool);
          const used = new Set(picked.map(p => String(p._id)));
          for (const p of anyShuffled) {
            if (picked.length >= targetCount) break;
            if (!p?._id) continue;
            const key = String(p._id);
            if (used.has(key)) continue;
            used.add(key);
            picked.push(p);
          }
        }

        if (!cancelled) setRandomProducts(picked);
      } catch {
        if (!cancelled) setRandomProducts([]);
      }
    };

    loadRandom();
    return () => {
      cancelled = true;
    };
  }, [product, selectedVariant, variationProducts.length]);

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
  
  // Инициализируем выбранный город из localStorage и автоматически определяем город
  // Блок определения города более не используется на странице товара

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
        <Seo
          title="Товар не найден — Eltok.kz"
          description="Страница товара не найдена. Перейдите в каталог Eltok.kz и выберите нужный товар."
          robots="noindex, nofollow"
        />
        <Header />
        <main className="product-main">
          <div className="container" style={{padding: '48px 0', textAlign: 'center'}}>
            <h1>Товар не найден</h1>
            <p>Проверьте правильность ссылки или вернитесь в <a href="/catalog">каталог</a>.</p>
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
      'product_page'
    );
    
    navigate('/checkout', { 
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
        // Возвращаем URL к базовому товару
        updateUrlForProduct(product);
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
        // Обновляем URL для выбранной вариации
        if (matchingVariant.productId) {
          updateUrlForProduct(matchingVariant.productId);
        }
      } else {
        // Нет точной комбинации — не подставляем другой товар
        setSelectedVariant(null);
      }
    }
  };

  // Функция для обновления URL при переключении вариации
  function updateUrlForProduct(targetProduct) {
    if (!targetProduct || !navigate) return;
    
    // Получаем категорию из товара
    const productCategory = targetProduct.category || product?.category;
    const categoryObj = categories.find(cat => cat.id === productCategory);
    const categorySlug = targetProduct.categorySlug || categoryObj?.id || productCategory;
    
    // Формируем новый URL
    let newUrl = '';
    
    if (targetProduct.slug && categorySlug) {
      // Используем формат /catalog/:category/:slug если есть slug
      newUrl = `/catalog/${categorySlug}/${targetProduct.slug}`;
    } else if (targetProduct._id) {
      // Используем формат /product/:id если нет slug
      newUrl = `/product/${targetProduct._id}`;
    } else {
      // Если нет ни slug ни id, не меняем URL
      return;
    }
    
    // Обновляем URL без перезагрузки страницы (replace: true чтобы не добавлять в историю)
    const currentPath = window.location.pathname;
    if (newUrl !== currentPath) {
      navigate(newUrl, { replace: true });
    }
  }

  // Получаем текущий товар для отображения (с учетом выбранной вариации)
  function getCurrentProduct() {
    if (selectedVariant && selectedVariant.productId) {
      // Убеждаемся, что у нас есть полная информация о товаре
      return selectedVariant.productId;
    }
    return product;
  }

  // Получаем текущую цену
  function getCurrentPrice() {
    if (selectedVariant && selectedVariant.productId) {
      return selectedVariant.productId.price;
    }
    return product?.price;
  }

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
  const resetImageZoom = () => setImageZoom({ scale: 1, x: 0, y: 0 });
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const getDistance = (t1, t2) => {
    const dx = t2.clientX - t1.clientX;
    const dy = t2.clientY - t1.clientY;
    return Math.hypot(dx, dy);
  };
  const getMidpoint = (t1, t2) => ({
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2
  });

  const handleImageClick = () => {
    resetImageZoom();
    setShowImageModal(true);
  };
  const handleCloseImageModal = () => {
    resetImageZoom();
    setShowImageModal(false);
  };

  const handleImageModalTouchStart = (e) => {
    const touches = e.touches;
    if (!touches || touches.length === 0) return;

    if (touches.length >= 2) {
      const t1 = touches[0];
      const t2 = touches[1];
      const dist = getDistance(t1, t2);
      const mid = getMidpoint(t1, t2);
      gestureRef.current.mode = 'pinch';
      gestureRef.current.pinchStartDist = dist;
      gestureRef.current.pinchStartScale = imageZoom.scale;
      gestureRef.current.pinchStartMid = mid;
      gestureRef.current.pinchStartOffset = { x: imageZoom.x, y: imageZoom.y };

      touchStateRef.current = { x0: null, y0: null, xLast: null, yLast: null, hasMoved: false };
      return;
    }

    const t = touches[0];

    if (imageZoom.scale > 1.01) {
      gestureRef.current.mode = 'pan';
      gestureRef.current.panStart = { x: t.clientX, y: t.clientY };
      gestureRef.current.panStartOffset = { x: imageZoom.x, y: imageZoom.y };
      touchStateRef.current = { x0: null, y0: null, xLast: null, yLast: null, hasMoved: false };
      return;
    }

    gestureRef.current.mode = 'swipe';
    touchStateRef.current = {
      x0: t.clientX,
      y0: t.clientY,
      xLast: t.clientX,
      yLast: t.clientY,
      hasMoved: false
    };
  };

  const handleImageModalTouchMove = (e) => {
    const touches = e.touches;
    if (!touches || touches.length === 0) return;

    if (gestureRef.current.mode === 'pinch' && touches.length >= 2) {
      const t1 = touches[0];
      const t2 = touches[1];
      const dist = getDistance(t1, t2);
      const mid = getMidpoint(t1, t2);
      const ratio = gestureRef.current.pinchStartDist ? dist / gestureRef.current.pinchStartDist : 1;

      const nextScale = clamp(gestureRef.current.pinchStartScale * ratio, 1, 3);
      const dx = mid.x - gestureRef.current.pinchStartMid.x;
      const dy = mid.y - gestureRef.current.pinchStartMid.y;

      setImageZoom({
        scale: nextScale,
        x: gestureRef.current.pinchStartOffset.x + dx,
        y: gestureRef.current.pinchStartOffset.y + dy
      });

      if (typeof e.preventDefault === 'function') e.preventDefault();
      return;
    }

    if (gestureRef.current.mode === 'pan') {
      const t = touches[0];
      if (!t) return;
      const dx = t.clientX - gestureRef.current.panStart.x;
      const dy = t.clientY - gestureRef.current.panStart.y;
      setImageZoom(prev => ({
        ...prev,
        x: gestureRef.current.panStartOffset.x + dx,
        y: gestureRef.current.panStartOffset.y + dy
      }));
      if (typeof e.preventDefault === 'function') e.preventDefault();
      return;
    }

    if (gestureRef.current.mode !== 'swipe') return;
    const t = touches[0];
    if (!t) return;
    touchStateRef.current.xLast = t.clientX;
    touchStateRef.current.yLast = t.clientY;
    touchStateRef.current.hasMoved = true;
  };

  const handleImageModalTouchEnd = () => {
    if (gestureRef.current.mode === 'pinch' || gestureRef.current.mode === 'pan') {
      gestureRef.current.mode = null;
      setImageZoom(prev => {
        if (prev.scale <= 1.01) return { scale: 1, x: 0, y: 0 };
        return prev;
      });
      return;
    }

    const s = touchStateRef.current;
    if (!s || s.x0 === null || s.y0 === null) return;
    const dx = (s.xLast ?? s.x0) - s.x0;
    const dy = (s.yLast ?? s.y0) - s.y0;

    touchStateRef.current.x0 = null;
    touchStateRef.current.y0 = null;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (!s.hasMoved) return;
    if (absX < 50) return;
    if (absX < absY * 1.2) return;

    const images = getAllImages();
    if (images.length <= 1) return;

    if (dx < 0) {
      setActiveImage((prev) => (prev + 1) % images.length);
    } else {
      setActiveImage((prev) => (prev - 1 + images.length) % images.length);
    }
  };

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
      return product.productGroup.coverImage;
    }
    
    // Затем проверяем обычные изображения товара
    if (product.imageVariants && product.imageVariants[preferredSize]) {
      return product.imageVariants[preferredSize];
    }
    if (product.imageVariants && product.imageVariants.webp) {
      return product.imageVariants.webp;
    }
    return product.image || '/images/products/placeholder.png';
  };

  const getPrimaryProductImage = (p) => {
    if (!p) return '/images/products/placeholder.png';
    const main = String(p.image || '').trim();
    if (main) return main;

    const candidates = [];
    if (Array.isArray(p.images)) candidates.push(...p.images);
    if (Array.isArray(p.images2)) candidates.push(...p.images2);
    if (Array.isArray(p.images3)) candidates.push(...p.images3);

    const first = candidates.find(img => img && String(img).trim() !== '');
    return first ? String(first).trim() : '/images/products/placeholder.png';
  };

  const currentProductForSeo = getCurrentProduct();
  const currentPriceForSeo = getCurrentPrice();

  const productTitle = (currentProductForSeo?.seoTitle && String(currentProductForSeo.seoTitle).trim())
    ? String(currentProductForSeo.seoTitle).trim()
    : (currentProductForSeo?.name ? `${currentProductForSeo.name} — купить в Казахстане | Eltok.kz` : 'Товар — Eltok.kz');

  const productDescription = (currentProductForSeo?.seoDescription && String(currentProductForSeo.seoDescription).trim())
    ? String(currentProductForSeo.seoDescription).trim()
    : (currentProductForSeo?.name
      ? `${currentProductForSeo.name}. Продажа и доставка по Казахстану. Бесплатная доставка по Алматы. Гарантия 12 месяцев.`
      : 'Товар в каталоге Eltok.kz. Продажа и доставка по Казахстану.');

  const disableJsonLd = Boolean(currentProductForSeo?.disableJsonLd);
  const manualJsonLd = (currentProductForSeo?.seoJsonLd && String(currentProductForSeo.seoJsonLd).trim())
    ? String(currentProductForSeo.seoJsonLd).trim()
    : '';

  const extractProductFromJsonLd = (jsonLd) => {
    try {
      if (!jsonLd) return null;
      const raw = typeof jsonLd === 'string'
        ? String(jsonLd)
          .replace(/^\s*<script[^>]*application\/ld\+json[^>]*>\s*/i, '')
          .replace(/^\s*<script[^>]*>\s*/i, '')
          .replace(/\s*<\/script>\s*$/i, '')
          .trim()
        : jsonLd;
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const pickProduct = (obj) => {
        if (!obj) return null;
        if (Array.isArray(obj)) {
          return obj.map(pickProduct).find(Boolean) || null;
        }
        if (obj['@type'] === 'Product') return obj;
        if (obj['@graph']) return pickProduct(obj['@graph']);
        return null;
      };
      return pickProduct(data);
    } catch {
      return null;
    }
  };

  const schemaProduct = manualJsonLd ? extractProductFromJsonLd(manualJsonLd) : null;
  const ogTitle = schemaProduct?.name || productTitle;
  const ogDescription = schemaProduct?.description || productDescription;
  const ogUrl = schemaProduct?.offers?.url || (typeof window !== 'undefined' ? window.location.href : 'https://eltok.kz');
  const ogImage = (() => {
    const img = schemaProduct?.image
      || currentProductForSeo?.coverPhoto
      || currentProductForSeo?.image
      || (Array.isArray(currentProductForSeo?.images) ? currentProductForSeo.images[0] : undefined);
    if (!img) return undefined;
    const first = Array.isArray(img) ? img[0] : img;
    return String(first).startsWith('http') ? String(first) : `https://eltok.kz${first}`;
  })();
  const schemaOffers = schemaProduct?.offers;
  const priceAmount = schemaOffers?.price ?? (currentPriceForSeo !== undefined && currentPriceForSeo !== null ? String(currentPriceForSeo) : undefined);
  const priceCurrency = schemaOffers?.priceCurrency || 'KZT';
  const availability = (() => {
    const a = String(schemaOffers?.availability || '');
    if (!a) return undefined;
    return a.includes('InStock') ? 'instock' : 'oos';
  })();
  const brand = schemaProduct?.brand?.name || schemaProduct?.brand;
  const metaTags = [
    { property: 'og:type', content: 'product' },
    { property: 'og:site_name', content: 'Eltok.kz' },
    { property: 'og:title', content: ogTitle },
    { property: 'og:description', content: ogDescription },
    { property: 'og:url', content: ogUrl },
    ogImage ? { property: 'og:image', content: ogImage } : null,
    priceAmount !== undefined ? { property: 'product:price:amount', content: String(priceAmount) } : null,
    priceCurrency ? { property: 'product:price:currency', content: String(priceCurrency) } : null,
    availability ? { property: 'product:availability', content: availability } : null,
    brand ? { property: 'product:brand', content: String(brand) } : null
  ].filter(Boolean);

  return (
    <div className="product-page">
      <Seo
        title={productTitle}
        description={productDescription}
        meta={metaTags}
        jsonLd={disableJsonLd ? null : (manualJsonLd || {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://eltok.kz/' },
                { '@type': 'ListItem', position: 2, name: 'Каталог', item: 'https://eltok.kz/catalog' },
                ...(categoryName ? [{ '@type': 'ListItem', position: 3, name: categoryName, item: 'https://eltok.kz/catalog' }] : []),
                { '@type': 'ListItem', position: categoryName ? 4 : 3, name: currentProductForSeo?.name || 'Товар', item: `https://eltok.kz${window.location.pathname}` }
              ]
            },
            {
              '@type': 'Product',
              name: currentProductForSeo?.name || undefined,
              description: productDescription,
              image: (() => {
                const img = currentProductForSeo?.coverPhoto || currentProductForSeo?.image || (Array.isArray(currentProductForSeo?.images) ? currentProductForSeo.images[0] : undefined);
                if (!img) return undefined;
                return String(img).startsWith('http') ? img : `https://eltok.kz${img}`;
              })(),
              offers: {
                '@type': 'Offer',
                priceCurrency: 'KZT',
                price: Number(currentPriceForSeo || 0),
                availability: 'https://schema.org/InStock',
                url: `https://eltok.kz${window.location.pathname}`
              }
            }
          ]
        })}
      />
      <Header />
      <main className="product-main">
        <div className="product-container">
          <nav className="breadcrumbs" style={{paddingBottom: '18px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px'}}>
            <a href="/">Главная</a>
            <span style={{margin: '0 8px', color: '#bdbdbd', fontSize: '18px'}}>&rarr;</span>
            <a href="/catalog">Каталог</a>
            {categoryName && (
              <>
                <span style={{margin: '0 8px', color: '#bdbdbd', fontSize: '18px'}}>&rarr;</span>
                <a href={`/catalog?category=${product.category}`}>{categoryName}</a>
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
                {productGroup && productGroup.parameters.length > 0}

                <div className="product-divider"></div>

                <div className="product-buy-row">
                  <div className="product-price-block">
                    <div className="product-price-label-value">
                      <div className="product-price-label">Цена</div>
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
                        trackButtonClick('Задать вопрос', 'product_page', id);
                        handleOpenModal();
                      }}
                      data-analytics-context="product_page"
                    >
                      Задать вопрос
                    </button>
                    <div className="product-btns-divider"></div>
                    <button 
                      className="product-btn-buy" 
                      onClick={handleBuy}
                      data-analytics-context="product_page"
                    >
                      Купить
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
      {(variationProducts.length > 0 || randomProducts.length > 0) && (
        <section className="mini-catalog-section">
          <div className="mini-catalog-header">
            <h2>{variationProducts.length > 0 ? 'Вариации товара' : 'Похожие товары'}</h2>
          </div>
          <div className="mini-catalog-slider-wrapper">
            <div className="mini-catalog-slider">
              {/* Первый набор карточек */}
              {(variationProducts.length > 0 ? variationProducts : randomProducts).map(vp => (
                <div
                  key={`first-${vp._id}`}
                  className="product-card"
                  onClick={() => window.location.href = `/product/${vp._id}`}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="product-image">
                    <picture>
                      <source
                        srcSet={getPrimaryProductImage(vp)}
                        type="image/webp"
                      />
                      <img
                        src={getPrimaryProductImage(vp)}
                        alt={vp.name}
                        loading="lazy"
                        width="200"
                        height="160"
                      />
                    </picture>
                  </div>
                  <div className="product-info">
                    <div className="product-name">{vp.name}</div>
                    <div className="product-price">{vp.price ? formatTenge(vp.price) + ' ₸' : ''}</div>
                  </div>
                </div>
              ))}
              {/* Дублированный набор карточек для бесконечной прокрутки */}
              {(variationProducts.length > 0 ? variationProducts : randomProducts).map(vp => (
                <div
                  key={`second-${vp._id}`}
                  className="product-card"
                  onClick={() => window.location.href = `/product/${vp._id}`}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="product-image">
                    <picture>
                      <source
                        srcSet={getPrimaryProductImage(vp)}
                        type="image/webp"
                      />
                      <img
                        src={getPrimaryProductImage(vp)}
                        alt={vp.name}
                        loading="lazy"
                        width="200"
                        height="160"
                      />
                    </picture>
                  </div>
                  <div className="product-info">
                    <div className="product-name">{vp.name}</div>
                    <div className="product-price">{vp.price ? formatTenge(vp.price) + ' ₸' : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      <Footer />
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} onSubmit={handleSubmitForm} product={getCurrentProduct().name} />
      {/* Модальное окно для увеличенного фото */}
      {showImageModal && (
        <div className="image-modal-overlay" onClick={handleCloseImageModal}>
          <div
            className="image-modal-content"
            onClick={e=>e.stopPropagation()}
            onTouchStart={handleImageModalTouchStart}
            onTouchMove={handleImageModalTouchMove}
            onTouchEnd={handleImageModalTouchEnd}
          >
            <img 
              src={getAllImages()[activeImage]} 
              alt={getCurrentProduct().name} 
              className="image-modal-img"
              style={{
                objectFit: 'contain',
                transform: `translate3d(${imageZoom.x}px, ${imageZoom.y}px, 0) scale(${imageZoom.scale})`,
                transformOrigin: 'center center'
              }}
              draggable={false}
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
  const getAvailableTabs = (p) => {
    const fromSettings = Array.isArray(p?.pageSections) ? p.pageSections.map(String) : [];
    const sanitized = fromSettings
      .map(s => s.trim())
      .filter(Boolean);
    if (sanitized.length > 0) {
      // Backward-compat: ранее гарантия была дефолтной вкладкой.
      // Показываем вкладку «Гарантия» по умолчанию, если она не отключена явно.
      const hasWarrantyTab = sanitized.includes('warranty');
      const warrantyDisabled = p?.warrantyDisabled === true;
      if (!hasWarrantyTab && !warrantyDisabled) return [...sanitized, 'warranty'];
      return sanitized;
    }

    const inferred = [];
    if (p?.description && String(p.description).trim()) inferred.push('desc');
    if (p?.characteristics && String(p.characteristics).trim()) inferred.push('specs');
    if (p?.equipment && String(p.equipment).trim()) inferred.push('equip');
    const warrantyDisabled = p?.warrantyDisabled === true;
    if (!warrantyDisabled) inferred.push('warranty');
    return inferred.length > 0 ? inferred : ['desc', 'warranty'];
  };

  const tabs = getAvailableTabs(product);
  const [tab, setTab] = React.useState(tabs[0] || 'desc');

  React.useEffect(() => {
    const nextTabs = getAvailableTabs(product);
    if (!nextTabs.includes(tab)) {
      setTab(nextTabs[0] || 'desc');
    }
  }, [product]);
  
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
        {tabs.includes('desc') && (
          <button className={tab==='desc'?'active':''} onClick={()=>setTab('desc')}>Описание</button>
        )}
        {tabs.includes('specs') && (
          <button className={tab==='specs'?'active':''} onClick={()=>setTab('specs')}>Характеристики</button>
        )}
        {tabs.includes('equip') && (
          <button className={tab==='equip'?'active':''} onClick={()=>setTab('equip')}>Комплектация</button>
        )}
        {tabs.includes('warranty') && (
          <button className={tab==='warranty'?'active':''} onClick={()=>setTab('warranty')}>Гарантия</button>
        )}
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
            {product.warranty && String(product.warranty).trim() ? (
              <div dangerouslySetInnerHTML={{ __html: String(product.warranty).replace(/\n/g, '<br/>') }} />
            ) : (
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
                    <li style={{marginBottom: '6px'}}>Мы проведём диагностику при осмотре изделия.</li>
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Product; 