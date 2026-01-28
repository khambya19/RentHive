import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../config/api';

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
      const response = await axios.get(`${API_BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      alert('Title and message are required');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (notificationType === 'broadcast') {
        // Send broadcast notification to everyone
        const response = await axios.post(
          `${API_BASE_URL}/notifications/broadcast`,
          { title, message, type, link },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.success) {
          alert('Broadcast notification sent to all users!');
          setSentNotifications([...sentNotifications, { 
            ...response.data.data, 
            recipient: 'All Users',
            sentAt: new Date()
          }]);
          resetForm();
        }
      } else if (notificationType === 'specific') {
        // Send to specific user
        if (!specificUser) {
          alert('Please select a user');
          return;
        }
        
        const response = await axios.post(
          `${API_BASE_URL}/notifications/user`,
          { userId: specificUser, title, message, type, link },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.success) {
          const selectedUserObj = users.find(u => u.id === parseInt(specificUser));
          alert(`Notification sent to ${selectedUserObj?.name || 'user'}!`);
          setSentNotifications([...sentNotifications, { 
            ...response.data.data, 
            recipient: selectedUserObj?.name,
            sentAt: new Date()
          }]);
          resetForm();
        }
      } else if (notificationType === 'bulk') {
        // Send to multiple users by type (renter/owner/lessor/vendor)
        const response = await axios.post(
          `${API_BASE_URL}/admin/notifications/bulk`,
          { recipientType, title, message, type, link },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.success) {
          alert(`Notification sent to all ${recipientType}s!`);
          setSentNotifications([...sentNotifications, { 
            title, 
            message,
            recipient: `All ${recipientType}s`,
            sentAt: new Date()
          }]);
          resetForm();
        }
      }
    } catch (err) {
      console.error('Error sending notification:', err);
      alert('Failed to send notification: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
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
    <div className="admin-notifications">
      {/* Send Notification Form */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Send Notification</h2>
        
        <form onSubmit={handleSendNotification}>
          {/* Notification Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notification Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="broadcast"
                  checked={notificationType === 'broadcast'}
                  onChange={(e) => setNotificationType(e.target.value)}
                  className="mr-2"
                />
                Broadcast (All Users)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="bulk"
                  checked={notificationType === 'bulk'}
                  onChange={(e) => setNotificationType(e.target.value)}
                  className="mr-2"
                />
                By User Type
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="specific"
                  checked={notificationType === 'specific'}
                  onChange={(e) => setNotificationType(e.target.value)}
                  className="mr-2"
                />
                Specific User
              </label>
            </div>
          </div>

          {/* Recipient Type (for bulk) */}
          {notificationType === 'bulk' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Type
              </label>
              <select
                value={recipientType}
                onChange={(e) => setRecipientType(e.target.value)}
                className="w-full border border-gray-300 rounded p-2"
              >
                <option value="renter">All Renters (Customers)</option>
                <option value="lessor">All Lessors</option>
                <option value="owner">All Owners</option>
                <option value="vendor">All Vendors</option>
              </select>
            </div>
          )}

          {/* Specific User Selection */}
          {notificationType === 'specific' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select User
              </label>
              <select
                value={specificUser}
                onChange={(e) => setSpecificUser(e.target.value)}
                className="w-full border border-gray-300 rounded p-2"
              >
                <option value="">Choose a user...</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email}) - {user.role}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notification Type (info/success/warning/error) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border border-gray-300 rounded p-2"
            >
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter notification title"
              className="w-full border border-gray-300 rounded p-2"
              required
            />
          </div>

          {/* Message */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter notification message"
              className="w-full border border-gray-300 rounded p-2 h-24"
              required
            />
          </div>

          {/* Link (optional) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link (Optional)
            </label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="/dashboard or https://example.com"
              className="w-full border border-gray-300 rounded p-2"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 px-4 rounded hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Notification'}
          </button>
        </form>
      </div>

      {/* Recently Sent Notifications */}
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Recently Sent</h2>
        {sentNotifications.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No notifications sent yet</p>
        ) : (
          <div className="space-y-3">
            {sentNotifications.reverse().slice(0, 10).map((notif, idx) => (
              <div key={idx} className="border-l-4 border-purple-500 bg-gray-50 p-3 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-800">{notif.title}</h3>
                    <p className="text-sm text-gray-600">{notif.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      To: <span className="font-medium">{notif.recipient}</span>
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    notif.type === 'info' ? 'bg-blue-100 text-blue-700' :
                    notif.type === 'success' ? 'bg-green-100 text-green-700' :
                    notif.type === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {notif.type}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(notif.sentAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;
