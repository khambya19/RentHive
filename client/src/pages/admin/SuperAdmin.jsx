import React, { useState } from 'react';
import UsersTable from './UsersTable';
import { FileCheck, CheckCircle, XCircle, Clock } from 'lucide-react';

// SuperAdmin: Entry for all super admin features (start with user management)
const SuperAdmin = (props) => {
  const [kycFilter, setKycFilter] = useState(props.initialKycFilter || 'all');
  
  const isKycView = props.initialKycFilter !== undefined;
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">
        {isKycView
          ? 'KYC Verification Management' 
          : props.initialRoleFilter === 'owner' 
            ? 'Owner List' 
            : props.initialRoleFilter === 'renter' 
              ? 'Tenant List' 
              : 'User Management'}
      </h2>
      
      {/* KYC Filter Tabs */}
      {isKycView && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setKycFilter('pending')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              kycFilter === 'pending'
                ? 'bg-amber-100 text-amber-800 border-2 border-amber-300 shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Clock size={16} />
            Pending Review
          </button>
          <button
            onClick={() => setKycFilter('approved')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              kycFilter === 'approved'
                ? 'bg-green-100 text-green-800 border-2 border-green-300 shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <CheckCircle size={16} />
            Approved
          </button>
          <button
            onClick={() => setKycFilter('rejected')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              kycFilter === 'rejected'
                ? 'bg-red-100 text-red-800 border-2 border-red-300 shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <XCircle size={16} />
            Rejected
          </button>
          <button
            onClick={() => setKycFilter('all')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              kycFilter === 'all'
                ? 'bg-indigo-100 text-indigo-800 border-2 border-indigo-300 shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <FileCheck size={16} />
            All KYC
          </button>
        </div>
      )}
      
      <UsersTable {...props} initialKycFilter={isKycView ? kycFilter : props.initialKycFilter} key={kycFilter} />
      {/* Add more super admin features here as you build them */}
    </div>
  );
};

export default SuperAdmin;
