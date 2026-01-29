import React, { useState } from 'react';
import './Profile.css'; 
import defaultProfileImage from '../assets/profile.jpg'; 
import { Mail, Edit, Camera, Plus, User, MapPin, Phone, Globe, Languages } from 'lucide-react';

const ProfileSettings = () => {
    const [profileData, setProfileData] = useState({
        FirstName: 'Ram Parsad',
        SurName: 'Yadav',
        gender: 'Male',
        country: 'Nepal',
        language: 'English (US)',
        email: 'ram2436@gmail.com',
        profileImageUrl: defaultProfileImage, 
        address: 'Kathmandu, Bagmati Province', 
        phone: '+977-9800000000', 
    });
    



    const handleProfileChange = (e) => {
        const { id, value } = e.target;
        setProfileData(prevData => ({
            ...prevData,
            [id]: value,
        }));
    };



    const handleProfileSubmit = (e) => {
        e.preventDefault();
        // console.log('Submitting Profile Data:', profileData);
        alert('Profile Data Submission Simulated. Check console.');
    };



    return (
        <div className="profile-page-container">
            <div className="profile-banner"></div>

            <div className="profile-card-content">
                <div className="profile-header">
                    <div className="profile-info-block">
                        <img src={profileData.profileImageUrl} alt="Profile" className="profile-picture" />
                        <div>
                            <h2 className="user-name">{`${profileData.FirstName} ${profileData.SurName}`}</h2>
                            <p className="user-email-header flex items-center gap-2">
                                <Mail size={16} /> {profileData.email}
                            </p>
                        </div>
                    </div>
                    <div className="profile-actions">
                        <button className="btn btn-primary edit-profile-btn flex items-center gap-2" onClick={handleProfileSubmit}>
                            <Edit size={16} /> Edit Profile
                        </button>
                        <button className="btn btn-secondary upload-photo-btn flex items-center gap-2">
                            <Camera size={16} /> Upload New Photo
                        </button>
                    </div>
                </div>

                <form className="profile-form-grid" onSubmit={handleProfileSubmit}>
                    
                    
                    <div className="form-group">
                        <label htmlFor="FirstName" className="flex items-center gap-2"><User size={14} /> First Name</label>
                        <input type="text" id="FirstName" value={profileData.FirstName} onChange={handleProfileChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="SurName" className="flex items-center gap-2"><User size={14} /> SurName</label>
                        <input type="text" id="SurName" value={profileData.SurName} onChange={handleProfileChange} />
                    </div>

                    
                    <div className="form-group">
                        <label htmlFor="gender">Gender</label>
                        <select id="gender" value={profileData.gender} onChange={handleProfileChange}>
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="country" className="flex items-center gap-2"><Globe size={14} /> Country</label>
                        <select id="country" value={profileData.country} onChange={handleProfileChange}>
                            <option>Select Country</option>
                            <option>Nepal</option>
                        </select>
                    </div>
                    
                    
                    <div className="form-group">
                        <label htmlFor="language" className="flex items-center gap-2"><Languages size={14} /> Language</label>
                        <select id="language" value={profileData.language} onChange={handleProfileChange}>
                            <option>English (US)</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="phone" className="flex items-center gap-2"><Phone size={14} /> Phone Number</label>
                        <input type="tel" id="phone" value={profileData.phone} onChange={handleProfileChange} />
                    </div>

                    
                    <div className="form-group full-width-group">
                        <label htmlFor="address" className="flex items-center gap-2"><MapPin size={14} /> Address</label>
                        <input type="text" id="address" value={profileData.address} onChange={handleProfileChange} />
                    </div>

                </form>
                
                <div className="settings-grid">
                    <div className="email-settings">
                        <h3>My Email Address</h3>
                        <div className="current-email-info">
                            <span className="email-icon"><Mail size={24} className="text-blue-500" /></span>
                            <p className="email-address">{profileData.email}</p>
                            <small>1 month ago</small>
                        </div>
                        <button className="btn btn-link flex items-center gap-1">
                            <Plus size={16} /> Add Email Address
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettings;