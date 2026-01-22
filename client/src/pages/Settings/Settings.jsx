import React, { useState } from 'react';
import './Settings.css';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('account');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [pic, setPic] = useState(null);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('profilePic', file);
    try {
      const res = await fetch('http://localhost:5001/api/users/upload-photo', { method: 'POST', body: formData });
      const data = await res.json();
      setPic(data.photoUrl);
    } catch (err) { console.error("Upload failed"); }
  };

  return (
    <div className={`pro-settings-bg ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="pro-settings-container">
        
        <aside className="pro-sidebar">
          <div className="brand">RentHive</div>
          <nav>
            <button className={activeTab === 'account' ? 'active' : ''} onClick={() => setActiveTab('account')}>👤 Account</button>
            <button className={activeTab === 'security' ? 'active' : ''} onClick={() => setActiveTab('security')}>🔐 Security</button>
            <button className={activeTab === 'notif' ? 'active' : ''} onClick={() => setActiveTab('notif')}>🔔 Notifications</button>
            <button className={activeTab === 'appearance' ? 'active' : ''} onClick={() => setActiveTab('appearance')}>🎨 Appearance</button>
            <button className={activeTab === 'billing' ? 'active' : ''} onClick={() => setActiveTab('billing')}>💳 Billing</button>
            <button className={activeTab === 'activity' ? 'active' : ''} onClick={() => setActiveTab('activity')}>📜 Activity Log</button>
          </nav>
        </aside>

        
        <main className="pro-main">
          {activeTab === 'account' && (
            <div className="tab-panel animate-in">
              <h2>Account Settings</h2>
              <div className="profile-hero">
                <div className="avatar-lg">
                  {pic ? <img src={pic} alt="profile" /> : <div className="letter"></div>}
                  <label className="upload-icon">📷<input type="file" hidden onChange={handleUpload}/></label>
                </div>
                <div className="hero-text"><h3>Achyut</h3><p>Lessor Account • Kathmandu</p></div>
              </div>
              <div className="form-layout">
                <div className="input-group"><label>Full Name</label><input type="text" defaultValue="Achyut" /></div>
                <div className="input-group"><label>Email Address</label><input type="email" defaultValue="achyut@renthive.com" /></div>
              </div>
              <button className="btn-primary">Update Profile</button>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="tab-panel animate-in">
              <h2>Appearance</h2>
              <div className="feature-card theme-toggle">
                <div className="info">
                  <h4>Dark Mode</h4>
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
                <div className="info"><h4>Email Updates</h4><p>Receive rental booking alerts.</p></div>
                <input type="checkbox" defaultChecked />
              </div>
              <div className="feature-card">
                <div className="info"><h4>SMS Alerts</h4><p>Urgent property messages.</p></div>
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
                <div className="info"><h4>Password</h4><p>Last changed 3 months ago</p></div>
                <button className="btn-small">Update</button>
              </div>
            </div>
          )}

          
          {activeTab === 'activity' && (
            <div className="tab-panel animate-in">
              <h2>Login Activity</h2>
              <ul className="activity-list">
                <li>🟢 Currently active in Kathmandu, Nepal</li>
                <li>⚪ Logged in via Chrome (Windows) - 2 hours ago</li>
              </ul>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Settings;