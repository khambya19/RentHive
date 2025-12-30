import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    const socketInstance = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketInstance.on('connect', () => {
      console.log('✅ Socket connected:', socketInstance.id);
      setIsConnected(true);
      
      // Re-register user if they were registered before
      if (currentUserId) {
        socketInstance.emit('register', currentUserId);
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setIsConnected(false);
    });

    // Listen for new notifications
    socketInstance.on('new-notification', (notification) => {
      console.log('🔔 New notification received:', notification);
      
      // Add notification to state
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Request browser notification permission and show notification
      if (Notification.permission === 'granted') {
        showBrowserNotification(notification);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            showBrowserNotification(notification);
          }
        });
      }
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Re-register user when currentUserId changes
  useEffect(() => {
    if (socket && isConnected && currentUserId) {
      socket.emit('register', currentUserId);
    }
  }, [socket, isConnected, currentUserId]);

  // Show browser notification
  const showBrowserNotification = (notification) => {
    try {
      const { title, message, type } = notification;
      const icon = getNotificationIcon(type);
      
      new Notification(title, {
        body: message,
        icon: '/favicon.ico', // You can customize this
        badge: '/favicon.ico',
        tag: `notification-${notification.id}`,
        requireInteraction: false,
        silent: false
      });
    } catch (error) {
      console.error('❌ Error showing browser notification:', error);
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type) => {
    const icons = {
      success: '✅',
      warning: '⚠️',
      error: '❌',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  };

  // Register user with socket
  const registerUser = useCallback((userId) => {
    console.log('👤 Registering user:', userId);
    setCurrentUserId(userId);
    
    if (socket && isConnected) {
      socket.emit('register', userId);
    }

    // Fetch existing notifications
    fetchUserNotifications(userId);

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        console.log('🔔 Notification permission:', permission);
      });
    }
  }, [socket, isConnected]);

  // Fetch user notifications from API
  const fetchUserNotifications = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/notifications/user/${userId}`);
      if (response.data.success) {
        setNotifications(response.data.data.notifications);
        setUnreadCount(response.data.data.unreadCount);
        console.log('📥 Loaded notifications:', response.data.data.notifications.length);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId) => {
    if (!currentUserId) return;

    try {
      const response = await axios.patch(
        `http://localhost:5000/api/notifications/${notificationId}/read`,
        { userId: currentUserId }
      );

      if (response.data.success) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId ? { ...notif, is_read: true } : notif
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        console.log('✅ Notification marked as read:', notificationId);
      }
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!currentUserId) return;

    try {
      const response = await axios.patch(
        `http://localhost:5000/api/notifications/user/${currentUserId}/read-all`
      );

      if (response.data.success) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, is_read: true }))
        );
        setUnreadCount(0);
        console.log('✅ All notifications marked as read');
      }
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    if (!currentUserId) return;

    try {
      const response = await axios.delete(
        `http://localhost:5000/api/notifications/${notificationId}`,
        { data: { userId: currentUserId } }
      );

      if (response.data.success) {
        // Update local state
        setNotifications((prev) => {
          const notification = prev.find((n) => n.id === notificationId);
          if (notification && !notification.is_read) {
            setUnreadCount((count) => Math.max(0, count - 1));
          }
          return prev.filter((notif) => notif.id !== notificationId);
        });
        console.log('✅ Notification deleted:', notificationId);
      }
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
    }
  };

  const value = {
    socket,
    isConnected,
    notifications,
    unreadCount,
    registerUser,
    markNotificationAsRead,
    markAllAsRead,
    deleteNotification,
    currentUserId
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
