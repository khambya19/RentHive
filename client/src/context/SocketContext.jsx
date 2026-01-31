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
import API_BASE_URL, { SERVER_BASE_URL } from '../config/api';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user: authUser } = useAuth();
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Sync currentUser with authUser - STABILIZED to prevent loops
  useEffect(() => {
    if (authUser?.id) {
      // Only update if the ID or Role has actually changed to prevent provider loops
      setCurrentUser(prev => {
        if (prev?.id === authUser.id && prev?.role === (authUser.role || authUser.type)) {
          return prev;
        }
        return { id: authUser.id, role: authUser.role || authUser.type };
      });
    } else {
      setCurrentUser(null);
    }
  }, [authUser?.id, authUser?.role, authUser?.type]);

  // Initialize socket once
  useEffect(() => {
    const url = SERVER_BASE_URL;
    const socketInstance = io(url, {
      transports: ['polling', 'websocket'],
      upgrade: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      timeout: 20000,
      autoConnect: true,
    });

    socketRef.current = socketInstance;
    window.socket = socketInstance;
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('connect_error', () => {
      setIsConnected(false);
    });

    // Real-time new notification
    socketInstance.on('new-notification', (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
        });
      }
    });

    return () => {
      // Don't disconnect in development StrictMode
      // Socket will persist across component remounts
    };
  }, []);

  useEffect(() => {
    if (!currentUser?.id || !socket || !isConnected) return;
    socket.emit('register', { userId: currentUser.id, role: currentUser.role });
    fetchUserNotifications(currentUser.id);
  }, [currentUser, socket, isConnected]);

  async function fetchUserNotifications(userId) {
    if (!userId) return;
    try {
      const res = await axios.get(
        `${API_BASE_URL}/notifications/user/${userId}`
      );
      if (res.data.success) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }

  const registerUser = useCallback((userId) => {
    if (!userId) return;
    // Update currentUser which triggers the registration useEffect
    setCurrentUser(prev => prev?.id === userId ? prev : { id: userId, role: authUser?.role || 'user' });
  }, [authUser?.role]);

  async function markNotificationAsRead(notificationId) {
    if (!currentUser?.id) return;
    try {
      const res = await axios.patch(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        { userId: currentUser.id }
      );
      if (res.data.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId
              ? { ...n, is_read: true }
              : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Mark as read failed:', err);
    }
  }

  async function markAllAsRead() {
    if (!currentUser?.id) return;
    try {
      const res = await axios.patch(
        `${API_BASE_URL}/notifications/user/${currentUser.id}/read-all`
      );
      if (res.data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Mark all failed:', err);
    }
  }

  async function deleteNotification(notificationId) {
    if (!currentUser?.id) return;
    try {
      const res = await axios.delete(
        `${API_BASE_URL}/notifications/${notificationId}`,
        { data: { userId: currentUser.id } }
      );
      if (res.data.success) {
        setNotifications((prev) => {
          const removed = prev.find((n) => n.id === notificationId);
          if (removed && !removed.is_read) {
            setUnreadCount((c) => Math.max(0, c - 1));
          }
          return prev.filter((n) => n.id !== notificationId);
        });
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }

  const value = {
    socket,
    isConnected,
    notifications,
    unreadCount,
    registerUser,
    markNotificationAsRead,
    markAllAsRead,
    deleteNotification,
    currentUserId: currentUser?.id,
    currentUser,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;