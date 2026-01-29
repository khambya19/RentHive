import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Briefcase, CheckCircle, ArrowRight } from 'lucide-react';
// import './joinRenthive.css'; // Deprecated - using Tailwind CSS

const JoinRenthive = () => {
  const navigate = useNavigate();

  const handleRegister = (userType) => {
    if (userType === 'Owner') {
      navigate('/register-owner');
    } else if (userType === 'User') {
      navigate('/register-user');
    }
  };

  return (
    <section className="py-8 sm:py-12 lg:py-16 px-2 sm:px-4 lg:px-8 bg-white">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-2 sm:mb-3">
          Join RentHive Today
        </h2>
        <p className="text-xs sm:text-sm lg:text-base text-gray-500 mb-6 sm:mb-8 lg:mb-10">
          Choose your account type and start your rental journey
        </p>

        {/* Cards Container - Stack on mobile, side by side on tablet+ */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 lg:gap-8">
          
          {/* Owner Card */}
          <div className="flex-1 max-w-sm mx-auto sm:mx-0 p-4 sm:p-6 lg:p-8 rounded-xl border border-teal-100 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-teal-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Briefcase size={24} className="text-teal-600 sm:w-8 sm:h-8" />
            </div>
            
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">I'm an Owner</h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-4 leading-relaxed">
              Have properties or vehicles to rent out. List your assets and reach potential lessees.
            </p>

            <ul className="text-left space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
              <li className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-teal-600">
                <CheckCircle size={14} className="flex-shrink-0" /> List unlimited properties
              </li>
              <li className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-teal-600">
                <CheckCircle size={14} className="flex-shrink-0" /> Manage bookings easily
              </li>
              <li className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-teal-600">
                <CheckCircle size={14} className="flex-shrink-0" /> Receive secure payments
              </li>
              <li className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-teal-600">
                <CheckCircle size={14} className="flex-shrink-0" /> Analytics dashboard
              </li>
            </ul>

            <button 
              className="w-full py-2.5 sm:py-3 bg-teal-600 text-white rounded-lg font-medium text-xs sm:text-sm hover:bg-teal-700 transition-colors flex items-center justify-center gap-1.5"
              onClick={() => handleRegister('Owner')}
            >
              Register as Owner <ArrowRight size={16} />
            </button>
          </div>

          {/* User Card */}
          <div className="flex-1 max-w-sm mx-auto sm:mx-0 p-4 sm:p-6 lg:p-8 rounded-xl border border-orange-100 bg-orange-50/50 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Users size={24} className="text-orange-600 sm:w-8 sm:h-8" />
            </div>

            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">I'm a User</h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-4 leading-relaxed">
              Looking for properties or vehicles to rent. Browse listings and book instantly.
            </p>
            
            <ul className="text-left space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
              <li className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-orange-600">
                <CheckCircle size={14} className="flex-shrink-0" /> Search and filter listings
              </li>
              <li className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-orange-600">
                <CheckCircle size={14} className="flex-shrink-0" /> Chat with property owners
              </li>
              <li className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-orange-600">
                <CheckCircle size={14} className="flex-shrink-0" /> Secure online payments
              </li>
              <li className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-orange-600">
                <CheckCircle size={14} className="flex-shrink-0" /> Track your bookings
              </li>
            </ul>

            <button 
              className="w-full py-2.5 sm:py-3 bg-orange-500 text-white rounded-lg font-medium text-xs sm:text-sm hover:bg-orange-600 transition-colors flex items-center justify-center gap-1.5"
              onClick={() => handleRegister('User')}
            >
              Register as User <ArrowRight size={16} />
            </button>
          </div>

        </div>
      </div>
    </section>
  );
};

export default JoinRenthive;