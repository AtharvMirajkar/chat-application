import { io, Socket } from "socket.io-client";
import { store } from "../store/store";
import {
  addMessage,
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
  addTypingUser,
  removeTypingUser,
  setConnected,
  Message,
  OnlineUser,
} from "../features/chat/chatSlice";

class SocketService {
  private socket: Socket | null = null;
  private serverURL =
    import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

  connect(
    token?: string,
    guestData?: { sessionId: string; guestName: string }
  ) {
    const auth = token
      ? { token }
      : guestData
      ? { guest: true, ...guestData }
      : {};

    this.socket = io(this.serverURL, {
      auth,
      transports: ["websocket", "polling"],
    });

    this.setupEventListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      store.dispatch(setConnected(false));
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("Connected to server");
      store.dispatch(setConnected(true));
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from server");
      store.dispatch(setConnected(false));
    });

    this.socket.on("message", (message: Message) => {
      store.dispatch(addMessage(message));
    });

    this.socket.on("userOnline", (user: OnlineUser) => {
      store.dispatch(addOnlineUser(user));
    });

    this.socket.on("userOffline", (user: OnlineUser) => {
      store.dispatch(removeOnlineUser(user.userId));
    });

    this.socket.on("onlineUsers", (users: OnlineUser[]) => {
      store.dispatch(setOnlineUsers(users));
    });

    this.socket.on("userTyping", (userId: string) => {
      store.dispatch(addTypingUser(userId));
    });

    this.socket.on("userStoppedTyping", (userId: string) => {
      store.dispatch(removeTypingUser(userId));
    });

    this.socket.on("error", (error: any) => {
      console.error("Socket error:", error);
    });
  }

  sendMessage(content: string, roomId?: string, recipientId?: string) {
    if (this.socket) {
      this.socket.emit("message", { content, roomId, recipientId });
    }
  }

  joinRoom(roomId: string) {
    if (this.socket) {
      this.socket.emit("joinRoom", roomId);
    }
  }

  leaveRoom(roomId: string) {
    if (this.socket) {
      this.socket.emit("leaveRoom", roomId);
    }
  }

  startTyping(roomId?: string) {
    if (this.socket) {
      this.socket.emit("typing", { roomId });
    }
  }

  stopTyping(roomId?: string) {
    if (this.socket) {
      this.socket.emit("stopTyping", { roomId });
    }
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();
