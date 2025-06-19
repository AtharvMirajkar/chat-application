import { nanoid } from 'nanoid';
import Message from '../models/Message.js';
import { authenticateSocket } from '../middleware/auth.js';

const onlineUsers = new Map();
const typingUsers = new Map();

export const handleSocketConnection = (io, socket) => {
  console.log('Client connected');
  console.log("the connected user data is ", socket.user);
  console.log(`User connected: ${socket.user.username} (${socket.user.id})`);

  // Add user to online users
  onlineUsers.set(socket.user.id, {
    socketId: socket.id,
    username: socket.user.username,
    isGuest: socket.user.isGuest,
  });

  // Join general room by default
  socket.join('general');

  // Broadcast online users
  const onlineUsersList = Array.from(onlineUsers.values()).map(user => user.username);
  io.emit('onlineUsers', onlineUsersList);
  socket.broadcast.emit('userOnline', socket.user.username);

  // Load recent messages for the general room
  loadRecentMessages(socket, 'general');

  // Handle new messages
  socket.on('message', async (data) => {
    try {
      const { content, roomId = 'general' } = data;

      if (!content || !content.trim()) return;

      const messageData = {
        id: nanoid(),
        content: content.trim(),
        senderId: socket.user.id,
        senderName: socket.user.username,
        timestamp: new Date(),
        type: 'text',
      };

      // Save message to database (skip for guest messages if desired)
      if (!socket.user.isGuest) {
        const message = new Message({
          content: messageData.content,
          senderId: messageData.senderId,
          senderName: messageData.senderName,
          roomId,
          isGuest: socket.user.isGuest,
        });
        await message.save();
      }

      // Broadcast message to room
      io.to(roomId).emit('message', messageData);

      // Remove user from typing
      removeTypingUser(socket.user.id, roomId);
      io.to(roomId).emit('userStoppedTyping', socket.user.username);
    } catch (error) {
      console.error('Message error:', error);
      socket.emit('error', 'Failed to send message');
    }
  });

  // Handle join room
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    loadRecentMessages(socket, roomId);
    
    const systemMessage = {
      id: nanoid(),
      content: `${socket.user.username} joined the chat`,
      senderId: 'system',
      senderName: 'System',
      timestamp: new Date(),
      type: 'system',
    };
    
    socket.to(roomId).emit('message', systemMessage);
  });

  // Handle leave room
  socket.on('leaveRoom', (roomId) => {
    socket.leave(roomId);
    
    const systemMessage = {
      id: nanoid(),
      content: `${socket.user.username} left the chat`,
      senderId: 'system',
      senderName: 'System',
      timestamp: new Date(),
      type: 'system',
    };
    
    socket.to(roomId).emit('message', systemMessage);
  });

  // Handle typing
  socket.on('typing', (data) => {
    const { roomId = 'general' } = data;
    addTypingUser(socket.user.id, socket.user.username, roomId);
    socket.to(roomId).emit('userTyping', socket.user.username);
  });

  // Handle stop typing
  socket.on('stopTyping', (data) => {
    const { roomId = 'general' } = data;
    removeTypingUser(socket.user.id, roomId);
    socket.to(roomId).emit('userStoppedTyping', socket.user.username);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.username}`);
    
    // Remove from online users
    onlineUsers.delete(socket.user.id);
    
    // Remove from typing users
    removeTypingUser(socket.user.id);
    
    // Broadcast updated online users
    const onlineUsersList = Array.from(onlineUsers.values()).map(user => user.username);
    io.emit('onlineUsers', onlineUsersList);
    socket.broadcast.emit('userOffline', socket.user.username);
    
    // Broadcast stop typing
    socket.broadcast.emit('userStoppedTyping', socket.user.username);
  });
};

const addTypingUser = (userId, username, roomId) => {
  if (!typingUsers.has(roomId)) {
    typingUsers.set(roomId, new Set());
  }
  typingUsers.get(roomId).add(username);
};

const removeTypingUser = (userId, roomId) => {
  const userInfo = onlineUsers.get(userId);
  if (!userInfo) return;

  if (roomId) {
    const roomTypers = typingUsers.get(roomId);
    if (roomTypers) {
      roomTypers.delete(userInfo.username);
      if (roomTypers.size === 0) {
        typingUsers.delete(roomId);
      }
    }
  } else {
    // Remove from all rooms
    typingUsers.forEach((roomTypers, room) => {
      roomTypers.delete(userInfo.username);
      if (roomTypers.size === 0) {
        typingUsers.delete(room);
      }
    });
  }
};

const loadRecentMessages = async (socket, roomId) => {
  try {
    const messages = await Message.find({ roomId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const formattedMessages = messages.reverse().map(msg => ({
      id: msg._id.toString(),
      content: msg.content,
      senderId: msg.senderId,
      senderName: msg.senderName,
      timestamp: msg.createdAt,
      type: msg.type,
    }));

    socket.emit('chatHistory', formattedMessages);
  } catch (error) {
    console.error('Error loading messages:', error);
  }
};

// Create a wrapper function that handles socket connections
const chatHandler = (io) => {
  io.use(authenticateSocket);
  io.on('connection', (socket) => {
    handleSocketConnection(io, socket);
  });
};

export default chatHandler;