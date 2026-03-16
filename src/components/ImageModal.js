import React from 'react';
import './ImageModal.css';

const ImageModal = ({ images, activeIndex, onClose, onPrev, onNext }) => {
  if (!images || images.length === 0) return null;
  return (
    <div className="image-modal-overlay" onClick={onClose}>
      <div className="image-modal-content" onClick={e => e.stopPropagation()}>
        <button className="image-modal-close" onClick={onClose}>&times;</button>
        {images.length > 1 && (
          <button className="image-modal-arrow left" onClick={onPrev}>&#8592;</button>
        )}
        <img className="image-modal-img" src={images[activeIndex]} alt="Фото товара" loading="lazy" />
        {images.length > 1 && (
          <button className="image-modal-arrow right" onClick={onNext}>&#8594;</button>
        )}
      </div>
    </div>
  );
};

export default ImageModal; 