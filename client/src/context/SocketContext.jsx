/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
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
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Initialize socket once

  useEffect(() => {
    const url = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
    const socketInstance = io(url, {
      transports: ['polling', 'websocket'],
      upgrade: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 10000,
      autoConnect: true, // Auto-connect on initialization
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      // console.log('✅ Socket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (_reason) => {
      // console.log('❌ Socket disconnected:', _reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (_err) => {
      // console.warn('⚠️ Socket connection error:', err.message);
      setIsConnected(false);
    });

    // Real-time new notification
    socketInstance.on('new-notification', (notification) => {
      // console.log('🔔 Real-time notification received:', notification);
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Browser notification (optional)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `notif-${notification.id}`,
        });
      }
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []); // ← only once on mount

  // Register user when currentUserId changes (and socket is ready)
  useEffect(() => {
    if (!currentUserId || !socket || !isConnected) return;

    // console.log('👤 Registering user:', currentUserId);
    socket.emit('register', currentUserId);

    // Fetch initial notifications
    fetchUserNotifications(currentUserId);
  }, [currentUserId, socket, isConnected]);

  // ── Helper functions ─────────────────────────────────────────────



  const registerUser = useCallback((userId) => {
    if (!userId) return;
    setCurrentUserId(userId);
    // The actual emit happens in the useEffect above
  }, []);

  const fetchUserNotifications = async (userId) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';
      const res = await axios.get(
        `${apiUrl}/notifications/user/${userId}`
      );
      if (res.data.success) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount || 0);
        // console.log(`📥 Loaded ${res.data.data.notifications?.length || 0} notifications`);
      }
    } catch (err) {
      // console.error('❌ Failed to fetch notifications:', err);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    if (!currentUserId) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';
      const res = await axios.patch(
        `${apiUrl}/notifications/${notificationId}/read`,
        { userId: currentUserId }
      );
      if (res.data.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        // console.log('✅ Marked as read:', notificationId);
      }
    } catch (err) {
      // console.error('❌ Mark as read failed:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!currentUserId) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';
      const res = await axios.patch(
        `${apiUrl}/notifications/user/${currentUserId}/read-all`
      );
      if (res.data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        // console.log('✅ All notifications marked as read');
      }
    } catch (err) {
      // console.error('❌ Mark all failed:', err);
    }
  };

  const deleteNotification = async (notificationId) => {
    if (!currentUserId) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';
      const res = await axios.delete(
        `${apiUrl}/notifications/${notificationId}`,
        { data: { userId: currentUserId } }
      );
      if (res.data.success) {
        setNotifications((prev) => {
          const removed = prev.find((n) => n.id === notificationId);
          if (removed && !removed.isRead) {
            setUnreadCount((c) => Math.max(0, c - 1));
          }
          return prev.filter((n) => n.id !== notificationId);
        });
        // console.log('🗑️ Notification deleted:', notificationId);
      }
    } catch (err) {
      // console.error('❌ Delete failed:', err);
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
    currentUserId,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;