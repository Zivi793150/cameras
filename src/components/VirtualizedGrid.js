import React, { useState, useEffect, useRef, useCallback } from 'react';

const VirtualizedGrid = ({ 
  items, 
  itemHeight = 300, 
  itemWidth = 280, 
  containerHeight = 600,
  containerWidth = '100%',
  renderItem,
  gap = 20
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const containerRef = useRef(null);
  
  // Вычисляем количество колонок
  const columnsCount = Math.floor(containerWidth / (itemWidth + gap)) || 1;
  
  // Вычисляем общую высоту всех строк
  const totalRows = Math.ceil(items.length / columnsCount);
  const totalHeight = totalRows * itemHeight + (totalRows - 1) * gap;
  
  // Вычисляем видимые строки
  const startRow = Math.floor(scrollTop / (itemHeight + gap));
  const endRow = Math.min(
    startRow + Math.ceil(containerHeight / (itemHeight + gap)) + 1,
    totalRows
  );
  
  // Вычисляем видимые элементы
  const startIndex = startRow * columnsCount;
  const endIndex = Math.min(endRow * columnsCount, items.length);
  const visibleItems = items.slice(startIndex, endIndex);
  
  // Обработчик скролла
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
    setScrollLeft(e.target.scrollLeft);
  }, []);
  
  // Обработчик изменения размера окна
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setScrollTop(containerRef.current.scrollTop);
        setScrollLeft(containerRef.current.scrollLeft);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <div
      ref={containerRef}
      style={{
        height: containerHeight,
        width: containerWidth,
        overflow: 'auto',
        position: 'relative'
      }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: totalHeight,
          width: '100%',
          position: 'relative'
        }}
      >
        {visibleItems.map((item, index) => {
          const actualIndex = startIndex + index;
          const row = Math.floor(actualIndex / columnsCount);
          const col = actualIndex % columnsCount;
          
          return (
            <div
              key={item._id || actualIndex}
              style={{
                position: 'absolute',
                top: row * (itemHeight + gap),
                left: col * (itemWidth + gap),
                width: itemWidth,
                height: itemHeight
              }}
            >
              {renderItem(item, actualIndex)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VirtualizedGrid;
