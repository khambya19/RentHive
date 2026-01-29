import React from 'react';
import UsersTable from './UsersTable';

// SuperAdmin: Entry for all super admin features (start with user management)
const SuperAdmin = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">User Management</h2>
      <UsersTable />
      {/* Add more super admin features here as you build them */}
    </div>
  );
};

export default SuperAdmin;
