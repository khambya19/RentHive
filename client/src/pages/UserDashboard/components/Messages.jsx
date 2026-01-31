import React from 'react';
import { MessageSquare, Inbox, Search, Send, User } from 'lucide-react';

const Messages = () => {
  return (
    <div className="w-full h-[calc(100vh-140px)] flex flex-col bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-xl">
      <div className="flex-1 flex items-center justify-center p-12 text-center flex-col gap-6">
        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 shadow-inner">
           <MessageSquare size={48} strokeWidth={1.5} />
        </div>
        <div className="max-w-md space-y-2">
           <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Hive Inbox</h2>
           <p className="text-slate-500 font-medium">Your private communication stream with property owners and vehicle vendors will appear here.</p>
        </div>
        <div className="flex gap-4 mt-4">
           <div className="px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">Secure Protocol Active</span>
           </div>
        </div>
        <div className="w-full max-w-lg h-[1px] bg-gradient-to-r from-transparent via-slate-100 to-transparent mt-8" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Connect with a listing to start a conversation</p>
      </div>
    </div>
  );
};

export default Messages;
