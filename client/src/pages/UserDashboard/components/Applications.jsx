import React from 'react';
import { FileText } from 'lucide-react';

const Applications = () => (
  <div className="rounded shadow-none bg-[#f4fbfd] w-full h-full p-0 m-0">
    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
      <FileText size={24} className="text-purple-600" />
      My Applications
    </h2>
    <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
      <FileText size={48} className="mb-4 opacity-50" />
      <p className="text-lg font-medium">No applications made</p>
      <p className="text-sm">Your rental applications will be listed here.</p>
    </div>
  </div>
);

export default Applications;
