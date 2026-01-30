import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, User, MessageSquare, Loader2 } from 'lucide-react';
import API_BASE_URL, { SERVER_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const ChatWithAdmin = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [adminId, setAdminId] = useState(null); // We need to find an admin to chat with
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef();

  useEffect(() => {
    // 1. Fetch Admin ID
    const initChat = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Try getting existing conversation first
        const convoRes = await axios.get(`${API_BASE_URL}/chat/conversations/list`, {
             headers: { Authorization: `Bearer ${token}` }
        });
        
        let targetAdmin = null;
        if (convoRes.data && convoRes.data.success && Array.isArray(convoRes.data.conversations)) {
            targetAdmin = convoRes.data.conversations.find(c => c.partner?.type === 'super_admin')?.partner;
        }
        
        if (!targetAdmin) {
             // If no chat yet, fetch support agent info
             try {
                const agentRes = await axios.get(`${API_BASE_URL}/chat/support-agent`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (agentRes.data.success && agentRes.data.admin) {
                    setAdminId(agentRes.data.admin.id);
                } else {
                    setAdminId(6); // Default to super admin ID 6
                }
             } catch (agentErr) {
                 setAdminId(6); // Fallback
             }
        } else {
             setAdminId(targetAdmin.id);
        }
        
      } catch (err) {
        console.error("Error init chat", err);
        setAdminId(6); // Last resort fallback
      } finally {
          setLoading(false);
      }
    };
    
    initChat();
  }, []);

  useEffect(() => {
      if (!adminId || !user) return;

      const fetchMessages = async () => {
          setLoading(true);
          try {
              const token = localStorage.getItem('token');
              const res = await axios.get(`${API_BASE_URL}/chat/${adminId}`, {
                  headers: { Authorization: `Bearer ${token}` }
              });
              setMessages(res.data.messages || []);
              setLoading(false);
          } catch (err) {
              console.error(err);
              setLoading(false);
          }
      };

      fetchMessages();

      // Socket setup (guarded)
      if (socket && isConnected) {
          socket.emit('register', user.id);
          const handleReceiveMessage = (data) => {
              if (data.senderId === adminId || data.receiverId === user.id) {
                  setMessages((prev) => [...prev, data]);
              }
          };
          socket.on('receive_message', handleReceiveMessage);
          return () => {
              socket.off('receive_message', handleReceiveMessage);
          };
      }
      return undefined;
  }, [adminId, user, socket, isConnected]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !adminId) return;

    const msgData = {
        receiverId: adminId,
        message: newMessage,
        senderId: user.id
    };
    
    // Optimistic UI
    // setMessages(prev => [...prev, msgData]); // Wait for server to confirm ID etc
    
    try {
        const token = localStorage.getItem('token');
        const res = await axios.post(`${API_BASE_URL}/chat/send`, msgData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.success) {
            setMessages(prev => [...prev, res.data.message]);
            setNewMessage('');
            if (socket) socket.emit('send_message', res.data.message);
        }
    } catch (err) {
        console.error("Send failed", err);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-indigo-600 text-white flex items-center gap-3">
             <div className="p-2 bg-white/20 rounded-full">
                 <MessageSquare size={20} />
             </div>
             <div>
                 <h3 className="font-bold">Support Chat</h3>
                 <p className="text-xs text-indigo-100">Talk to Admin</p>
             </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-400" /></div>
            ) : messages.length === 0 ? (
                <div className="text-center text-slate-400 py-10 text-sm">No messages yet. Say hello! 👋</div>
            ) : (
                messages.map((msg, idx) => {
                    if (!user) return null;
                    const isMe = msg.senderId === user.id;
                    return (
                        <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-sm'}`}>
                                <p>{msg.message || msg.content}</p>
                                <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                            </div>
                        </div>
                    )
                })
            )}
            <div ref={scrollRef} />
        </div>

        <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2">
            <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message to admin..."
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            <button 
                type="submit" 
                disabled={!newMessage.trim()}
                className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
                <Send size={20} />
            </button>
        </form>
    </div>
  );
};

export default ChatWithAdmin;
