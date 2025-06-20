import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Container,
  Drawer,
  IconButton,
  useMediaQuery,
  useTheme,
  Alert,
  Chip,
} from "@mui/material";
import { Menu, Close, Info } from "@mui/icons-material";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import {
  addMessage,
  setMessages,
  setChatRoom,
} from "../../features/chat/chatSlice";
import { socketService } from "../../services/socketService";
import MessageBubble from "../../components/Chat/MessageBubble";
import ChatInput from "../../components/Chat/ChatInput";
import OnlineUsers from "../../components/Chat/OnlineUsers";
import TypingIndicator from "../../components/Chat/TypingIndicator";
import { setSelectedUser } from "../../features/chat/chatSlice";

const ChatPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();

  const { messages, isConnected, selectedUser } = useAppSelector(
    (state) => state.chat
  );
  const { user } = useAppSelector((state) => state.auth);
  const { isGuestMode, sessionId, guestName } = useAppSelector(
    (state) => state.guest
  );
  const loggedInUserId = user?.id;
  const loggedInUsername = user?.username;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const socket = socketService.getSocket();

    if (socket) {
      const handleChatHistory = (messages: any[]) => {
        dispatch(setMessages(messages));
      };

      socket.on("chatHistory", handleChatHistory);

      return () => {
        socket.off("chatHistory", handleChatHistory);
      };
    }
  }, [dispatch]);

  useEffect(() => {
    if (
      selectedUser &&
      loggedInUserId &&
      selectedUser.userId !== loggedInUserId
    ) {
      const roomId = `private_${[loggedInUserId, selectedUser.userId]
        .sort()
        .join("_")}`;
      socketService
        .getSocket()
        ?.emit("joinPrivateRoom", { otherUserId: selectedUser.userId });
      dispatch(setChatRoom(roomId));
    } else {
      dispatch(setChatRoom(""));
    }
  }, [selectedUser, loggedInUserId, dispatch]);

  const handleSendMessage = (messageContent: string) => {
    // Message will be added via socket event
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const currentUser = isGuestMode ? guestName : user?.username;
  const displaySessionInfo = isGuestMode && sessionId;

  const sidebarContent = (
    <Box
      sx={{
        width: 280,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="h6" fontWeight="600">
          Chat Info
        </Typography>
        {isMobile && (
          <IconButton onClick={toggleSidebar}>
            <Close />
          </IconButton>
        )}
      </Box>

      {displaySessionInfo && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="600">
              Session Code: {sessionId}
            </Typography>
            <Typography variant="caption" display="block">
              Share this code with others to join
            </Typography>
          </Alert>
        </Box>
      )}

      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <OnlineUsers />
      </Box>

      <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: isConnected ? "success.main" : "error.main",
              mr: 1,
            }}
          />
          <Typography variant="body2">
            {isConnected ? "Connected" : "Disconnected"}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Logged in as: {currentUser}
          {isGuestMode && <Chip label="Guest" size="small" sx={{ ml: 1 }} />}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ height: "100vh", p: 0 }}>
      <Box sx={{ display: "flex", height: "100%" }}>
        {/* Sidebar */}
        {!isMobile && (
          <Paper
            elevation={2}
            sx={{
              width: 280,
              borderRadius: 0,
              borderRight: 1,
              borderColor: "divider",
            }}
          >
            {sidebarContent}
          </Paper>
        )}

        {/* Mobile Drawer */}
        <Drawer
          anchor="left"
          open={sidebarOpen}
          onClose={toggleSidebar}
          sx={{ display: { xs: "block", md: "none" } }}
        >
          {sidebarContent}
        </Drawer>

        {/* Main Chat Area */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Chat Header */}
          <Paper
            elevation={1}
            sx={{
              p: 2,
              display: "flex",
              alignItems: "center",
              borderRadius: 0,
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            {isMobile && (
              <IconButton edge="start" onClick={toggleSidebar} sx={{ mr: 2 }}>
                <Menu />
              </IconButton>
            )}
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {selectedUser
                ? `Chatting with: ${selectedUser.username}`
                : "Select a user to chat"}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: isConnected ? "success.main" : "error.main",
                }}
              />
              <Typography variant="body2" color="text.secondary">
                {isConnected ? "Connected" : "Connecting..."}
              </Typography>
            </Box>
          </Paper>

          {/* Messages Area */}
          <Box
            sx={{
              flex: 1,
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
              bgcolor: "background.default",
            }}
          >
            <Box sx={{ flex: 1, p: 1 }}>
              {!selectedUser || selectedUser.userId === loggedInUserId ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    flexDirection: "column",
                    opacity: 0.6,
                  }}
                >
                  <Info sx={{ fontSize: 48, mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    {selectedUser && selectedUser.userId === loggedInUserId
                      ? "You cannot chat with yourself"
                      : "Select a user to chat"}
                  </Typography>
                </Box>
              ) : (
                messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))
              )}
              <div ref={messagesEndRef} />
            </Box>

            {/* Typing Indicator */}
            <TypingIndicator />
          </Box>

          {/* Chat Input */}
          {selectedUser && selectedUser.userId !== loggedInUserId && (
            <ChatInput onSendMessage={handleSendMessage} />
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default ChatPage;
