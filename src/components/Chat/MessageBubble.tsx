import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import { Message } from '../../features/chat/chatSlice';
import { useAppSelector } from '../../store/hooks';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { user } = useAppSelector((state) => state.auth);
  const { guestName } = useAppSelector((state) => state.guest);
  
  const isOwnMessage = message.senderId === user?.id || message.senderName === guestName;
  const isSystemMessage = message.type === 'system';

  if (isSystemMessage) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
        <Chip
          label={message.content}
          size="small"
          variant="outlined"
          sx={{ opacity: 0.7 }}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
        mb: 1,
        px: 1,
      }}
    >
      <Paper
        elevation={1}
        sx={{
          maxWidth: '70%',
          minWidth: '120px',
          p: 1.5,
          bgcolor: isOwnMessage
            ? 'primary.main'
            : 'background.paper',
          color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
          borderRadius: isOwnMessage
            ? '18px 18px 4px 18px'
            : '18px 18px 18px 4px',
        }}
      >
        {!isOwnMessage && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              opacity: 0.7,
              mb: 0.5,
              fontWeight: 500,
            }}
          >
            {message.senderName}
          </Typography>
        )}
        
        <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
          {message.content}
        </Typography>
        
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'right',
            opacity: 0.6,
            mt: 0.5,
          }}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Typography>
      </Paper>
    </Box>
  );
};

export default MessageBubble;