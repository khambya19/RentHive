import React from 'react';

// Modal for viewing user profile/details
const UserProfileModal = ({ user, onClose }) => {
  if (!user) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-bold mb-4">User Profile</h2>
        <div className="mb-2"><b>Name:</b> {user.name}</div>
        <div className="mb-2"><b>Email:</b> {user.email}</div>
        <div className="mb-2"><b>Phone:</b> {user.phone}</div>
        <div className="mb-2"><b>Role:</b> {user.role}</div>
        <div className="mb-2"><b>Status:</b> {user.active ? 'Active' : 'Blocked'}</div>
        <div className="mb-2"><b>KYC Status:</b> {user.kyc_status}</div>
        <div className="mb-2"><b>Bookings Count:</b> {user.bookings_count}</div>
        <div className="mb-2"><b>Created At:</b> {user.created_at}</div>
      </div>
    </div>
  );
};

export default UserProfileModal;
