import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface OnlineUser {
  userId: string;
  username: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: "text" | "system";
}

interface ChatState {
  messages: Message[];
  onlineUsers: OnlineUser[];
  typingUsers: string[];
  currentChatRoom: string | null;
  isConnected: boolean;
  selectedUser: OnlineUser | null;
}

const initialState: ChatState = {
  messages: [],
  onlineUsers: [],
  typingUsers: [],
  currentChatRoom: null,
  isConnected: false,
  selectedUser: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    setMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = action.payload;
    },
    setOnlineUsers: (state, action: PayloadAction<OnlineUser[]>) => {
      state.onlineUsers = action.payload;
    },
    addOnlineUser: (state, action: PayloadAction<OnlineUser>) => {
      if (!state.onlineUsers.some((u) => u.userId === action.payload.userId)) {
        state.onlineUsers.push(action.payload);
      }
    },
    removeOnlineUser: (state, action: PayloadAction<string>) => {
      state.onlineUsers = state.onlineUsers.filter(
        (u) => u.userId !== action.payload
      );
    },
    setTypingUsers: (state, action: PayloadAction<string[]>) => {
      state.typingUsers = action.payload;
    },
    addTypingUser: (state, action: PayloadAction<string>) => {
      if (!state.typingUsers.includes(action.payload)) {
        state.typingUsers.push(action.payload);
      }
    },
    removeTypingUser: (state, action: PayloadAction<string>) => {
      state.typingUsers = state.typingUsers.filter(
        (id) => id !== action.payload
      );
    },
    setChatRoom: (state, action: PayloadAction<string>) => {
      state.currentChatRoom = action.payload;
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    clearChat: (state) => {
      state.messages = [];
      state.typingUsers = [];
      state.currentChatRoom = null;
    },
    setSelectedUser: (state, action: PayloadAction<OnlineUser | null>) => {
      state.selectedUser = action.payload;
    },
    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },
  },
});

export const {
  addMessage,
  setMessages,
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
  setTypingUsers,
  addTypingUser,
  removeTypingUser,
  setChatRoom,
  setConnected,
  clearChat,
  setSelectedUser,
  clearSelectedUser,
} = chatSlice.actions;

export default chatSlice.reducer;
