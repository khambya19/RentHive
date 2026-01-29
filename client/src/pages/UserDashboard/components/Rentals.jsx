import React from 'react';
import { Key } from 'lucide-react';

const Rentals = () => (
  <div className="rounded shadow-none bg-[#f4fbfd] w-full h-full p-0 m-0">
    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
      <Key size={24} className="text-blue-600" />
      My Rentals
    </h2>
    <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
      <Key size={48} className="mb-4 opacity-50" />
      <p className="text-lg font-medium">No active rentals</p>
      <p className="text-sm">Your active rentals and bookings will appear here.</p>
    </div>
  </div>
);

export default Rentals;
