import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import {
  Bell,
  BellOff,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  X
} from 'lucide-react';
import './NotificationBell.css';
import ModalPortal from './ModalPortal';
import NotificationModal from './NotificationModal';

const NotificationBell = ({ user }) => {
  const {
    notifications,
    unreadCount,
    registerUser,
    markNotificationAsRead,
    markAllAsRead,
    deleteNotification,
    isConnected
  } = useSocket();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const bellButtonRef = useRef(null);
  const [bellPosition, setBellPosition] = useState(null);
  const [, setCurrentTime] = useState(Date.now());

  // Register user when component mounts - Stabilized
  useEffect(() => {
    if (user?.id) {
      registerUser({ userId: user.id, role: user.type || user.role });
    }
  }, [user?.id, user?.type, user?.role, registerUser]);

  // Update current time every minute for real-time relative timestamps
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        bellButtonRef.current &&
        !bellButtonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Track bell icon position for portal dropdown
  useEffect(() => {
    if (isOpen && bellButtonRef.current) {
      const rect = bellButtonRef.current.getBoundingClientRect();
      setBellPosition({
        top: rect.bottom + 10,
        left: rect.right - 380 > 16 ? rect.right - 380 : 16,
      });
    }
  }, [isOpen]);

  // Format timestamp to relative time
  const formatTime = (timestamp) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - notifTime) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } else {
      return notifTime.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: notifTime.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-yellow-500" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-500" />;
      case 'info':
      default:
        return <Info size={16} className="text-blue-500" />;
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markNotificationAsRead(notification.id);
    }
    setSelectedNotification(notification);
    setModalOpen(true);
    setIsOpen(false);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedNotification(null);
  };

  // Handle delete notification
  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation();
    setLoading(true);
    await deleteNotification(notificationId);
    setLoading(false);
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    setLoading(true);
    await markAllAsRead();
    setLoading(false);
  };

  // Toggle dropdown
  const toggleDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // console.log('🔔 Bell clicked! Current state:', isOpen, '-> New state:', !isOpen);
    setIsOpen(!isOpen);
  };

  return (
    <div className="notification-bell-container">
      {/* Bell Icon */}
      <button
        className={`notification-bell-button ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={toggleDropdown}
        type="button"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        style={{ cursor: 'pointer' }}
        ref={bellButtonRef}
      >
        <Bell size={20} className="bell-icon" />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
        <span 
          className={`connection-indicator ${isConnected ? '' : 'offline'}`} 
          title={isConnected ? 'Connected' : 'Disconnected'}
        ></span>
      </button>

      {/* Dropdown rendered in portal */}
      {isOpen && bellPosition && (
        <ModalPortal>
          <div
            className="notification-dropdown"
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: bellPosition.top,
              left: bellPosition.left,
              width: 'min(380px, 90vw)',
              zIndex: 99999,
            }}
          >
            {/* Header */}
            <div className="notification-header">
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <button
                  className="mark-all-read-btn"
                  onClick={handleMarkAllAsRead}
                  disabled={loading}
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="notification-empty">
                  <BellOff size={48} className="empty-icon text-gray-400" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.is_read ? 'unread' : ''} ${
                      notification.is_broadcast ? 'broadcast' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="notification-content">
                      <div className="notification-title">
                        {notification.title}
                        {notification.is_broadcast && (
                          <span className="broadcast-badge">Broadcast</span>
                        )}
                      </div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-time">{formatTime(notification.created_at)}</div>
                    </div>
                    <button
                      className="notification-delete-btn"
                      onClick={(e) => handleDeleteNotification(e, notification.id)}
                      disabled={loading}
                      aria-label="Delete notification"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="notification-footer">
                <span className="notification-count">
                  {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </ModalPortal>
      )}

      {/* Notification Details Modal */}
      <NotificationModal open={modalOpen} onClose={handleCloseModal} notification={selectedNotification} />
    </div>
  );
};

export default NotificationBell;
