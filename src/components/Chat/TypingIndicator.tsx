import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { useAppSelector } from '../../store/hooks';

const TypingIndicator: React.FC = () => {
  const { typingUsers } = useAppSelector((state) => state.chat);
  const { user } = useAppSelector((state) => state.auth);
  const { guestName } = useAppSelector((state) => state.guest);

  const currentUserId = user?.id || guestName;
  const otherTypingUsers = typingUsers.filter(userId => userId !== currentUserId);

  if (otherTypingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (otherTypingUsers.length === 1) {
      return `${otherTypingUsers[0]} is typing...`;
    } else if (otherTypingUsers.length === 2) {
      return `${otherTypingUsers.join(' and ')} are typing...`;
    } else {
      return 'Several people are typing...';
    }
  };

  return (
    <Box sx={{ px: 2, py: 1 }}>
      <Chip
        label={getTypingText()}
        size="small"
        variant="outlined"
        sx={{
          opacity: 0.7,
          animation: 'pulse 1.5s ease-in-out infinite',
          '@keyframes pulse': {
            '0%': {
              opacity: 0.4,
            },
            '50%': {
              opacity: 0.8,
            },
            '100%': {
              opacity: 0.4,
            },
          },
        }}
      />
    </Box>
  );
};

export default TypingIndicator;