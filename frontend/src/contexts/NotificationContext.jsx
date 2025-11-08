import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSocket } from './SocketContext.jsx';
import axios from '../axiosintreceptor.js';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const { socket, isConnected } = useSocket();

    // Request notification permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Fetch notifications on mount if user is authenticated
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchNotifications();
            fetchUnreadCount();
        } else {
            setLoading(false);
        }
    }, []);

    // Listen for new notifications via socket
    useEffect(() => {
        if (!socket) return;

        socket.on('new_notification', (data) => {
            const { notification } = data;

            // Add to notifications list
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Show browser notification if permission granted
            showBrowserNotification(notification);

            // Show toast notification
            toast.success(notification.title, {
                duration: 4000,
                position: 'top-right',
            });
        });

        return () => {
            socket.off('new_notification');
        };
    }, [socket]);

    const fetchNotifications = async (page = 1, limit = 20) => {
        try {
            const response = await axios.get(`/notifications?page=${page}&limit=${limit}`);
            if (page === 1) {
                setNotifications(response.data.notifications);
            } else {
                setNotifications(prev => [...prev, ...response.data.notifications]);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await axios.get('/notifications/unread-count');
            setUnreadCount(response.data.unreadCount);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await axios.put(`/notifications/${notificationId}/read`);
            setNotifications(prev =>
                prev.map(notif =>
                    notif._id === notificationId
                        ? { ...notif, isRead: true, readAt: new Date() }
                        : notif
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.put('/notifications/read-all');
            setNotifications(prev =>
                prev.map(notif => ({ ...notif, isRead: true, readAt: new Date() }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            await axios.delete(`/notifications/${notificationId}`);
            setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
            // Update unread count if deleted notification was unread
            const deletedNotif = notifications.find(n => n._id === notificationId);
            if (deletedNotif && !deletedNotif.isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const showBrowserNotification = (notification) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            const browserNotification = new Notification(notification.title, {
                body: notification.message,
                tag: `notification-${notification._id}`, // Prevent duplicate notifications
                requireInteraction: false,
                silent: false
            });

            // Auto-close after 5 seconds
            setTimeout(() => {
                browserNotification.close();
            }, 5000);

            // Handle click to focus on relevant page
            browserNotification.onclick = () => {
                window.focus();

                // Navigate based on notification type
                if (notification.type === 'chat_message' && notification.data?.chatId) {
                    window.history.pushState({ chatId: notification.data.chatId }, '', `/chat`);
                    // Trigger navigation (you might need to use React Router's navigate)
                    window.dispatchEvent(new PopStateEvent('popstate', {
                        state: { chatId: notification.data.chatId }
                    }));
                }

                browserNotification.close();
            };
        }
    };

    const value = {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
