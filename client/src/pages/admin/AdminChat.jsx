import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_BASE_URL, { SERVER_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Send, User as UserIcon, MessageSquare, Search, Eye } from 'lucide-react';

const AdminChat = () => {
    const { user } = useAuth();
    const { socket, isConnected } = useSocket();
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const scrollRef = useRef();
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!socket || !isConnected) return;

        // Fetch list of conversations
        fetchConversations();

        socket.emit('join_chat', 'admin_support');
        socket.emit('register', user.id);

        const handleReceiveMessage = (data) => {
             if (activeChat && (data.senderId === activeChat.partner.id || data.receiverId === activeChat.partner.id)) {
                 setMessages(prev => [...prev, data]);
             }
             fetchConversations();
        };

        socket.on('receive_message', handleReceiveMessage);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
        };
    }, [activeChat, user, socket, isConnected]);

    const fetchConversations = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/chat/conversations/list`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setConversations(res.data.conversations);
            }
        } catch (err) {
            console.error("Error fetching conversations", err);
        }
    };

    const handleSelectChat = async (convo) => {
        setActiveChat(convo);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/chat/${convo.partner.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(res.data.messages);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat) return;

        const msgData = {
            receiverId: activeChat.partner.id,
            message: newMessage,
            senderId: user.id
        };

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/chat/send`, msgData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setMessages(prev => [...prev, res.data.message]);
                setNewMessage('');
                socket.emit('send_message', res.data.message);
                fetchConversations(); // Update list order
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const filteredConvos = conversations.filter(c => 
        c.partner?.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex h-[calc(100vh-140px)] bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Sidebar List */}
            <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-100">
                     <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                         <MessageSquare size={18} className="text-indigo-600"/> Messages
                     </h3>
                </div>
                 
                 <div className="flex-1 overflow-y-auto">
                     {conversations.length === 0 ? (
                         <div className="p-8 text-center text-slate-400 text-sm">No conversations found.</div>
                     ) : (
                         conversations.map((convo, idx) => (
                             <div 
                                key={idx}
                                onClick={() => handleSelectChat(convo)}
                                className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${activeChat?.partner?.id === convo.partner.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''}`}
                             >
                                 <div className="flex items-center gap-3">
                                     <div className="relative">
                                         {convo.partner.profileImage ? (
                                             <img src={`${SERVER_BASE_URL}/uploads/profiles/${convo.partner.profileImage}`} className="w-10 h-10 rounded-full object-cover" alt="User" />
                                         ) : (
                                             <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                                                 {convo.partner.name?.[0]}
                                             </div>
                                         )}
                                     </div>
                                     <div className="flex-1 min-w-0">
                                         <div className="flex justify-between items-start mb-1">
                                             <div className="overflow-hidden mr-2">
                                                <h4 className="font-bold text-slate-900 truncate text-sm leading-tight">{convo.partner.name}</h4>
                                                <p className="text-[10px] text-slate-500 truncate leading-tight">{convo.partner.email}</p>
                                             </div>
                                             <span className="text-[10px] text-slate-400 shrink-0">{new Date(convo.lastMessage.createdAt).toLocaleDateString()}</span>
                                         </div>
                                         <p className="text-xs text-slate-500 truncate">{convo.lastMessage.message || convo.lastMessage.content}</p>
                                     </div>
                                 </div>
                             </div>
                         ))
                     )}
                 </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-slate-50/50">
                {activeChat ? (
                    <>
                        {/* Header */}
                        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                                     {activeChat.partner.profileImage ? (
                                         <img src={`${SERVER_BASE_URL}/uploads/profiles/${activeChat.partner.profileImage}`} className="w-full h-full object-cover" />
                                     ) : (
                                         <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 font-bold">{activeChat.partner.name[0]}</div>
                                     )}
                                 </div>
                                 <div>
                                     <h3 className="font-bold text-slate-800">{activeChat.partner.name}</h3>
                                     <p className="text-xs text-slate-500 capitalize">{activeChat.partner.type}</p>
                                 </div>
                             </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.map((msg, idx) => {
                                if (!user) return null;
                                const isMe = msg.senderId === user.id;
                                return (
                                    <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] rounded-2xl px-5 py-3 text-sm shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'}`}>
                                            <p>{msg.message || msg.content}</p>
                                            <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                            <div ref={scrollRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200 flex gap-4">
                             <input 
                                 className="flex-1 p-3 bg-slate-100 border-transparent rounded-xl focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                                 placeholder="Type your reply..."
                                 value={newMessage}
                                 onChange={e => setNewMessage(e.target.value)}
                             />
                             <button 
                                 disabled={!newMessage.trim()}
                                 className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                             >
                                 <Send size={18} /> Send
                             </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <MessageSquare size={32} />
                        </div>
                        <p className="font-medium">Select a conversation to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminChat;
