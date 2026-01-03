import React, { useState, useEffect } from 'react';
import './DashboardNotifications.css';

const DashboardNotifications = ({ notifications, onRemove }) => {
  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="dashboard-notifications">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification-toast ${notification.type}`}
        >
          <div className="notification-icon">
            {notification.type === 'success' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            {notification.type === 'error' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            )}
            {notification.type === 'info' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            )}
          </div>
          <div className="notification-content">
            <h4>{notification.title}</h4>
            {notification.message && <p>{notification.message}</p>}
          </div>
          <button
            className="notification-close"
            onClick={() => onRemove(notification.id)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};

export default DashboardNotifications;