const Message = require('../models/Message');
const User = require('../models/User');
const Property = require('../models/Property');
const Bike = require('../models/Bike');
const { Op } = require('sequelize');

// Generate conversation ID between two users (always same regardless of order)
const getConversationId = (userId1, userId2) => {
  const ids = [userId1, userId2].sort((a, b) => a - b);
  return `conv_${ids[0]}_${ids[1]}`;
};

// Get all conversations for a user
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all unique conversations
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'email', 'profileImage']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'name', 'email', 'profileImage']
        },
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'title', 'address', 'city', 'propertyType'],
          required: false
        },
        {
          model: Bike,
          as: 'bike',
          attributes: ['id', 'brand', 'model', 'type', 'name'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Group by conversation and get last message for each
    const conversationMap = new Map();
    
    messages.forEach(msg => {
      const convId = msg.conversationId;
      if (!conversationMap.has(convId)) {
        const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
        const unreadCount = messages.filter(m => 
          m.conversationId === convId && 
          m.receiverId === userId && 
          !m.isRead
        ).length;

        conversationMap.set(convId, {
          conversationId: convId,
          otherUser: {
            id: otherUser.id,
            name: otherUser.name,
            email: otherUser.email,
            profileImage: otherUser.profileImage
          },
          lastMessage: {
            message: msg.message,
            createdAt: msg.createdAt,
            senderId: msg.senderId,
            messageType: msg.messageType
          },
          unreadCount,
          propertyId: msg.propertyId,
          bikeId: msg.bikeId,
          property: msg.property ? {
            id: msg.property.id,
            title: msg.property.title,
            address: msg.property.address,
            city: msg.property.city,
            propertyType: msg.property.propertyType
          } : null,
          bike: msg.bike ? {
            id: msg.bike.id,
            brand: msg.bike.brand,
            model: msg.bike.model,
            type: msg.bike.type,
            name: msg.bike.name
          } : null
        });
      }
    });

    const conversations = Array.from(conversationMap.values());
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations', details: error.message });
  }
};

// Get messages for a specific conversation
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otherUserId } = req.params;
    const conversationId = getConversationId(userId, parseInt(otherUserId));

    const messages = await Message.findAll({
      where: { conversationId },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'profileImage']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'name', 'profileImage']
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    // Mark messages as read
    await Message.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          conversationId,
          receiverId: userId,
          isRead: false
        }
      }
    );

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages', details: error.message });
  }
};

// Send a new message
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, message, propertyId, bikeId, bookingId, messageType } = req.body;

    if (!receiverId || !message) {
      return res.status(400).json({ error: 'Receiver and message are required' });
    }

    const conversationId = getConversationId(senderId, receiverId);

    const newMessage = await Message.create({
      conversationId,
      senderId,
      receiverId,
      message,
      propertyId: propertyId || null,
      bikeId: bikeId || null,
      bookingId: bookingId || null,
      messageType: messageType || 'text',
      isRead: false
    });

    // Fetch complete message with user details
    const messageWithDetails = await Message.findByPk(newMessage.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'profileImage']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'name', 'profileImage']
        }
      ]
    });

    // Emit socket event for real-time delivery
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${receiverId}`).emit('new_message', messageWithDetails);
      io.to(`user_${receiverId}`).emit('receive_message', messageWithDetails);
      io.to(`user_${receiverId}`).emit('refresh_counts');
      // Also emit to sender so other tabs update
      io.to(`user_${senderId}`).emit('receive_message', messageWithDetails);
      io.to(`user_${senderId}`).emit('refresh_counts');
    }

    res.status(201).json(messageWithDetails);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message', details: error.message });
  }
};

// Mark conversation as read
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otherUserId } = req.params;
    const conversationId = getConversationId(userId, parseInt(otherUserId));

    await Message.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          conversationId,
          receiverId: userId,
          isRead: false
        }
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await Message.count({
      where: {
        receiverId: userId,
        isRead: false
      }
    });

    res.json({ count: unreadCount, unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;

    const message = await Message.findByPk(messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.senderId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    await message.destroy();
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};
