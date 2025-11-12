import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { useSocket } from '../contexts/SocketContext.jsx';
import axios from '../axiosintreceptor.js';
import toast from 'react-hot-toast';

import { Search, Send } from 'lucide-react';

// --- Chat Component ---
const ChatPage = () => {
    const { socket, isConnected } = useSocket();
    const [chats, setChats] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [fetchingMessages, setFetchingMessages] = useState(false);
    const messagesEndRef = useRef(null);

    // Get userId from token
    const getUserIdFromToken = () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return payload.id;
            } catch (error) {
                console.error('Error decoding token:', error);
                return null;
            }
        }
        return null;
    };

    const userId = getUserIdFromToken();

    // Scroll to bottom when messages change
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        // Only auto-scroll if user is near the bottom (within 100px)
        const messagesContainer = messagesEndRef.current?.parentElement;
        if (messagesContainer) {
            const isNearBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < 100;
            if (isNearBottom) {
                scrollToBottom();
            }
        }
    }, [messages]);

    // Fetch chats on component mount
    useEffect(() => {
        fetchChats();
    }, []);

    // Handle navigation state for specific chat
    useEffect(() => {
        const state = window.history.state;
        if (state && state.chatId) {
            handleChatSelect(state.chatId); // Use handleChatSelect to include mark as read
        }
    }, []);

    // Socket event listeners
    useEffect(() => {
        if (!socket) return;

        // Listen for new messages
        socket.on('receive_message', (data) => {
            const { chatId, message } = data;

            // --- Update Chat List Locally ---
            setChats(prevChats => {
                const chatIndex = prevChats.findIndex(chat => chat._id === chatId);
                if (chatIndex === -1) return prevChats;

                const updatedChat = {
                    ...prevChats[chatIndex],
                    lastMessage: {
                        content: message.content,
                        sender: message.sender._id,
                        timestamp: message.createdAt,
                    },
                    // Increment unread count ONLY if the chat is not active
                    unreadCount: chatId !== activeChatId
                        ? (prevChats[chatIndex].unreadCount || 0) + 1
                        : 0,
                };

                // Move the updated chat to the top of the list
                const otherChats = prevChats.filter(chat => chat._id !== chatId);
                return [updatedChat, ...otherChats];
            });

            // --- Update Messages Area ---
            if (chatId === activeChatId) {
                // If it's a message from the *current user*, replace the optimistic one
                if (message.sender._id === userId) {
                    setMessages(prev =>
                        prev.map(msg =>
                            msg._id.startsWith('temp_') && msg.content === message.content
                                ? message // Replace temp msg with real msg from server
                                : msg
                        )
                    );
                } else {
                    // If it's from the other participant, just add it
                    setMessages(prev => [...prev, message]);
                }
            }
        });

        // Listen for chat updates (e.g., a new chat is created)
        socket.on('chat_updated', (data) => {
            fetchChats();
        });

        return () => {
            socket.off('receive_message');
            socket.off('chat_updated');
        };
    }, [socket, activeChatId, userId]); // Add userId

    // Join chat room when active chat changes
    useEffect(() => {
        if (!socket || !activeChatId) return;

        socket.emit('join_chat', activeChatId);

        return () => {
            if (activeChatId) {
                socket.emit('leave_chat', activeChatId);
            }
        };
    }, [socket, activeChatId]);

    const fetchChats = async () => {
        try {
            const response = await axios.get('/chats');
            setChats(response.data.chats);
            if (!activeChatId && response.data.chats.length > 0) {
                // Set active chat but don't fetch messages, let user click
                setActiveChatId(response.data.chats[0]._id);
                // Automatically fetch messages for the first chat
                fetchMessages(response.data.chats[0]._id);
            }
        } catch (error) {
            toast.error('Failed to load your chats. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (chatId) => {
        setFetchingMessages(true);
        try {
            const response = await axios.get(`/chats/${chatId}/messages`);
            setMessages(response.data.chat.messages);
        } catch (error) {
            toast.error('Failed to load messages for this chat.');
        } finally {
            setFetchingMessages(false);
        }
    };

    const handleChatSelect = (chatId) => {
        if (activeChatId === chatId) return; // Don't re-select if already active

        setActiveChatId(chatId);
        fetchMessages(chatId);

        // --- Mark as Read ---
        // 1. Update state locally
        setChats(prevChats => prevChats.map(chat =>
            chat._id === chatId ? { ...chat, unreadCount: 0 } : chat
        ));

        // 2. Emit to server to sync
        if (socket) {
            socket.emit('mark_as_read', { chatId });
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        const content = newMessage.trim();
        if (!content || !socket || !activeChatId) return;

        // --- 1. Create Optimistic Message ---
        const optimisticMessage = {
            _id: `temp_${Date.now()}`, // Temporary ID
            content: content,
            sender: { _id: userId }, // We only need sender._id to identify it as "sent"
            createdAt: new Date().toISOString(),
            chatId: activeChatId,
        };

        // --- 2. Add to UI Immediately ---
        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage('');

        // --- 3. Emit with Acknowledgement ---
        socket.emit('send_message', {
            chatId: activeChatId,
            content: content
        }, (response) => {
            if (!response.success) {
                // If server confirms failure
                toast.error(response.error || 'Could not send message.');
                // Remove the failed optimistic message
                setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
            }
            // If success, we don't need to do anything.
            // The 'receive_message' listener will handle replacing
            // the temp message with the real one from the server.
        });
    };

    // --- Helper function to generate a consistent, colorful background for avatars ---
    const generateAvatarColor = (name) => {
        if (!name) return 'bg-gray-300';
        const colors = [
            'bg-red-200 text-red-800', 'bg-green-200 text-green-800', 'bg-blue-200 text-blue-800',
            'bg-yellow-200 text-yellow-800', 'bg-indigo-200 text-indigo-800', 'bg-purple-200 text-purple-800',
            'bg-pink-200 text-pink-800', 'bg-teal-200 text-teal-800'
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash % colors.length);
        return colors[index];
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatLastMessageTime = (timestamp) => {
        const now = new Date();
        const messageTime = new Date(timestamp);
        const diffInHours = (now - messageTime) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffInHours < 48) {
            return '1d';
        } else {
            return `${Math.floor(diffInHours / 24)}d`;
        }
    };

    const activeChat = chats.find(chat => chat._id === activeChatId);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 font-sans">
                <Navbar />
                <div className="flex items-center justify-center p-4 pt-24">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading chats...</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div
            className="min-h-screen bg-gray-100 font-sans flex flex-col"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e5e7eb' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
        >
            <Navbar />
            <div className="flex-1 flex items-center justify-center p-4 pt-24 pb-4">
                <div className="w-full max-w-7xl h-full flex rounded-2xl shadow-2xl bg-white overflow-hidden">

                    {/* Sidebar: Chat List */}
                    <div className="w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 flex flex-col">
                        <div className="p-4 border-b border-gray-200">
                            <div className="relative">
                                <input type="text" placeholder="Search chats" className="w-full py-2 pl-10 pr-4 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-green-400" />
                                <div className="absolute top-1/2 left-3 -translate-y-1/2">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>
                            </div>
                        </div>
                        <div className="flex-grow overflow-y-auto">
                            {chats.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">
                                    No chats yet. Start a conversation by contacting a seller!
                                </div>
                            ) : (
                                chats.map(chat => {
                                    const otherParticipant = chat.participants.find(p => p._id !== userId);
                                    return (
                                        <div
                                            key={chat._id}
                                            onClick={() => handleChatSelect(chat._id)}
                                            className={`flex items-center p-3 cursor-pointer transition-colors duration-200 ${chat._id === activeChatId ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                                        >
                                            <div className="relative mr-3">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${generateAvatarColor(otherParticipant?.name)}`}>
                                                    <span className="text-lg font-bold">
                                                        {otherParticipant?.name?.charAt(0)?.toUpperCase() || '?'}
                                                    </span>
                                                </div>
                                                {/* Visual indicator for unread, different from count */}
                                                {chat.unreadCount > 0 && <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-8 bg-green-500 rounded-full"></div>}
                                            </div>
                                            <div className="flex-grow">
                                                <p className="font-bold text-gray-800">{otherParticipant?.name}</p>
                                                <p className="text-sm text-gray-500 truncate">
                                                    {chat.lastMessage?.content ? (
                                                        <>
                                                            {chat.lastMessage.sender === userId && <span className="font-semibold">You: </span>}
                                                            {chat.lastMessage.content}
                                                        </>
                                                    ) : 'No messages yet'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-400 mb-1">
                                                    {chat.lastMessage?.timestamp ? formatLastMessageTime(chat.lastMessage.timestamp) : ''}
                                                </p>
                                                {chat.unreadCount > 0 && (
                                                    <span className="text-xs text-white bg-green-500 rounded-full px-2 py-0.5">
                                                        {chat.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Main Chat Window */}
                    <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col bg-gray-50 relative">
                        {activeChat ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 bg-white border-b border-gray-200 flex items-center shadow-sm z-10">
                                    {(() => {
                                        const otherParticipant = activeChat.participants.find(p => p._id !== userId);
                                        return (
                                            <>
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${generateAvatarColor(otherParticipant?.name)}`}>
                                                    <span className="text-base font-bold">
                                                        {otherParticipant?.name?.charAt(0)?.toUpperCase() || '?'}
                                                    </span>
                                                </div>
                                                <div className="flex-grow">
                                                    <p className="font-bold text-gray-800">Chat with {otherParticipant?.name}</p>
                                                    <p className="text-xs text-green-500">
                                                        {isConnected ? 'Online' : 'Offline'}
                                                    </p>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>

                                {/* Messages Area */}
                                <div className="flex-grow p-6 overflow-y-auto">
                                    {fetchingMessages ? (
                                        <div className="text-center text-gray-500 mt-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
                                            <p>Loading messages...</p>
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="text-center text-gray-500 mt-8">
                                            No messages yet. Start the conversation!
                                        </div>
                                    ) : (
                                        messages.map((msg, index) => {
                                            const isSent = msg.sender._id === userId;
                                            const isOptimistic = msg._id.startsWith('temp_');
                                            return (
                                                <div key={msg._id || index} className={`flex items-start mb-4 ${isSent ? 'justify-end' : 'justify-start'}`}>
                                                    {!isSent && (
                                                        <div className="flex items-start mr-3">
                                                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${generateAvatarColor(msg.sender.name)}`}>
                                                                <span className="text-xs font-bold">
                                                                    {msg.sender.name?.charAt(0)?.toUpperCase() || '?'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col">
                                                        {!isSent && (
                                                            <p className="text-sm font-semibold text-gray-700 mb-1">{msg.sender.name}</p>
                                                        )}
                                                        <div className={`max-w-md p-3 rounded-2xl shadow-sm ${isSent ? 'bg-green-500 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'}`}>
                                                            <p>{msg.content}</p>
                                                            <p className={`text-xs mt-1 ${isSent ? 'text-green-100' : 'text-gray-400'} text-right`}>
                                                                {isOptimistic ? 'Sending...' : formatTime(msg.createdAt)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Message Input */}
                                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200 flex items-center">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Write a message..."
                                        className="flex-grow py-2 px-4 mx-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-green-400"
                                        disabled={!isConnected || fetchingMessages} // Also disable while fetching
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim() || !isConnected || sendingMessage}
                                        className="bg-green-500 text-white p-3 rounded-full hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 shadow-lg"
                                    >
                                        {sendingMessage ? (
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                        ) : (
                                            <Send className="h-6 w-6" />
                                        )}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="flex-grow flex items-center justify-center">
                                <div className="text-center text-gray-500">
                                    <p className="text-lg">Select a chat to start messaging</p>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ChatPage;