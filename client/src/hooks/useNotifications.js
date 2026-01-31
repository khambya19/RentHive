import { useState, useCallback, useRef } from 'react';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const timersRef = useRef({});

  const removeNotification = useCallback((id) => {
    // Clear any pending timeout for this notification
    if (timersRef.current[id]) {
      // use globalThis.clearTimeout to match global timer mocking
      globalThis.clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }

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

    // Auto-remove after 5 seconds (use globalThis.setTimeout so Vitest can mock it)
    const timeoutId = globalThis.setTimeout(() => {
      removeNotification(id);
      // cleanup stored timer
      if (timersRef.current[id]) delete timersRef.current[id];
    }, 5000);

    // store timer id so it can be cleared if removed/cleared earlier
    timersRef.current[id] = timeoutId;

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
    // Clear all pending timers
    Object.values(timersRef.current).forEach(tid => globalThis.clearTimeout(tid));
    timersRef.current = {};
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