import React, { useEffect, useRef, useState } from 'react';

const InteractiveMap = ({ 
  latitude = 43.233801, 
  longitude = 76.816602, 
  address = "г. Алматы, Бокейханова 510, Склад",
  companyName = "Танкер Тулс",
  zoom = 17 
}) => {
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    const loadMap = () => {
      if (!mapRef.current) return;

      // Попытка загрузить 2GIS виджет
      const load2GISWidget = () => {
        const mapContainer = mapRef.current;
        if (mapContainer) {
          const ts = Date.now();
          mapContainer.innerHTML = `
            <div style="
              width: 100%; 
              height: 100%; 
              position: relative;
              border-radius: 8px;
              overflow: hidden;
            ">
              <!-- Основная карта 2GIS -->
              <div id="main-map-${ts}" style="width: 100%; height: 100%; position: relative;">
                <iframe
                  src="https://widgets.2gis.com/widget?type=firmsonmap&options=%7B%22pos%22%3A%7B%22lat%22%3A${latitude}%2C%22lon%22%3A${longitude}%7D%2C%22zoom%22%3A${zoom}%2C%22city%22%3A%22almaty%22%7D"
                  width="100%"
                  height="100%"
                  style="border: 0; border-radius: 8px;"
                  allowfullscreen=""
                  loading="lazy"
                  referrerpolicy="no-referrer-when-downgrade"
                  title="Карта ${companyName} - ${address}"
                ></iframe>
              </div>
              
              <!-- Панель управления картой -->
              <div style="
                position: absolute;
                top: 10px;
                right: 10px;
                background: rgba(255,255,255,0.95);
                border-radius: 8px;
                padding: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                display: flex;
                gap: 5px;
                z-index: 1000;
              ">
                <button 
                  onclick="switchTo2GIS_${ts}()" 
                  style="
                    padding: 6px 12px;
                    border: 1px solid #ddd;
                    background: #2E7D32;
                    color: white;
                    border-radius: 4px;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.3s;
                  "
                  onmouseover="this.style.background='#1B5E20'"
                  onmouseout="this.style.background='#2E7D32'"
                >
                  2GIS
                </button>
                <button 
                  onclick="switchToGoogle_${ts}()" 
                  style="
                    padding: 6px 12px;
                    border: 1px solid #ddd;
                    background: #1976D2;
                    color: white;
                    border-radius: 4px;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.3s;
                  "
                  onmouseover="this.style.background='#1565C0'"
                  onmouseout="this.style.background='#1976D2'"
                >
                  Google
                </button>
                <button 
                  onclick="openInNewWindow_${ts}()" 
                  style="
                    padding: 6px 12px;
                    border: 1px solid #ddd;
                    background: #FF9800;
                    color: white;
                    border-radius: 4px;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.3s;
                  "
                  onmouseover="this.style.background='#F57C00'"
                  onmouseout="this.style.background='#FF9800'"
                >
                  🔗
                </button>
              </div>
              
              <!-- Информационная панель -->
              <div style="
                position: absolute;
                bottom: 10px;
                left: 10px;
                background: rgba(255,255,255,0.95);
                border-radius: 8px;
                padding: 12px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                max-width: 300px;
                z-index: 1000;
              ">
                <div style="font-weight: bold; margin-bottom: 5px; color: #333;">
                  📍 ${companyName}
                </div>
                <div style="font-size: 14px; color: #666; margin-bottom: 8px;">
                  ${address}
                </div>
                <div style="font-size: 12px; color: #888;">
                  Координаты: ${latitude}, ${longitude}
                </div>
              </div>
            </div>
          `;
          
          // Добавляем функции переключения карт с уникальными именами
          const timestamp = ts;
          window[`switchTo2GIS_${timestamp}`] = () => {
            const mainMap = document.getElementById(`main-map-${timestamp}`);
            if (mainMap) {
              mainMap.innerHTML = `
                <iframe
                  src="https://widgets.2gis.com/widget?type=firmsonmap&options=%7B%22pos%22%3A%7B%22lat%22%3A${latitude}%2C%22lon%22%3A${longitude}%7D%2C%22zoom%22%3A${zoom}%2C%22city%22%3A%22almaty%22%7D"
                  width="100%"
                  height="100%"
                  style="border: 0; border-radius: 8px;"
                  allowfullscreen=""
                  loading="lazy"
                  referrerpolicy="no-referrer-when-downgrade"
                  title="Карта ${companyName} - 2GIS"
                ></iframe>
              `;
            }
          };
          
          window[`switchToGoogle_${timestamp}`] = () => {
            const mainMap = document.getElementById(`main-map-${timestamp}`);
            if (mainMap) {
              mainMap.innerHTML = `
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2906.123456789!2d${longitude}!3d${latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDPCsDE0JzAxLjciTiA3NsKwNDknMDAuMCJF!5e0!3m2!1sru!2skz!4v1234567890123!5m2!1sru!2skz"
                  width="100%"
                  height="100%"
                  style="border: 0; border-radius: 8px;"
                  allowfullscreen=""
                  loading="lazy"
                  referrerpolicy="no-referrer-when-downgrade"
                  title="Карта ${companyName} - Google Maps"
                ></iframe>
              `;
            }
          };
          
          window[`openInNewWindow_${timestamp}`] = () => {
             const choice = window.confirm('Выберите карту:\nOK - 2GIS\nОтмена - Google Maps');
             if (choice) {
               window.open(`https://2gis.kz/almaty/search/${latitude}%2C${longitude}`, '_blank');
             } else {
               window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
             }
           };
          
          setMapLoaded(true);
        }
      };

      // Загружаем карту
      load2GISWidget();
      
      // Fallback через 2.5 секунды: если 2GIS не прогрузился, показываем Google Maps
      const fallbackTimer = setTimeout(() => {
        if (!mapLoaded) {
          setMapError(true);
          createGoogleEmbed();
        }
      }, 2500);

      const createGoogleEmbed = () => {
        const mapContainer = mapRef.current;
        if (mapContainer) {
          mapContainer.innerHTML = `
            <iframe
              src="https://www.google.com/maps?q=${latitude},${longitude}&z=${zoom}&output=embed"
              width="100%"
              height="100%"
              style="border:0; border-radius:8px;"
              allowfullscreen=""
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
              title="Карта ${companyName} - Google Maps"
            ></iframe>
          `;
        }
      };

      return () => {
        clearTimeout(fallbackTimer);
      };
    };

    loadMap();
  }, [latitude, longitude, address, companyName, zoom, mapLoaded]);

  return (
    <div 
      ref={mapRef}
      style={{ 
        width: '100%', 
        height: '420px',
        border: '1px solid #ddd',
        borderRadius: '8px'
      }}
    />
  );
};

export default InteractiveMap;
