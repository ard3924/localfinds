const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Chat = require('./models/chatModel');
const Notification = require('./models/notificationModel');

function initializeSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:5173",
            methods: ["GET", "POST"]
        }
    });

    // Socket.IO authentication middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            socket.userName = decoded.name;
            socket.userRole = decoded.role;
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    // Socket.IO connection handling
    io.on('connection', (socket) => {
        console.log(`User ${socket.userId} connected`);

        // Join user's personal room for private messages
        socket.join(socket.userId);

        // Handle joining chat room
        socket.on('join_chat', (chatId) => {
            socket.join(chatId);
            console.log(`User ${socket.userId} joined chat ${chatId}`);
        });

        // Handle leaving chat room
        socket.on('leave_chat', (chatId) => {
            socket.leave(chatId);
            console.log(`User ${socket.userId} left chat ${chatId}`);
        });

        // Handle sending message
        socket.on('send_message', async (data) => {
            try {
                const { chatId, content, messageType = 'text' } = data;

                const chat = await Chat.findById(chatId);
                if (!chat) {
                    socket.emit('error', { message: 'Chat not found' });
                    return;
                }

                // Check if user is participant
                if (!chat.participants.some(p => p.toString() === socket.userId)) {
                    socket.emit('error', { message: 'Not authorized' });
                    return;
                }

                // Add message to chat
                const newMessage = {
                    sender: socket.userId,
                    content,
                    messageType,
                    deliveredAt: new Date()
                };

                chat.messages.push(newMessage);
                chat.lastMessage = {
                    sender: socket.userId,
                    content,
                    timestamp: new Date()
                };

                await chat.save();

                // Populate sender info
                await chat.populate('messages.sender', 'name profilePhoto');

                const message = chat.messages[chat.messages.length - 1];

                // Emit to all participants in the chat room
                io.to(chatId).emit('receive_message', {
                    chatId,
                    message: {
                        _id: message._id,
                        sender: message.sender,
                        content: message.content,
                        messageType: message.messageType,
                        createdAt: message.createdAt,
                        deliveredAt: message.deliveredAt
                    }
                });

                // Update chat list for all participants
                chat.participants.forEach(participantId => {
                    io.to(participantId.toString()).emit('chat_updated', {
                        chatId,
                        lastMessage: chat.lastMessage
                    });
                });

                // Create notification for chat message
                const recipientId = chat.participants.find(p => p.toString() !== socket.userId);
                if (recipientId) {
                    try {
                        const notification = new Notification({
                            user: recipientId,
                            type: 'chat_message',
                            title: `New message from ${socket.userName}`,
                            message: content.length > 50 ? content.substring(0, 50) + '...' : content,
                            data: {
                                chatId,
                                senderId: socket.userId,
                                senderName: socket.userName
                            }
                        });
                        await notification.save();

                        // Emit notification to recipient
                        io.to(recipientId.toString()).emit('new_notification', {
                            notification: {
                                _id: notification._id,
                                user: notification.user,
                                type: notification.type,
                                title: notification.title,
                                message: notification.message,
                                data: notification.data,
                                isRead: notification.isRead,
                                readAt: notification.readAt,
                                createdAt: notification.createdAt,
                                updatedAt: notification.updatedAt
                            }
                        });
                    } catch (error) {
                        console.error('Error creating notification:', error);
                    }
                }

            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Handle typing indicator
        socket.on('typing', (data) => {
            const { chatId, isTyping } = data;
            socket.to(chatId).emit('user_typing', {
                userId: socket.userId,
                userName: socket.userName,
                isTyping
            });
        });

        // Handle mark as read
        socket.on('mark_as_read', async (data) => {
            try {
                const { chatId } = data;
                const chat = await Chat.findById(chatId);

                if (!chat) {
                    socket.emit('error', { message: 'Chat not found' });
                    return;
                }

                // Check if user is participant
                if (!chat.participants.some(p => p.toString() === socket.userId)) {
                    socket.emit('error', { message: 'Not authorized' });
                    return;
                }

                // Mark messages as read for this user
                chat.messages.forEach(msg => {
                    if (msg.sender.toString() !== socket.userId) {
                        const alreadyRead = msg.readBy.some(read => read.user.toString() === socket.userId);
                        if (!alreadyRead) {
                            msg.readBy.push({ user: socket.userId });
                        }
                    }
                });

                await chat.save();

                // Emit to all participants to update unread counts
                chat.participants.forEach(participantId => {
                    io.to(participantId.toString()).emit('chat_updated', {
                        chatId,
                        action: 'mark_as_read'
                    });
                });

            } catch (error) {
                console.error('Error marking messages as read:', error);
                socket.emit('error', { message: 'Failed to mark messages as read' });
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`User ${socket.userId} disconnected`);
        });
    });

    return io;
}

module.exports = initializeSocket;
