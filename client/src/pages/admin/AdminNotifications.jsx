import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../config/api';
import {
  Bell,
  Users,
  User,
  Layers,
  Info,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Link as LinkIcon,
  Type,
  Send,
  FileText,
} from 'lucide-react';

const AdminNotifications = () => {
  const [notificationType, setNotificationType] = useState('broadcast');
  const [recipientType, setRecipientType] = useState('all');
  const [specificUser, setSpecificUser] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [link, setLink] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sentNotifications, setSentNotifications] = useState([]);

  useEffect(() => {
    if (notificationType === 'specific') {
      fetchUsers();
    }
  }, [notificationType]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setUsers(response.data.users || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      alert('Title and message are required.');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No auth token');

      let response;
      let recipientDisplay = '';

      if (notificationType === 'broadcast') {
        response = await axios.post(
          `${API_BASE_URL}/notifications/broadcast`,
          { title, message, type, link },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        recipientDisplay = 'All Users';
      } else if (notificationType === 'specific') {
        if (!specificUser) {
          alert('Please select a user');
          return;
        }
        response = await axios.post(
          `${API_BASE_URL}/notifications/user`,
          { userId: specificUser, title, message, type, link },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const selected = users.find((u) => u.id === parseInt(specificUser));
        recipientDisplay = selected ? selected.name || selected.email : 'User';
      } else if (notificationType === 'bulk') {
        response = await axios.post(
          `${API_BASE_URL}/admin/notifications/bulk`,
          { recipientType, title, message, type, link },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        recipientDisplay = `All ${recipientType}s`;
      }

      if (response?.data?.success) {
        alert(`Sent to ${recipientDisplay}!`);
        setSentNotifications([
          {
            ...response.data.data,
            title,
            message,
            type,
            recipient: recipientDisplay,
            sentAt: new Date().toISOString(),
          },
          ...sentNotifications,
        ]);
        resetForm();
      }
    } catch (err) {
      console.error(err);
      alert('Failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getIconForType = (msgType) => {
    switch (msgType) {
      case 'success': return <CheckCircle size={16} className="text-green-600" />;
      case 'warning': return <AlertTriangle size={16} className="text-yellow-600" />;
      case 'error':   return <AlertCircle   size={16} className="text-red-600" />;
      default:        return <Info         size={16} className="text-blue-600" />;
    }
  };

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setLink('');
    setSpecificUser('');
    setType('info');
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-cyan-50 to-blue-50 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Send Form Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-10">
          <div className="bg-linear-to-r from-purple-600 to-indigo-600 px-6 py-5">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <Bell size={24} />
              Send Notification
            </h2>
          </div>

          <div className="p-6 lg:p-8">
            <form onSubmit={handleSendNotification} className="space-y-6">
              {/* Notification Type */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Layers size={16} className="text-purple-600" />
                  Notification Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { value: 'broadcast', label: 'Broadcast (All)' },
                    { value: 'bulk',      label: 'By User Type' },
                    { value: 'specific',  label: 'Specific User' },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`
                        flex items-center justify-center p-4 border rounded-lg cursor-pointer text-center transition-all text-sm font-medium
                        ${notificationType === opt.value
                          ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-200 text-purple-800'
                          : 'border-gray-300 hover:bg-gray-50 text-gray-700'}
                      `}
                    >
                      <input
                        type="radio"
                        value={opt.value}
                        checked={notificationType === opt.value}
                        onChange={(e) => setNotificationType(e.target.value)}
                        className="sr-only"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Bulk recipient */}
              {notificationType === 'bulk' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Users size={16} className="text-purple-600" />
                    Recipient Group
                  </label>
                  <select
                    value={recipientType}
                    onChange={(e) => setRecipientType(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="user">All Users</option>
                    <option value="owner">All Owners</option>
                  </select>
                </div>
              )}

              {/* Specific user */}
              {notificationType === 'specific' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <User size={16} className="text-purple-600" />
                    Select User
                  </label>
                  <select
                    value={specificUser}
                    onChange={(e) => setSpecificUser(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">— Select user —</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || '—'} ({user.email}) — {user.role || 'user'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Message Type */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Info size={16} className="text-purple-600" />
                  Message Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Type size={16} className="text-purple-600" />
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Notification title"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FileText size={16} className="text-purple-600" />
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your message here..."
                  rows={5}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>

              {/* Link */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <LinkIcon size={16} className="text-purple-600" />
                  Link (optional)
                </label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://example.com or /path"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className={`
                  w-full bg-linear-to-r from-purple-600 to-indigo-600 
                  text-white font-semibold py-3 px-6 rounded-lg shadow-sm
                  hover:from-purple-700 hover:to-indigo-700 
                  disabled:opacity-60 disabled:cursor-not-allowed
                  transition-all flex items-center justify-center gap-2
                `}
              >
                {loading ? 'Sending...' : <> <Send size={18} /> Send Notification </>}
              </button>
            </form>
          </div>
        </div>

        {/* Sent Notifications */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-5 border-b">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
              <Bell size={20} className="text-purple-600" />
              Recently Sent
            </h2>
          </div>

          <div className="p-6 lg:p-8">
            {sentNotifications.length === 0 ? (
              <div className="text-center py-16 text-gray-500 italic">
                No notifications sent yet.
              </div>
            ) : (
              <div className="space-y-5">
                {sentNotifications.slice(0, 10).map((notif, idx) => (
                  <div
                    key={idx}
                    className="border-l-4 border-purple-500 bg-gray-50 p-5 rounded-lg hover:bg-gray-100/80 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{notif.title}</h3>
                        <p className="text-gray-700 mt-1">{notif.message}</p>
                        <p className="text-sm text-gray-600 mt-2">
                          To: <span className="font-medium">{notif.recipient}</span>
                        </p>
                      </div>

                      <div
                        className={`
                          inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
                          ${
                            notif.type === 'info' ? 'bg-blue-100 text-blue-700' :
                            notif.type === 'success' ? 'bg-green-100 text-green-700' :
                            notif.type === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }
                        `}
                      >
                        {getIconForType(notif.type)}
                        {notif.type.charAt(0).toUpperCase() + notif.type.slice(1)}
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 mt-3">
                      {new Date(notif.sentAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;