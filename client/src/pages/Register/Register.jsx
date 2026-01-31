import React from 'react';
import { useNavigate } from 'react-router-dom';
// import './Register.css'; // Deprecated - using Tailwind
import RenthiveLogo from '../../assets/Logo.png';
import { Building2, UserCircle, ArrowRight, LogIn } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-200 via-purple-100 to-orange-200 px-2 py-4 sm:p-4">
      <div className="bg-white p-4 sm:p-6 md:p-10 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl w-full max-w-100 sm:max-w-md md:max-w-2xl border border-gray-100">
        
        {/* Logo & Header */}
        <div className="text-center mb-4 sm:mb-6">
          <img 
            src={RenthiveLogo} 
            alt="RentHive Logo" 
            className="h-10 sm:h-12 md:h-14 mx-auto mb-3 sm:mb-4" 
          />
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            Join RentHive
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm">
            Choose how you want to use RentHive
          </p>
        </div>

        {/* Registration Options */}
        <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4 mb-4 sm:mb-6">
          
          {/* Owner Option */}
          <div 
            className="border-2 border-gray-100 hover:border-orange-400 rounded-lg sm:rounded-xl p-3 sm:p-4 cursor-pointer transition-all hover:shadow-md group active:scale-[0.98]" 
            onClick={() => navigate('/register-owner')}
          >
            <div className="flex items-center gap-3 sm:flex-col sm:text-center sm:gap-2">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <Building2 size={20} className="text-orange-600 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-gray-800 truncate">
                  Register as Owner
                </h3>
                <p className="text-gray-500 text-[11px] sm:text-xs leading-tight">
                  List properties & vehicles
                </p>
              </div>
              <ArrowRight size={16} className="text-gray-300 group-hover:text-orange-500 sm:hidden flex-shrink-0" />
            </div>
          </div>

          {/* User Option */}
          <div 
            className="border-2 border-gray-100 hover:border-blue-400 rounded-lg sm:rounded-xl p-3 sm:p-4 cursor-pointer transition-all hover:shadow-md group active:scale-[0.98]" 
            onClick={() => navigate('/register-user')}
          >
            <div className="flex items-center gap-3 sm:flex-col sm:text-center sm:gap-2">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <UserCircle size={20} className="text-blue-600 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-gray-800 truncate">
                  Register as User
                </h3>
                <p className="text-gray-500 text-[11px] sm:text-xs leading-tight">
                  Find & rent properties
                </p>
              </div>
              <ArrowRight size={16} className="text-gray-300 group-hover:text-blue-500 sm:hidden flex-shrink-0" />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-gray-400 text-[10px] sm:text-xs">or</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-gray-500 text-xs sm:text-sm mb-2">
            Already have an account?
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-gray-200 hover:border-orange-400 text-gray-700 hover:text-orange-600 font-medium rounded-lg transition-all hover:bg-orange-50 text-xs sm:text-sm"
          >
            <LogIn size={14} />
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
