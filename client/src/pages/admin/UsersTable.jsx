import React, { useState, useEffect } from 'react';
import UserProfileModal from './UserProfileModal';
import API_BASE_URL from '../../config/api';
import axios from 'axios';

// Table for listing, searching, filtering, and managing users (customers + owners)
const UsersTable = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, [search, role, status]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (role && role !== 'all') params.append('role', role);
      if (status && status !== 'all') params.append('status', status);
      
      const response = await axios.get(`${API_BASE_URL}/admin/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockToggle = async (userId, currentActive) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_BASE_URL}/admin/users/${userId}/block`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        fetchUsers();
      }
    } catch (err) {
      console.error('Error toggling user block:', err);
      alert('Failed to update user status');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user');
    }
  };

  const handleResetPassword = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/admin/users/${userId}/reset-password`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        alert(`Temporary password: ${response.data.tempPassword}\n\nPlease save this and share it with the user.`);
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      alert('Failed to reset password');
    }
  };

  if (loading) return <div className="text-center py-8 text-gray-600">Loading users...</div>;

  return (
    <div className="bg-white rounded shadow p-4">
      <div className="flex flex-wrap gap-4 mb-4">
        <input className="border p-2 rounded flex-1" placeholder="Search by name, email, phone" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="border p-2 rounded" value={role} onChange={e => setRole(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="renter">Customer (Renter)</option>
          <option value="lessor">Lessor</option>
          <option value="owner">Owner</option>
          <option value="vendor">Vendor</option>
        </select>
        <select className="border p-2 rounded" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Phone</th>
              <th className="p-2 text-left">Role</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-500">No users found</td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="border-t hover:bg-gray-50">
                  <td className="p-2 cursor-pointer text-blue-600 underline" onClick={() => { setSelectedUser(user); setShowProfile(true); }}>{user.name}</td>
                  <td className="p-2">{user.email}</td>
                  <td className="p-2">{user.phone || 'N/A'}</td>
                  <td className="p-2 capitalize">{user.role}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs ${user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.active ? 'Active' : 'Blocked'}
                    </span>
                  </td>
                  <td className="p-2 flex gap-2">
                    <button className={`px-2 py-1 rounded text-xs ${user.active ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`} onClick={() => handleBlockToggle(user.id, user.active)}>{user.active ? 'Block' : 'Unblock'}</button>
                    <button className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-700 hover:bg-yellow-200" onClick={() => handleResetPassword(user.id)}>Reset Password</button>
                    <button className="px-2 py-1 rounded text-xs bg-gray-200 text-gray-700 hover:bg-gray-300" onClick={() => handleDelete(user.id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showProfile && selectedUser && (
        <UserProfileModal user={selectedUser} onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
};

export default UsersTable;
