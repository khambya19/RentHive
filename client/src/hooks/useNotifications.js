import { useState, useCallback } from 'react';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: 'success', // default type
      ...notification,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);

    return id;
  }, [removeNotification]);

  const showSuccess = useCallback((title, message) => {
    return addNotification({ type: 'success', title, message });
  }, [addNotification]);

  const showError = useCallback((title, message) => {
    return addNotification({ type: 'error', title, message });
  }, [addNotification]);

  const showInfo = useCallback((title, message) => {
    return addNotification({ type: 'info', title, message });
  }, [addNotification]);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showInfo,
    clearAll,
  };
};