import React, { useState, useRef, useEffect } from "react";
import { Box, TextField, IconButton, Paper } from "@mui/material";
import { Send } from "@mui/icons-material";
import { socketService } from "../../services/socketService";
import { useAppSelector } from "../../store/hooks";

interface ChatInputProps {
  onSendMessage?: (message: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage }) => {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { currentChatRoom, selectedUser } = useAppSelector(
    (state) => state.chat
  );
  const { user } = useAppSelector((state) => state.auth);
  const { isGuestMode, sessionId } = useAppSelector((state) => state.guest);
  const loggedInUserId = user?.id;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      if (isGuestMode && sessionId) {
        // Send to guest session room
        socketService.sendMessage(message.trim(), `guest_session_${sessionId}`);
        onSendMessage?.(message.trim());
        setMessage("");
        handleStopTyping();
        return;
      }
      if (selectedUser && selectedUser.userId !== loggedInUserId) {
        socketService.sendMessage(
          message.trim(),
          currentChatRoom || undefined,
          selectedUser.userId
        );
        onSendMessage?.(message.trim());
        setMessage("");
        handleStopTyping();
      }
    }
  };

  const handleStartTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socketService.startTyping(currentChatRoom || undefined);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 3000);
  };

  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      socketService.stopTyping(currentChatRoom || undefined);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (e.target.value.trim()) {
      handleStartTyping();
    } else {
      handleStopTyping();
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Paper
      component="form"
      onSubmit={handleSendMessage}
      sx={{
        p: 2,
        display: "flex",
        alignItems: "center",
        gap: 1,
        borderRadius: 0,
        borderTop: 1,
        borderColor: "divider",
      }}
    >
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Type a message..."
        value={message}
        onChange={handleInputChange}
        onBlur={handleStopTyping}
        multiline
        maxRows={4}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: 3,
          },
        }}
      />
      <IconButton
        type="submit"
        color="primary"
        disabled={
          !message.trim() ||
          (isGuestMode && !sessionId) ||
          (!isGuestMode &&
            (!selectedUser || selectedUser.userId === loggedInUserId))
        }
        sx={{
          bgcolor: "primary.main",
          color: "primary.contrastText",
          "&:hover": {
            bgcolor: "primary.dark",
          },
          "&:disabled": {
            bgcolor: "action.disabledBackground",
          },
        }}
      >
        <Send />
      </IconButton>
    </Paper>
  );
};

export default ChatInput;
