import React from 'react';
import ModalPortal from './ModalPortal';

const NotificationModal = ({ open, onClose, notification }) => {
  if (!open || !notification) return null;
  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-fadeIn">
          <button
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
          <h2 className="text-2xl font-bold mb-2 text-gray-900 flex items-center gap-2">
            {notification.title}
            {notification.is_broadcast && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700">Broadcast</span>
            )}
          </h2>
          <div className="mb-4 text-gray-600 whitespace-pre-line">{notification.message}</div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-400">{notification.type?.toUpperCase() || 'INFO'}</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-400">{new Date(notification.created_at).toLocaleString()}</span>
          </div>
          {notification.metadata && (
            <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-500">
              <pre>{JSON.stringify(notification.metadata, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
};

export default NotificationModal;
