import React, { useState } from 'react';
import UsersTable from './UsersTable';
import { FileCheck, Clock, XCircle, CheckCircle } from 'lucide-react';

// SuperAdmin: Entry for all super admin features (start with user management)
const SuperAdmin = (props) => {
  const [kycFilter, setKycFilter] = useState(props.initialKycFilter || 'all');
  
  const isKycMode = props.initialKycFilter !== undefined;
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          {isKycMode
            ? 'KYC Verification Management' 
            : props.initialRoleFilter === 'owner' 
              ? 'Owner List' 
              : props.initialRoleFilter === 'user' 
                ? 'User List' 
                : 'User Management'}
        </h2>
        
        {/* KYC Filter Buttons */}
        {isKycMode && (
          <div className="flex gap-2">
            <button
              onClick={() => setKycFilter('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                kycFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <FileCheck size={16} />
              All KYC
            </button>
            <button
              onClick={() => setKycFilter('pending')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                kycFilter === 'pending'
                  ? 'bg-amber-500 text-white shadow-lg'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-amber-50'
              }`}
            >
              <Clock size={16} />
              Pending
            </button>
            <button
              onClick={() => setKycFilter('approved')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                kycFilter === 'approved'
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-green-50'
              }`}
            >
              <CheckCircle size={16} />
              Approved
            </button>
            <button
              onClick={() => setKycFilter('rejected')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                kycFilter === 'rejected'
                  ? 'bg-red-500 text-white shadow-lg'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-red-50'
              }`}
            >
              <XCircle size={16} />
              Rejected
            </button>
          </div>
        )}
      </div>
      
      <UsersTable {...props} initialKycFilter={kycFilter} key={kycFilter} />
      {/* Add more super admin features here as you build them */}
    </div>
  );
};

export default SuperAdmin;
