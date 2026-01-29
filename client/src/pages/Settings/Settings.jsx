import React, { useState } from 'react';
import './Settings.css';
import { SERVER_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { 
  User, 
  Shield, 
  Bell, 
  Palette, 
  CreditCard, 
  FileText, 
  Camera, 
  Moon, 
  Sun, 
  MapPin, 
  Activity, 
  Smartphone, 
  Mail,
  Lock,
  Globe
} from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [pic, setPic] = useState(user?.profilePic || null);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('profilePic', file);
    try {
      const res = await fetch(`${SERVER_BASE_URL}/api/users/upload-photo`, { method: 'POST', body: formData });
      const data = await res.json();
      setPic(data.photoUrl);
    } catch (err) { /* console.error("Upload failed"); */ }
  };

  return (
    <div className={`pro-settings-bg ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="pro-settings-container">
        
        <aside className="pro-sidebar">
          <div className="brand">RentHive</div>
          <nav>
            <button className={activeTab === 'account' ? 'active' : ''} onClick={() => setActiveTab('account')}>
              <User size={18} /> Account
            </button>
            <button className={activeTab === 'security' ? 'active' : ''} onClick={() => setActiveTab('security')}>
              <Shield size={18} /> Security
            </button>
            <button className={activeTab === 'notif' ? 'active' : ''} onClick={() => setActiveTab('notif')}>
              <Bell size={18} /> Notifications
            </button>
            <button className={activeTab === 'appearance' ? 'active' : ''} onClick={() => setActiveTab('appearance')}>
              <Palette size={18} /> Appearance
            </button>
            <button className={activeTab === 'billing' ? 'active' : ''} onClick={() => setActiveTab('billing')}>
              <CreditCard size={18} /> Billing
            </button>
            <button className={activeTab === 'activity' ? 'active' : ''} onClick={() => setActiveTab('activity')}>
              <FileText size={18} /> Activity Log
            </button>
          </nav>
        </aside>
        
        <main className="pro-main">
          {activeTab === 'account' && (
            <div className="tab-panel animate-in">
              <h2>Account Settings</h2>
              <div className="profile-hero">
                <div className="avatar-lg">
                  {pic ? <img src={pic} alt="profile" /> : <div className="letter">{user?.fullName?.[0] || 'U'}</div>}
                  <label className="upload-icon">
                    <Camera size={16} />
                    <input type="file" hidden onChange={handleUpload}/>
                  </label>
                </div>
                <div className="hero-text">
                  <h3>{user?.fullName || 'User'}</h3>
                  <p>{user?.role === 'vendor' ? 'Owner Account' : 'Tenant Account'} • {user?.address || 'Nepal'}</p>
                </div>
              </div>
              <div className="form-layout">
                <div className="input-group">
                  <label>Full Name</label>
                  <input type="text" defaultValue={user?.fullName || ''} />
                </div>
                <div className="input-group">
                  <label>Email Address</label>
                  <input type="email" defaultValue={user?.email || ''} readOnly />
                </div>
                <div className="input-group">
                  <label>Phone Number</label>
                  <input type="text" defaultValue={user?.phone || ''} placeholder="+977-98XXXXXXXX" />
                </div>
                <div className="input-group">
                  <label>Address</label>
                  <input type="text" defaultValue={user?.address || ''} placeholder="City, Street" />
                </div>
                <div className="input-group">
                  <label>Citizenship / ID Number</label>
                  <input type="text" defaultValue={user?.citizenshipNumber || user?.idNumber || ''} placeholder="Citizenship No." />
                </div>
                {user?.role === 'vendor' && (
                  <>
                    <div className="input-group">
                      <label>Business Name</label>
                      <input type="text" defaultValue={user?.businessName || ''} placeholder="Company Name" />
                    </div>
                    <div className="input-group">
                      <label>Ownership Type</label>
                      <input type="text" defaultValue={user?.ownershipType || ''} placeholder="Individual / Company" />
                    </div>
                  </>
                )}
              </div>
              <button className="btn-primary">Update Profile</button>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="tab-panel animate-in">
              <h2>Appearance</h2>
              <div className="feature-card theme-toggle">
                <div className="info">
                  <div className="flex items-center gap-2 mb-1">
                    {isDarkMode ? <Moon size={20} className="text-purple-400" /> : <Sun size={20} className="text-orange-400" />}
                    <h4>Dark Mode</h4>
                  </div>
                  <p>Switch between light and dark themes for better eye comfort.</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={isDarkMode} onChange={toggleTheme} />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'notif' && (
            <div className="tab-panel animate-in">
              <h2>Notification Preferences</h2>
              <div className="feature-card">
                <div className="info">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail size={18} className="text-gray-500" />
                    <h4>Email Updates</h4>
                  </div>
                  <p>Receive rental booking alerts.</p>
                </div>
                <input type="checkbox" defaultChecked />
              </div>
              <div className="feature-card">
                <div className="info">
                  <div className="flex items-center gap-2 mb-1">
                    <Smartphone size={18} className="text-gray-500" />
                    <h4>SMS Alerts</h4>
                  </div>
                  <p>Urgent property messages.</p>
                </div>
                <input type="checkbox" />
              </div>
            </div>
          )}

          
          {activeTab === 'billing' && (
            <div className="tab-panel animate-in">
              <h2>Billing & Plan</h2>
              <div className="billing-box">
                <div className="card-info"><span>VISA •••• 4242</span><span>Expires 12/26</span></div>
                <button className="btn-small">Edit</button>
              </div>
              <button className="btn-outline">+ Add Method</button>
            </div>
          )}
          
          
          {activeTab === 'security' && (
            <div className="tab-panel animate-in">
              <h2>Security</h2>
              <div className="feature-card">
                <div className="info">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock size={18} className="text-gray-500" />
                    <h4>Password</h4>
                  </div>
                  <p>Last changed 3 months ago</p>
                </div>
                <button className="btn-small">Update</button>
              </div>
            </div>
          )}

          
          {activeTab === 'activity' && (
            <div className="tab-panel animate-in">
              <h2>Login Activity</h2>
              <ul className="activity-list">
                <li className="flex items-center gap-3">
                  <Activity size={16} className="text-green-500" />
                  <span>Currently active in Kathmandu, Nepal</span>
                </li>
                <li className="flex items-center gap-3">
                  <Globe size={16} className="text-gray-400" />
                  <span>Logged in via Chrome (Windows) - 2 hours ago</span>
                </li>
              </ul>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Settings;