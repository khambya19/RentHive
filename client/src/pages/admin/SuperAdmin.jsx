import React from 'react';
import UsersTable from './UsersTable';

// SuperAdmin: Entry for all super admin features (start with user management)
const SuperAdmin = (props) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">
        {props.initialKycFilter === 'pending' 
          ? 'KYC Verification Queue' 
          : props.initialRoleFilter === 'owner' 
            ? 'Owner List' 
            : props.initialRoleFilter === 'renter' 
              ? 'Tenant List' 
              : 'User Management'}
      </h2>
      <UsersTable {...props} />
      {/* Add more super admin features here as you build them */}
    </div>
  );
};

export default SuperAdmin;
