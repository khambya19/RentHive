import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Search, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import API_BASE_URL from '../../../config/api';

const UserMessages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const socket = window.socket;
    if (!socket) return;

    const handleNewMessage = (message) => {
      if (selectedConversation && 
          (message.senderId === selectedConversation.otherUser.id || 
           message.receiverId === selectedConversation.otherUser.id)) {
        setMessages(prev => [...prev, message]);
        markAsRead(selectedConversation.otherUser.id);
      }
      fetchConversations();
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/messages/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (otherUserId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/messages/conversation/${otherUserId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: selectedConversation.otherUser.id,
          message: newMessage,
          propertyId: selectedConversation.propertyId,
          bikeId: selectedConversation.bikeId
        })
      });

      if (response.ok) {
        const sentMessage = await response.json();
        setMessages(prev => [...prev, sentMessage]);
        setNewMessage('');
        fetchConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (otherUserId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/messages/read/${otherUserId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const selectConversation = (conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.otherUser.id);
    markAsRead(conversation.otherUser.id);
  };

  const getProfileImage = (profileImage) => {
    if (!profileImage) return null;
    const baseUrl = API_BASE_URL.replace('/api', '');
    return `${baseUrl}/uploads/profiles/${profileImage}`;
  };

  const formatTime = (date) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.otherUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.otherUser.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-200px)] bg-white rounded-lg shadow-lg overflow-hidden">
      <div className={`w-full md:w-96 border-r flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-cyan-50">
          <h2 className="text-xl font-bold text-gray-800 mb-3">Messages</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <Search className="text-gray-400" size={18} />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6">
              <User size={48} className="mb-3 opacity-50" />
              <p className="text-center">No conversations yet</p>
              <p className="text-sm text-center mt-2">Start by contacting property owners</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.conversationId}
                onClick={() => selectConversation(conv)}
                className={`p-4 border-b cursor-pointer hover:bg-blue-50 transition ${
                  selectedConversation?.conversationId === conv.conversationId ? 'bg-blue-100' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {conv.otherUser.profileImage ? (
                      <img
                        src={getProfileImage(conv.otherUser.profileImage)}
                        alt={conv.otherUser.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                        {conv.otherUser.name[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-800 truncate">{conv.otherUser.name}</h3>
                      <span className="text-xs text-gray-500">{formatTime(conv.lastMessage.createdAt)}</span>
                    </div>
                    {conv.property && (
                      <p className="text-xs text-blue-600 mb-1 truncate">
                        🏠 {conv.property.title} - {conv.property.city}
                      </p>
                    )}
                    {conv.bike && (
                      <p className="text-xs text-blue-600 mb-1 truncate">
                        🏍️ {conv.bike.name || `${conv.bike.brand} ${conv.bike.model}`}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 truncate">{conv.lastMessage.message}</p>
                    {conv.unreadCount > 0 && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                        {conv.unreadCount} new
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={`flex-1 flex flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
        {selectedConversation ? (
          <>
            <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-cyan-50 flex items-center gap-3">
              <button
                onClick={() => setSelectedConversation(null)}
                className="md:hidden p-2 hover:bg-white rounded-lg"
              >
                <ChevronLeft size={20} />
              </button>
              {selectedConversation.otherUser.profileImage ? (
                <img
                  src={getProfileImage(selectedConversation.otherUser.profileImage)}
                  alt={selectedConversation.otherUser.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-bold">
                  {selectedConversation.otherUser.name[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{selectedConversation.otherUser.name}</h3>
                <p className="text-xs text-gray-500">{selectedConversation.otherUser.email}</p>
              </div>
            </div>

            {/* Property/Bike Details Card */}
            {(selectedConversation.property || selectedConversation.bike) && (
              <div className="mx-4 mt-4 p-3 bg-white border border-blue-200 rounded-lg shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {selectedConversation.property ? (
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">🏠</span>
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">🏍️</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    {selectedConversation.property && (
                      <>
                        <h4 className="font-semibold text-gray-800 text-sm">
                          {selectedConversation.property.title}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          📍 {selectedConversation.property.address}, {selectedConversation.property.city}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          {selectedConversation.property.propertyType}
                        </p>
                      </>
                    )}
                    {selectedConversation.bike && (
                      <>
                        <h4 className="font-semibold text-gray-800 text-sm">
                          {selectedConversation.bike.name || `${selectedConversation.bike.brand} ${selectedConversation.bike.model}`}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {selectedConversation.bike.brand} • {selectedConversation.bike.model}
                        </p>
                        <p className="text-xs text-cyan-600 mt-1">
                          {selectedConversation.bike.type}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {messages.map((msg) => {
                const isSent = msg.senderId === user.id;
                return (
                  <div
                    key={msg.id}
                    className={`mb-4 flex ${isSent ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${isSent ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`p-3 rounded-lg ${
                          isSent
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                            : 'bg-white border shadow-sm'
                        }`}
                      >
                        <p className="text-sm break-words">{msg.message}</p>
                      </div>
                      <p className={`text-xs text-gray-500 mt-1 ${isSent ? 'text-right' : 'text-left'}`}>
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                  <Send size={18} />
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <User size={64} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserMessages;
