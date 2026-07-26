'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { IoCheckmarkCircle, IoAlertCircle, IoInformationCircle } from 'react-icons/io5';
import { Modal, Button } from 'react-bootstrap';
import { getProductImageUrl } from '@/utils/api';
import { getColorName } from '@/utils/imageColor';
import { useSelector } from 'react-redux';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const UIContext = createContext();

export const UIProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [optionsModalData, setOptionsModalData] = useState(null);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const openOptionsModal = (product, onConfirm) => {
    setOptionsModalData({ product, onConfirm });
  };

  const closeOptionsModal = () => {
    setOptionsModalData(null);
  };

  return (
    <UIContext.Provider value={{ showToast, openOptionsModal }}>
      {children}
      
      {/* Dynamic Toast Renderer Overlay */}
      <div className="custom-toast-container">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      {/* Global Select Options Modal */}
      {optionsModalData && (
        <SelectOptionsModal
          product={optionsModalData.product}
          onConfirm={(selections) => {
            optionsModalData.onConfirm(selections);
            closeOptionsModal();
          }}
          onClose={closeOptionsModal}
        />
      )}
    </UIContext.Provider>
  );
};

const ToastItem = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000); // close after 4 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <IoCheckmarkCircle size={22} className="toast-icon" color="#10B981" />;
      case 'error':
        return <IoAlertCircle size={22} className="toast-icon" color="#EF4444" />;
      case 'info':
      default:
        return <IoInformationCircle size={22} className="toast-icon" color="#3B82F6" />;
    }
  };

  return (
    <div className="custom-toast" onClick={onClose}>
      {getIcon()}
      <div className="custom-toast-message" style={{ fontWeight: '500' }}>{toast.message}</div>
    </div>
  );
};

const SelectOptionsModal = ({ product, onConfirm, onClose }) => {
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [fieldErrors, setFieldErrors] = useState({ size: '', color: '' });

  const cartItems = useSelector((state) => state.cart.items || []);

  const images = product.images || [];
  const sizes = product.variants?.sizes || [];
  const colors = product.variants?.colors || [];

  useEffect(() => {
    const hasSizes = sizes.length > 0;
    const hasColors = colors.length > 0;

    if ((!hasSizes || selectedSize) && (!hasColors || selectedColor)) {
      const existingItem = cartItems.find(
        (item) =>
          item.productId.toString() === product._id.toString() &&
          (!hasSizes || item.size === selectedSize) &&
          (!hasColors || item.color === selectedColor)
      );
      if (existingItem) {
        setQuantity(existingItem.quantity);
      } else {
        setQuantity(1);
      }
    }
  }, [selectedSize, selectedColor, cartItems, product._id, sizes, colors]);

  const handleSelectSize = (size) => {
    setSelectedSize(size);
    setFieldErrors((prev) => ({ ...prev, size: '' }));
  };

  const handleSelectColor = (color) => {
    setSelectedColor(color);
    setFieldErrors((prev) => ({ ...prev, color: '' }));
  };

  const handleAddToCart = () => {
    const errors = { size: '', color: '' };

    if (sizes.length > 0 && !selectedSize) {
      errors.size = 'Please select a size';
    }
    if (colors.length > 0 && !selectedColor) {
      errors.color = 'Please select a color';
    }

    if (errors.size || errors.color) {
      setFieldErrors(errors);
      return;
    }

    onConfirm({ size: selectedSize, color: selectedColor, quantity });
  };

  return (
    <Modal show={true} onHide={onClose} centered size="md" className="select-options-modal">
      <Modal.Header closeButton className="border-0 bg-white text-dark p-3 align-items-center">
        <Modal.Title className="fs-5 fw-bold w-100 text-center text-dark" style={{ fontFamily: 'var(--font-outfit)', letterSpacing: '0.5px', color: 'var(--text-dark)' }}>
          Select Options
        </Modal.Title>
      </Modal.Header>

      
      <Modal.Body className="px-4 py-3">
        {/* Main Image View with Swiper Slider */}
        <div className="text-center mb-3">
          <div className="options-modal-image-wrapper mx-auto rounded-3 overflow-hidden bg-light border position-relative" style={{ width: '220px', height: '280px' }}>
            {images.length > 1 ? (
              <Swiper
                modules={[Navigation, Pagination, A11y]}
                navigation
                pagination={{ clickable: true }}
                loop={images.length > 1}
                grabCursor={true}
                className="w-100 h-100 options-modal-swiper"
              >
                {images.map((img, idx) => (
                  <SwiperSlide key={idx} className="w-100 h-100">
                    <img
                      src={getProductImageUrl(img)}
                      alt={`${product.name} - image ${idx + 1}`}
                      className="w-100 h-100"
                      style={{ objectFit: 'contain' }}
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            ) : (
              <img
                src={getProductImageUrl(images[0] || product.image)}
                alt={product.name}
                className="w-100 h-100"
                style={{ objectFit: 'contain' }}
              />
            )}
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-3">
          <h5 className="fw-bold text-dark mb-1" style={{ fontSize: '15.5px', lineHeight: '1.4' }}>
            {product.name}
          </h5>
          <div className="fw-bold fs-5" style={{ color: 'var(--primary-navy)' }}>
            ৳{product.discountPrice > 0 ? product.discountPrice : product.price}
          </div>
        </div>


        {/* Choose Size */}
        {sizes.length > 0 && (
          <div className="mb-3 text-center">
            <span className="fw-semibold text-secondary d-block mb-2" style={{ fontSize: '13.5px' }}>
              Choose Size
            </span>
            <div className={`d-flex justify-content-center gap-2 flex-wrap options-modal-field${fieldErrors.size ? ' has-error' : ''}`}>
              {sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleSelectSize(size)}
                  className={`size-select-btn px-3 py-2 border rounded-2 font-weight-bold transition-smooth ${selectedSize === size ? 'active' : ''}`}
                  style={{
                    minWidth: '55px',
                    fontSize: '13.5px',
                    fontWeight: '600'
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
            {fieldErrors.size && (
              <p className="options-modal-field-error mb-0 mt-2">{fieldErrors.size}</p>
            )}
          </div>
        )}

        {/* Choose Color */}
        {colors.length > 0 && (
          <div className="mb-4 text-center">
            <span className="fw-semibold text-secondary d-block mb-2" style={{ fontSize: '13.5px' }}>
              Choose Color{selectedColor ? `: ${getColorName(selectedColor)}` : ''}
            </span>
            <div className={`d-flex justify-content-center gap-2 flex-wrap options-modal-field${fieldErrors.color ? ' has-error' : ''}`}>
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleSelectColor(color)}
                  title={getColorName(color)}
                  className="rounded-circle border-0 shadow-sm transition-smooth color-select-btn"
                  style={{
                    backgroundColor: color,
                    width: '30px',
                    height: '30px',
                    border: selectedColor === color ? '3px solid var(--accent-red)' : '1px solid #CBD5E1',
                    outline: selectedColor === color ? '2px solid var(--accent-red)' : 'none',
                    outlineOffset: '2px'
                  }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
            {fieldErrors.color && (
              <p className="options-modal-field-error mb-0 mt-2">{fieldErrors.color}</p>
            )}
          </div>
        )}

        {/* Quantity */}
        <div className="d-flex align-items-center justify-content-center gap-3 mb-4">
          <span className="fw-semibold text-secondary" style={{ fontSize: '13.5px' }}>Quantity:</span>
          <div className="d-flex align-items-center border rounded-3 bg-white">
            <button
              className="border-0 bg-transparent text-dark fw-bold px-3 py-1"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              -
            </button>
            <span className="px-2 fw-bold" style={{ fontSize: '14px' }}>{quantity}</span>
            <button
              className="border-0 bg-transparent text-dark fw-bold px-3 py-1"
              onClick={() => setQuantity(quantity + 1)}
            >
              +
            </button>
          </div>
        </div>

        {/* Confirm Add to Cart */}
        <Button
          type="button"
          onClick={handleAddToCart}
          className="w-100 py-2.5 rounded-3 fw-bold border-0 text-white options-modal-submit-btn"
          style={{
            fontSize: '15px',
            boxShadow: '0 4px 14px rgba(30, 41, 59, 0.2)',
          }}
        >
          Add to Cart
        </Button>
      </Modal.Body>
    </Modal>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
