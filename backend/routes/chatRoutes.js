const express = require('express');
const router = express.Router();
const Chat = require('../models/chatModel');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/chats
 * @desc    Get all chats for the current user
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
    try {
        const chats = await Chat.find({
            participants: req.user.id,
            isActive: true
        })
        .populate('participants', 'name email profilePhoto')
        .populate('lastMessage.sender', 'name')
        .sort({ 'lastMessage.timestamp': -1 });

        // Calculate unread count for each chat
        const chatsWithUnread = chats.map(chat => {
            const unreadCount = chat.messages.filter(msg =>
                msg.sender.toString() !== req.user.id &&
                !msg.readBy.some(read => read.user.toString() === req.user.id)
            ).length;

            return {
                ...chat.toObject(),
                unreadCount
            };
        });

        res.json({
            success: true,
            chats: chatsWithUnread
        });
    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   GET /api/chats/:chatId/messages
 * @desc    Get messages for a specific chat
 * @access  Private
 */
router.get('/:chatId/messages', protect, async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId)
            .populate('participants', 'name email profilePhoto')
            .populate('messages.sender', 'name profilePhoto');

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        // Check if user is participant
        if (!chat.participants.some(p => p._id.toString() === req.user.id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Mark messages as read
        chat.messages.forEach(msg => {
            if (msg.sender._id.toString() !== req.user.id) {
                const alreadyRead = msg.readBy.some(read => read.user.toString() === req.user.id);
                if (!alreadyRead) {
                    msg.readBy.push({ user: req.user.id });
                }
            }
        });

        await chat.save();

        res.json({
            success: true,
            chat
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   POST /api/chats
 * @desc    Create a new chat or get existing chat between two users
 * @access  Private
 */
router.post('/', protect, async (req, res) => {
    const { participantId } = req.body;

    if (!participantId) {
        return res.status(400).json({ message: 'Participant ID is required' });
    }

    try {
        // Check if chat already exists
        let chat = await Chat.findOne({
            participants: { $all: [req.user.id, participantId] },
            isActive: true
        });

        if (chat) {
            return res.json({
                success: true,
                chat: await chat.populate('participants', 'name email profilePhoto')
            });
        }

        // Create new chat
        chat = new Chat({
            participants: [req.user.id, participantId],
            messages: []
        });

        await chat.save();
        await chat.populate('participants', 'name email profilePhoto');

        res.status(201).json({
            success: true,
            chat
        });
    } catch (error) {
        console.error('Error creating chat:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   DELETE /api/chats/:chatId
 * @desc    Deactivate a chat (soft delete)
 * @access  Private
 */
router.delete('/:chatId', protect, async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId);

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        // Check if user is participant
        if (!chat.participants.some(p => p._id.toString() === req.user.id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        chat.isActive = false;
        await chat.save();

        res.json({
            success: true,
            message: 'Chat deactivated successfully'
        });
    } catch (error) {
        console.error('Error deactivating chat:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
