import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      // Initialize socket connection
      const newSocket = io(window.location.origin, {
        withCredentials: true,
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setConnected(true);
        
        // Join user's notification room
        newSocket.emit('join-user-room', user.id);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setConnected(false);
      });

      // Listen for new notifications
      newSocket.on('new-notification', (notification) => {
        console.log('New notification received:', notification);
        
        // Update unread count
        setUnreadCount(prev => prev + 1);
        
        // Show toast notification
        toast.success(notification.message, {
          duration: 4000,
          position: 'top-right',
        });

        // Emit custom event for other components to listen
        window.dispatchEvent(new CustomEvent('newForumNotification', {
          detail: notification
        }));
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  const updateUnreadCount = (count) => {
    setUnreadCount(count);
  };

  const value = {
    socket,
    connected,
    unreadCount,
    updateUnreadCount
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};