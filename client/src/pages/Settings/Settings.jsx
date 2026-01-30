import React, { useState, useEffect } from 'react';
import { SERVER_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import ChatWithAdmin from './ChatWithAdmin';
import { 
  User, 
  Shield, 
  Bell, 
  Palette, 
  CreditCard, 
  FileText, 
  Camera, 
  Lock,
  Mail,
  LogOut,
  ChevronRight,
  Save,
  Loader2,
  FileCheck,
  Upload,
  AlertCircle,
  CheckCircle,
  XCircle,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';

const Settings = () => {
  const { user, login, logout } = useAuth();
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState('account');

  // Real-time KYC listener
  useEffect(() => {
    if (!socket || !user) return;

    socket.on('kyc-status-updated', (data) => {
      // console.log('⚡ Your KYC status was updated by admin:', data.status);
      const token = localStorage.getItem('token');
      // Update local storage and context
      const updatedUser = { 
        ...user, 
        kycStatus: data.status,
        isVerified: data.isVerified 
      };
      login(updatedUser, token);
      
      if (data.status === 'approved') {
        setSuccessMsg('KYC Approved! You can now post listings.');
      } else {
        setErrorMsg('KYC Rejected. Please check your documents.');
      }
    });

    return () => {
      socket.off('kyc-status-updated');
    };
  }, [socket, user, login]);
  const [pic, setPic] = useState(user?.profilePic || null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Profile Form Data
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: ''
  });

  // Password Change State
  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // KYC State
  const [kycFile, setKycFile] = useState(null);
  const [kycType, setKycType] = useState('citizenship');
  const [kycLoading, setKycLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.name || user.fullName || '', // Handle varied naming in backend vs frontend
        phone: user.phone || '',
        address: user.address || ''
      });
      // Handle profile pic url whether full or relative is returned
      if (user.profilePic) {
         setPic(user.profilePic.startsWith('http') ? user.profilePic : `${SERVER_BASE_URL}/uploads/profiles/${user.profilePic}`);
      } else if (user.profileImage) {
         setPic(user.profileImage.startsWith('http') ? user.profileImage : `${SERVER_BASE_URL}/uploads/profiles/${user.profileImage}`);
      }
    }
  }, [user]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const uploadData = new FormData();
    uploadData.append('profilePic', file);
    
    const objectUrl = URL.createObjectURL(file);
    setPic(objectUrl);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${SERVER_BASE_URL}/api/users/upload-photo`, { 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${token}` },
        body: uploadData 
      });
      if (res.ok) {
        const data = await res.json();
        // Update both profilePic and profileImage keys for compatibility
        login({ ...user, profilePic: data.photoUrl, profileImage: data.photoUrl.split('/').pop() }, token);
        setSuccessMsg('Profile picture updated!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) { 
      console.error("Upload failed", err);
      setErrorMsg('Failed to upload photo');
      // Revert needs previous state which is complex here, keeping optimistic for now or refetch
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${SERVER_BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        // Construct full user object with updates
        const newUser = {
           ...user,
           name: updatedUser.fullName || formData.fullName,
           fullName: updatedUser.fullName || formData.fullName,
           phone: updatedUser.phone || formData.phone,
           address: updatedUser.address || formData.address
        };
        login(newUser, token);
        setSuccessMsg('Profile updated successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const errData = await response.json();
        setErrorMsg(errData.message || 'Failed to update profile');
      }
    } catch (error) {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePassChange = (e) => {
    setPassData({ ...passData, [e.target.name]: e.target.value });
  };

  const handleChangePassword = async () => {
    setErrorMsg(''); setSuccessMsg('');
    if (passData.newPassword !== passData.confirmPassword) {
      return setErrorMsg('New passwords do not match');
    }
    if (passData.newPassword.length < 6) {
      return setErrorMsg('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${SERVER_BASE_URL}/api/users/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          currentPassword: passData.currentPassword,
          newPassword: passData.newPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Password changed successfully');
        setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setErrorMsg(data.error || 'Failed to change password');
      }
    } catch (err) {
      setErrorMsg('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleKycUpload = async (e) => {
    e.preventDefault();
    if (!kycFile) return setErrorMsg('Please select a document image');

    setKycLoading(true);
    const formData = new FormData();
    formData.append('kycDocument', kycFile);
    formData.append('documentType', kycType);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${SERVER_BASE_URL}/api/users/kyc-upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('KYC Document uploaded successfully! Pending Admin Approval.');
        // Update user context with new KYC status immediately
        const updatedUser = { ...user, kycStatus: 'pending', kycDocumentImage: data.kycDocumentImage };
        login(updatedUser, localStorage.getItem('token'));
        
        // Also force a reload of the page after a short delay to ensure all states are synced if context propagation fails
        // setTimeout(() => window.location.reload(), 1500);
        setKycFile(null);
      } else {
        setErrorMsg(data.error || 'Failed to upload document');
      }
    } catch (err) {
      setErrorMsg('Network error during upload');
    } finally {
      setKycLoading(false);
    }
  };

  const tabs = [
    { id: 'account', label: 'Account Profile', icon: User },
    { id: 'security', label: 'Security & Password', icon: Shield },
    { id: 'kyc', label: 'Document Verification', icon: FileCheck },
    { id: 'chat', label: 'Chat Request', icon: MessageSquare },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center bg-gradient-to-br from-[#eaf6fa] via-[#f4fbfd] to-[#d6eef5] p-6 rounded-2xl border border-blue-100 shadow-sm w-full relative overflow-hidden">
               {(successMsg || errorMsg) && activeTab === 'account' && (
                 <div className={`absolute top-0 left-0 w-full p-2 text-center text-xs font-bold ${successMsg ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                   {successMsg || errorMsg}
                 </div>
               )}
              <div className="relative group mt-4 md:mt-0">
                <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-3xl font-bold text-blue-600 shadow-lg border-4 border-white overflow-hidden">
                  {pic ? <img src={pic} alt="profile" className="w-full h-full object-cover" /> : (user?.name?.[0] || 'U')}
                </div>
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-blue-700 transition-colors z-10">
                  <Camera size={16} />
                  <input type="file" hidden onChange={handleUpload}/>
                </label>
              </div>
              <div className="flex-1 mt-2 md:mt-0 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2">
                   <h3 className="text-xl font-bold text-slate-900">{user?.name || user?.fullName || 'User'}</h3>
                   {user?.kycStatus === 'approved' && <Shield size={16} className="text-green-500 fill-green-100" />}
                </div>
                <p className="text-slate-500 text-sm font-medium capitalize">{user?.type || 'User'} Account • {user?.address || 'Location not set'}</p>
              </div>
              <button 
                onClick={handleSaveProfile}
                disabled={loading}
                className="px-6 py-3 bg-white text-blue-600 font-bold text-sm rounded-xl shadow-sm border border-blue-100 hover:bg-blue-50 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full p-4 bg-slate-50 border border-transparent focus:bg-white focus:border-blue-200 rounded-xl font-medium text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  value={user?.email || ''} 
                  readOnly 
                  className="w-full p-4 bg-slate-100 border-none rounded-xl font-medium text-slate-400 cursor-not-allowed select-none" 
                  title="Email cannot be changed"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                <input 
                  type="text" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+977-98XXXXXXXX" 
                  className="w-full p-4 bg-slate-50 border border-transparent focus:bg-white focus:border-blue-200 rounded-xl font-medium text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Address</label>
                <input 
                  type="text" 
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="City, Street" 
                  className="w-full p-4 bg-slate-50 border border-transparent focus:bg-white focus:border-blue-200 rounded-xl font-medium text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                />
              </div>
            </div>
          </div>
        );
      
      case 'security':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
             <div className="bg-white p-6 rounded-2xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Lock size={20} className="text-slate-400"/> Change Password</h3>
                {(successMsg || errorMsg) && activeTab === 'security' && (
                  <div className={`mb-4 p-3 rounded-xl text-sm font-bold ${successMsg ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {successMsg || errorMsg}
                  </div>
                )}
                <div className="space-y-4 max-w-md">
                   <div className="space-y-1">
                     <label className="text-xs font-bold text-slate-500 uppercase">Current Password</label>
                     <input type="password" name="currentPassword" value={passData.currentPassword} onChange={handlePassChange} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                   </div>
                   <div className="space-y-1">
                     <label className="text-xs font-bold text-slate-500 uppercase">New Password</label>
                     <input type="password" name="newPassword" value={passData.newPassword} onChange={handlePassChange} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                   </div>
                   <div className="space-y-1">
                     <label className="text-xs font-bold text-slate-500 uppercase">Confirm New Password</label>
                     <input type="password" name="confirmPassword" value={passData.confirmPassword} onChange={handlePassChange} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                   </div>
                   <button 
                     onClick={handleChangePassword}
                     disabled={loading}
                     className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
                   >
                     {loading ? 'Updating...' : 'Update Password'}
                   </button>
                </div>
             </div>
          </div>
        );

      case 'chat':
        return (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
             <ChatWithAdmin />
          </div>
        );

      case 'kyc':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
            <div className="bg-white p-6 rounded-2xl border border-slate-200">
               <div className="flex items-center justify-between mb-6">
                 <div>
                   <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><FileCheck size={20} className="text-indigo-500"/> KYC Verification</h3>
                   <p className="text-slate-500 text-sm mt-1">Verify your identity to unlock all features.</p>
                 </div>
                 {/* Status Badge */}
                 <div className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border ${
                   user?.kycStatus === 'approved' ? 'bg-green-50 text-green-700 border-green-100' :
                   user?.kycStatus === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                   user?.kycStatus === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                   'bg-slate-100 text-slate-600 border-slate-200'
                 }`}>
                   {user?.kycStatus === 'approved' && <CheckCircle size={16} />}
                   {user?.kycStatus === 'pending' && <Loader2 size={16} className="animate-spin" />}
                   {user?.kycStatus === 'rejected' && <XCircle size={16} />}
                   {user?.kycStatus === 'not_submitted' && <AlertCircle size={16} />}
                   <span className="uppercase">{user?.kycStatus?.replace('_', ' ') || 'NOT SUBMITTED'}</span>
                 </div>
               </div>
               
               {/* Content based on status */}
               {user?.kycStatus === 'approved' ? (
                 <div className="p-8 bg-green-50/50 rounded-xl border border-green-100 text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShieldCheck size={32} />
                    </div>
                    <h4 className="text-2xl font-bold text-green-800 mb-1">VERIFIED</h4>
                    <p className="text-green-600 font-medium text-sm">You are a verified owner.</p>
                    <p className="text-green-600 text-sm mt-2">You can now post listing ads and manage properties.</p>
                    {user?.kycDocumentImage && (
                        <div className="mt-6 border border-green-200 rounded-lg p-2 bg-white inline-block">
                           <p className="text-xs text-green-700 font-bold mb-2">Verified Document</p>
                           <img src={`${SERVER_BASE_URL}/uploads/profiles/${user.kycDocumentImage}`} alt="KYC Doc" className="h-32 rounded object-cover border border-slate-200" />
                        </div>
                    )}
                 </div>
               ) : user?.kycStatus === 'pending' ? (
                 <div className="p-8 bg-amber-50/50 rounded-xl border border-amber-100 text-center">
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Loader2 size={32} className="animate-spin" />
                    </div>
                    <h4 className="text-lg font-bold text-amber-800">Verification in Progress</h4>
                    <p className="text-amber-600 text-sm mt-2">Our team is reviewing your documents. This usually takes 24-48 hours.</p>
                    {/* Show preview if available locally or from server */}
                    <div className="mt-6 flex justify-center">
                        <div className="p-3 bg-white rounded-lg shadow-sm border border-amber-200">
                             <p className="text-xs text-amber-700 font-bold mb-2">Submitted Document</p>
                             {kycFile ? (
                                 <img src={URL.createObjectURL(kycFile)} alt="Preview" className="h-32 rounded object-cover" /> 
                             ) : user?.kycDocumentImage ? (
                                 <img src={`${SERVER_BASE_URL}/uploads/profiles/${user.kycDocumentImage}`} alt="Submitted Doc" className="h-32 rounded object-cover" />
                             ) : (
                                 <div className="h-32 w-48 bg-slate-100 rounded flex items-center justify-center text-slate-400 text-xs">No Preview</div>
                             )}
                        </div>
                    </div>
                 </div>
               ) : (
                 <form onSubmit={handleKycUpload} className="max-w-lg">
                    {(user?.kycStatus === 'rejected') && (
                      <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
                        <strong>Verification Rejected:</strong> Please upload a clearer document or check your details.
                      </div>
                    )}

                    <div className="space-y-4">
                       <div className="space-y-2">
                         <label className="text-sm font-bold text-slate-700">Document Type</label>
                         <select 
                           value={kycType} 
                           onChange={(e) => setKycType(e.target.value)} 
                           className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none"
                         >
                           <option value="citizenship">Citizenship Card</option>
                           <option value="license">Driving License</option>
                           <option value="passport">Passport</option>
                         </select>
                       </div>

                       <div className="space-y-2">
                         <label className="text-sm font-bold text-slate-700">Upload Document Image</label>
                         <div className="flex gap-4 items-start">
                             <div className="flex-1 border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors relative">
                               <input 
                                 type="file" 
                                 accept="image/*" 
                                 onChange={(e) => setKycFile(e.target.files[0])} 
                                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                               />
                               <div className="flex flex-col items-center gap-2 text-slate-500">
                                 <Upload size={32} />
                                 {kycFile ? (
                                   <span className="font-bold text-indigo-600">{kycFile.name}</span>
                                 ) : (
                                   <span>Click to upload or drag & drop</span>
                                 )}
                                 <p className="text-xs text-slate-400">JPG, PNG or PDF (Max 5MB)</p>
                               </div>
                             </div>
                             {/* Live Preview Side-by-Side */}
                             {kycFile && (
                                 <div className="w-32 h-32 border border-slate-200 rounded-xl overflow-hidden shadow-sm flex-shrink-0 bg-slate-50">
                                     <img src={URL.createObjectURL(kycFile)} alt="Preview" className="w-full h-full object-cover" />
                                 </div>
                             )}
                         </div>
                       </div>
                       
                       <button 
                         type="submit" 
                         disabled={kycLoading || !kycFile}
                         className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 disabled:opacity-50 disabled:shadow-none"
                       >
                         {kycLoading ? 'Uploading...' : 'Submit for Verification'}
                       </button>
                    </div>
                 </form>
               )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full p-4 md:p-8">
      {/* Settings Sidebar */}
      <div className="w-full lg:w-64 flex-shrink-0 space-y-2 lg:sticky lg:top-6 lg:self-start">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 px-2">Settings</h2>
        <div className="bg-white rounded-2xl border border-slate-100 p-2 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id 
                ? 'bg-blue-50 text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <tab.icon size={18} />
                {tab.label}
              </div>
              {activeTab === tab.id && <ChevronRight size={16} />}
            </button>
          ))}
          

        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white w-full min-w-0">
        <div className="w-full">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">{tabs.find(t => t.id === activeTab)?.label}</h2>
            <p className="text-slate-500 text-sm">Manage your personal information and preferences.</p>
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;