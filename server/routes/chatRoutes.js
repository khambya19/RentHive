const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Message = require('../models/Message');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Get support agent (Admin)
router.get('/support-agent', protect, async (req, res) => {
  try {
     // Find the first super_admin
     const admin = await User.findOne({ where: { type: 'super_admin' } });
     if (!admin) {
        // Fallback or multiple admins logic could go here
        // If no super_admin in DB, maybe return a default ID or error
        // For dev, if we used seeded data, id 1 might be admin
        return res.json({ success: true, admin: { id: 1, name: 'Support' } });
     }
     
     res.json({ success: true, admin: { id: admin.id, name: admin.name, profileImage: admin.profileImage } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get recent chats (conversations)
router.get('/conversations/list', protect, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Find all unique users the current user has chatted with
        // This is a bit complex in Sequelize without raw queries, doing a simplified fetch
        // Fetch all messages involving the user
        const messages = await Message.findAll({
            where: {
                [Op.or]: [{ senderId: userId }, { receiverId: userId }]
            },
            order: [['createdAt', 'DESC']],
            include: [
                { model: User, as: 'sender', attributes: ['id', 'name', 'profileImage', 'type'] },
                { model: User, as: 'receiver', attributes: ['id', 'name', 'profileImage', 'type'] }
            ]
        });

        const conversationMap = new Map();
        
        messages.forEach(msg => {
            const partner = msg.senderId === userId ? msg.receiver : msg.sender;
            if (!partner) return;
            
            if (!conversationMap.has(partner.id)) {
                conversationMap.set(partner.id, {
                    partner,
                    lastMessage: msg
                });
            }
        });

        const conversations = Array.from(conversationMap.values());
        res.json({ success: true, conversations });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get messages between current user and another user
router.get('/:otherUserId', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { otherUserId } = req.params;

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ]
      },
      order: [['createdAt', 'ASC']],
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'profileImage'] },
        { model: User, as: 'receiver', attributes: ['id', 'name', 'profileImage'] }
      ]
    });

    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send a message
router.post('/send', protect, async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, content } = req.body;

    if (!content || !receiverId) {
      return res.status(400).json({ error: 'Receiver and content required' });
    }

    const message = await Message.create({
      senderId,
      receiverId,
      content
    });

    const fullMessage = await Message.findByPk(message.id, {
        include: [
            { model: User, as: 'sender', attributes: ['id', 'name', 'profileImage'] },
            { model: User, as: 'receiver', attributes: ['id', 'name', 'profileImage'] }
        ]
    });

    res.json({ success: true, message: fullMessage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
