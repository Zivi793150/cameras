import React, { useState, useEffect } from 'react';

const ProgressiveImage = ({ 
  src, 
  placeholder, 
  alt, 
  className = '', 
  style = {}, 
  width, 
  height,
  loading = 'lazy',
  fetchPriority = 'auto'
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder || src);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Если placeholder и src разные, загружаем основное изображение
    if (placeholder && placeholder !== src) {
      const img = new Image();
      img.src = src;
      
      img.onload = () => {
        setImageSrc(src);
        setImageLoading(false);
      };
      
      img.onerror = () => {
        setImageError(true);
        setImageLoading(false);
      };
    } else {
      setImageLoading(false);
    }
  }, [src, placeholder]);

  return (
    <div 
      className={`progressive-image ${className}`} 
      style={{ 
        position: 'relative',
        overflow: 'hidden',
        ...style 
      }}
    >
      <img
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        fetchPriority={fetchPriority}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: 'opacity 0.3s ease-in-out',
          opacity: imageLoading ? 0.7 : 1,
          filter: imageLoading ? 'blur(2px)' : 'none'
        }}
        onLoad={() => setImageLoading(false)}
        onError={() => setImageError(true)}
      />
      
      {imageLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          color: '#666'
        }}>
          Загрузка...
        </div>
      )}
      
      {imageError && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          color: '#999'
        }}>
          Ошибка загрузки
        </div>
      )}
    </div>
  );
};

export default ProgressiveImage;
