import React, { useState, useEffect } from 'react';

const LoadingIndicator = ({ 
  loading, 
  progress = 0, 
  message = 'Загрузка...',
  showProgress = true,
  size = 'medium',
  color = '#007bff'
}) => {
  const [dots, setDots] = useState('');
  
  // Анимация точек
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.');
      }, 500);
      
      return () => clearInterval(interval);
    }
  }, [loading]);
  
  if (!loading) return null;
  
  const sizeStyles = {
    small: { width: '20px', height: '20px', fontSize: '12px' },
    medium: { width: '40px', height: '40px', fontSize: '16px' },
    large: { width: '60px', height: '60px', fontSize: '20px' }
  };
  
  const currentSize = sizeStyles[size] || sizeStyles.medium;
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      gap: '16px'
    }}>
      {/* Спиннер */}
      <div style={{
        width: currentSize.width,
        height: currentSize.height,
        border: `3px solid #f3f3f3`,
        borderTop: `3px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      
      {/* Сообщение */}
      <div style={{
        fontSize: currentSize.fontSize,
        color: '#666',
        textAlign: 'center'
      }}>
        {message}{dots}
      </div>
      
      {/* Прогресс бар */}
      {showProgress && progress > 0 && (
        <div style={{
          width: '200px',
          height: '8px',
          backgroundColor: '#f0f0f0',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: '4px',
            transition: 'width 0.3s ease'
          }} />
        </div>
      )}
      
      {/* Процент */}
      {showProgress && progress > 0 && (
        <div style={{
          fontSize: '14px',
          color: '#666',
          fontWeight: '500'
        }}>
          {Math.round(progress)}%
        </div>
      )}
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingIndicator;
