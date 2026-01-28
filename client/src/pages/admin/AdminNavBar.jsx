import React from 'react';

const AdminNavBar = () => (
  <nav className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between shadow">
    <div className="text-xl font-bold tracking-wide">RentHive Admin</div>
    <ul className="flex gap-6">
      <li className="hover:text-yellow-400 cursor-pointer">Dashboard</li>
      <li className="hover:text-yellow-400 cursor-pointer">Users</li>
      <li className="hover:text-yellow-400 cursor-pointer">Owners</li>
      <li className="hover:text-yellow-400 cursor-pointer">Properties</li>
      <li className="hover:text-yellow-400 cursor-pointer">Payments</li>
      <li className="hover:text-yellow-400 cursor-pointer">Notifications</li>
    </ul>
    <div className="font-medium">Admin</div>
  </nav>
);

export default AdminNavBar;
