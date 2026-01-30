import React, { useState, useEffect, useCallback } from 'react';
import UserProfileModal from './UserProfileModal';
import API_BASE_URL from '../../config/api';
import axios from 'axios';
import { Lock, Unlock, Trash2, Key, Eye, FileCheck } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

const UsersTable = ({ initialKycFilter = 'all', initialRoleFilter = 'all' }) => {
  const { socket } = useSocket();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  // Determine fixed modes
  const isKycMode = initialKycFilter === 'pending';
  const isSpecificRoleMode = initialRoleFilter !== 'all';

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      // Enforce filters based on the tab context (props)
      if (initialRoleFilter !== 'all') params.append('role', initialRoleFilter);
      if (initialKycFilter !== 'all') params.append('kycStatus', initialKycFilter); // This handles 'pending' for KYC tab
      
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
  }, [initialRoleFilter, initialKycFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Real-time listener
  useEffect(() => {
    if (!socket) return;
    
    socket.on('kyc-submitted', (data) => {
      fetchUsers();
    });

    socket.on('user-registered', (data) => {
      // Refresh if the new user matches our current view filter
      if (initialRoleFilter === 'all' || initialRoleFilter === data.type) {
        fetchUsers();
      }
    });

    return () => {
      socket.off('kyc-submitted');
      socket.off('user-registered');
    };
  }, [socket, fetchUsers, initialRoleFilter]);

  useEffect(() => {
    if (selectedUser) {
      const updatedUser = users.find(u => u.id === selectedUser.id);
      if (updatedUser) {
        setSelectedUser(updatedUser);
      }
    }
  }, [users, selectedUser]);

  const handleBlockToggle = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_BASE_URL}/admin/users/${userId}/block`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) fetchUsers();
    } catch (err) {
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
      alert('Failed to reset password');
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-400 font-bold animate-pulse">Loading database...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      {/* Search and Filters REMOVED as requested */}
      
      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-100">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs tracking-wider">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">KYC</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium">
                   {isKycMode ? 'No pending KYC requests found.' : 'No users found.'}
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                           {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                           <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => { setSelectedUser(user); setShowProfile(true); }}>{user.name}</p>
                           <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                        user.role === 'owner' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                     }`}>
                        {user.role}
                     </span>
                  </td>
                  <td className="px-6 py-4">
                     {user.active ? 
                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active</span> : 
                        <span className="flex items-center gap-1.5 text-xs font-bold text-red-600"><span className="w-2 h-2 rounded-full bg-red-500"></span> Blocked</span>
                     }
                  </td>
                  <td className="px-6 py-4">
                      {user.kyc_status === 'approved' && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-50 text-green-700 border border-green-100">Verified</span>}
                      {user.kyc_status === 'pending' && (
                        <button 
                          onClick={() => { setSelectedUser(user); setShowProfile(true); }}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 animate-pulse hover:bg-amber-200 transition-colors shadow-sm"
                        >
                          <FileCheck size={12} /> Review
                        </button>
                      )}
                      {user.kyc_status === 'rejected' && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-50 text-red-700 border border-red-100">Rejected</span>}
                      {(!user.kyc_status || user.kyc_status === 'not_submitted') && <span className="text-xs text-slate-400 font-medium">Not Submitted</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        onClick={() => { setSelectedUser(user); setShowProfile(true); }}
                        title="View Profile"
                      >
                        <Eye size={18} />
                      </button>
                      
                      {/* Show actions only for non-KYC mode? Or always? User said "from there i can access and denied like blocked their login". This implies blocking capability needs to be here. */}
                      {!isKycMode && (
                        <>
                           <div className="w-px h-6 bg-slate-200 mx-1 self-center"></div>

                           <button 
                             className={`p-2 rounded-lg transition-colors ${user.active ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-400 hover:text-green-600 hover:bg-green-50'}`} 
                             onClick={() => handleBlockToggle(user.id)}
                             title={user.active ? 'Block User' : 'Unblock User'}
                           >
                             {user.active ? <Lock size={18} /> : <Unlock size={18} />}
                           </button>
                           <button 
                             className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors" 
                             onClick={() => handleResetPassword(user.id)}
                             title="Reset Password"
                           >
                             <Key size={18} />
                           </button>
                           <button 
                             className="p-2 rounded-lg text-slate-400 hover:text-red-900 hover:bg-red-50 transition-colors" 
                             onClick={() => handleDelete(user.id)}
                             title="Delete User"
                           >
                             <Trash2 size={18} />
                           </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showProfile && selectedUser && (
        <UserProfileModal 
           user={selectedUser} 
           onClose={() => setShowProfile(false)} 
           onUpdate={fetchUsers} 
        />
      )}
    </div>
  );
};

export default UsersTable;
