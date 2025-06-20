import { nanoid } from "nanoid";
import Message from "../models/Message.js";
import { authenticateSocket } from "../middleware/auth.js";

const onlineUsers = new Map();
const typingUsers = new Map();

export const handleSocketConnection = (io, socket) => {
  console.log("Client connected");
  console.log("the connected user data is ", socket.user);
  console.log(`User connected: ${socket.user.username} (${socket.user.id})`);

  // Add user to online users
  onlineUsers.set(socket.user.id, {
    socketId: socket.id,
    username: socket.user.username,
    isGuest: socket.user.isGuest,
    sessionId: socket.user.sessionId || null, // store sessionId for guests
  });

  // Join general room by default
  socket.join("general");

  // If guest, join guest session room
  if (socket.user.isGuest && socket.user.sessionId) {
    const guestRoom = `guest_session_${socket.user.sessionId}`;
    socket.join(guestRoom);
    loadRecentMessages(socket, guestRoom);
  }

  // Helper to get filtered online users for the current socket
  function getFilteredOnlineUsers() {
    const currentUser = onlineUsers.get(socket.user.id);
    if (!currentUser) return [];
    if (currentUser.isGuest) {
      // Only guests with the same sessionId
      return Array.from(onlineUsers.entries())
        .filter(
          ([_, user]) =>
            user.isGuest && user.sessionId === currentUser.sessionId
        )
        .map(([userId, user]) => ({ userId, username: user.username }));
    } else {
      // Only normal users
      return Array.from(onlineUsers.entries())
        .filter(([_, user]) => !user.isGuest)
        .map(([userId, user]) => ({ userId, username: user.username }));
    }
  }

  // Broadcast filtered online users to the current socket
  socket.emit("onlineUsers", getFilteredOnlineUsers());
  // Broadcast to others as well (for their own filtered view)
  io.sockets.sockets.forEach((s) => {
    const sUser = Array.from(onlineUsers.entries()).find(
      ([id, u]) => u.socketId === s.id
    );
    if (sUser) {
      const [id] = sUser;
      const userObj = onlineUsers.get(id);
      if (userObj) {
        // For each socket, emit their filtered online users
        s.emit(
          "onlineUsers",
          (() => {
            if (userObj.isGuest) {
              return Array.from(onlineUsers.entries())
                .filter(
                  ([_, user]) =>
                    user.isGuest && user.sessionId === userObj.sessionId
                )
                .map(([userId, user]) => ({ userId, username: user.username }));
            } else {
              return Array.from(onlineUsers.entries())
                .filter(([_, user]) => !user.isGuest)
                .map(([userId, user]) => ({ userId, username: user.username }));
            }
          })()
        );
      }
    }
  });

  socket.broadcast.emit("userOnline", {
    userId: socket.user.id,
    username: socket.user.username,
  });

  // Load recent messages for the general room
  loadRecentMessages(socket, "general");

  // Handle new messages
  socket.on("message", async (data) => {
    try {
      const { content, roomId = "general", recipientId } = data;

      if (!content || !content.trim()) return;

      // Guest group chat logic
      if (socket.user.isGuest && socket.user.sessionId) {
        const guestRoom = `guest_session_${socket.user.sessionId}`;
        const messageData = {
          id: nanoid(),
          content: content.trim(),
          senderId: socket.user.id,
          senderName: socket.user.username,
          timestamp: new Date(),
          type: "text",
        };
        // No DB save for guests (optional)
        io.to(guestRoom).emit("message", messageData);
        removeTypingUser(socket.user.id, guestRoom);
        io.to(guestRoom).emit("userStoppedTyping", socket.user.username);
        return;
      }

      // Prevent sending messages to self in private chat
      if (recipientId && recipientId === socket.user.id) {
        socket.emit("error", "Cannot send messages to yourself");
        return;
      }

      // If recipientId is provided, ensure roomId matches the private room
      let finalRoomId = roomId;
      if (recipientId) {
        finalRoomId = getPrivateRoomId(socket.user.id, recipientId);
      }

      const messageData = {
        id: nanoid(),
        content: content.trim(),
        senderId: socket.user.id,
        senderName: socket.user.username,
        timestamp: new Date(),
        type: "text",
      };

      // Save message to database (skip for guest messages if desired)
      if (!socket.user.isGuest) {
        const message = new Message({
          content: messageData.content,
          senderId: messageData.senderId,
          senderName: messageData.senderName,
          roomId: finalRoomId,
          isGuest: socket.user.isGuest,
        });
        await message.save();
      }

      // Broadcast message to room
      io.to(finalRoomId).emit("message", messageData);

      // Remove user from typing
      removeTypingUser(socket.user.id, finalRoomId);
      io.to(finalRoomId).emit("userStoppedTyping", socket.user.username);
    } catch (error) {
      console.error("Message error:", error);
      socket.emit("error", "Failed to send message");
    }
  });

  // Handle join room
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    loadRecentMessages(socket, roomId);

    const systemMessage = {
      id: nanoid(),
      content: `${socket.user.username} joined the chat`,
      senderId: "system",
      senderName: "System",
      timestamp: new Date(),
      type: "system",
    };

    socket.to(roomId).emit("message", systemMessage);
  });

  // Handle leave room
  socket.on("leaveRoom", (roomId) => {
    socket.leave(roomId);

    const systemMessage = {
      id: nanoid(),
      content: `${socket.user.username} left the chat`,
      senderId: "system",
      senderName: "System",
      timestamp: new Date(),
      type: "system",
    };

    socket.to(roomId).emit("message", systemMessage);
  });

  // Handle typing
  socket.on("typing", (data) => {
    const { roomId = "general" } = data;
    addTypingUser(socket.user.id, socket.user.username, roomId);
    socket.to(roomId).emit("userTyping", socket.user.username);
  });

  // Handle stop typing
  socket.on("stopTyping", (data) => {
    const { roomId = "general" } = data;
    removeTypingUser(socket.user.id, roomId);
    socket.to(roomId).emit("userStoppedTyping", socket.user.username);
  });

  // Handle join private room
  socket.on("joinPrivateRoom", ({ otherUserId }) => {
    if (!otherUserId || otherUserId === socket.user.id) return;
    if (socket.user.isGuest && socket.user.sessionId) return; // guests don't use private rooms
    const privateRoomId = getPrivateRoomId(socket.user.id, otherUserId);
    socket.join(privateRoomId);
    loadRecentMessages(socket, privateRoomId);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.user.username}`);

    // Remove from online users
    onlineUsers.delete(socket.user.id);

    // Remove from typing users
    removeTypingUser(socket.user.id);

    // Broadcast filtered online users to all sockets
    io.sockets.sockets.forEach((s) => {
      const sUser = Array.from(onlineUsers.entries()).find(
        ([id, u]) => u.socketId === s.id
      );
      if (sUser) {
        const [id] = sUser;
        const userObj = onlineUsers.get(id);
        if (userObj) {
          s.emit(
            "onlineUsers",
            (() => {
              if (userObj.isGuest) {
                return Array.from(onlineUsers.entries())
                  .filter(
                    ([_, user]) =>
                      user.isGuest && user.sessionId === userObj.sessionId
                  )
                  .map(([userId, user]) => ({
                    userId,
                    username: user.username,
                  }));
              } else {
                return Array.from(onlineUsers.entries())
                  .filter(([_, user]) => !user.isGuest)
                  .map(([userId, user]) => ({
                    userId,
                    username: user.username,
                  }));
              }
            })()
          );
        }
      }
    });

    // Broadcast stop typing
    socket.broadcast.emit("userStoppedTyping", socket.user.username);
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

    const formattedMessages = messages.reverse().map((msg) => ({
      id: msg._id.toString(),
      content: msg.content,
      senderId: msg.senderId,
      senderName: msg.senderName,
      timestamp: msg.createdAt,
      type: msg.type,
    }));

    socket.emit("chatHistory", formattedMessages);
  } catch (error) {
    console.error("Error loading messages:", error);
  }
};

// Helper to generate a unique private room ID for two users
function getPrivateRoomId(userId1, userId2) {
  // Sort IDs to ensure uniqueness regardless of order
  return `private_${[userId1, userId2].sort().join("_")}`;
}

// Create a wrapper function that handles socket connections
const chatHandler = (io) => {
  io.use(authenticateSocket);
  io.on("connection", (socket) => {
    handleSocketConnection(io, socket);
  });
};

export default chatHandler;
