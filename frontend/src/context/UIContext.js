'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { IoCheckmarkCircle, IoAlertCircle, IoInformationCircle } from 'react-icons/io5';

const UIContext = createContext();

export const UIProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <UIContext.Provider value={{ showToast }}>
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
        return <IoCheckmarkCircle size={22} color="#10B981" />;
      case 'error':
        return <IoAlertCircle size={22} color="#EF4444" />;
      case 'info':
      default:
        return <IoInformationCircle size={22} color="#3B82F6" />;
    }
  };

  return (
    <div className="custom-toast" onClick={onClose}>
      {getIcon()}
      <div style={{ fontSize: '14px', fontWeight: '500' }}>{toast.message}</div>
    </div>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
