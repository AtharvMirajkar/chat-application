import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Collapse,
  IconButton,
} from '@mui/material';
import { Circle, ExpandMore, ExpandLess, People } from '@mui/icons-material';
import { useAppSelector } from '../../store/hooks';

interface OnlineUsersProps {
  collapsed?: boolean;
}

const OnlineUsers: React.FC<OnlineUsersProps> = ({ collapsed = false }) => {
  const [expanded, setExpanded] = React.useState(!collapsed);
  const { onlineUsers } = useAppSelector((state) => state.chat);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <Paper 
      sx={{ 
        m: 1, 
        overflow: 'hidden',
        borderRadius: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 1,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          cursor: collapsed ? 'pointer' : 'default',
        }}
        onClick={collapsed ? toggleExpanded : undefined}
      >
        <People sx={{ mr: 1 }} />
        <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
          Online ({onlineUsers.length})
        </Typography>
        {collapsed && (
          <IconButton
            size="small"
            sx={{ color: 'inherit' }}
            onClick={toggleExpanded}
          >
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        )}
      </Box>
      
      <Collapse in={expanded}>
        <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
          {onlineUsers.length === 0 ? (
            <ListItem>
              <ListItemText 
                primary="No users online" 
                sx={{ textAlign: 'center', opacity: 0.6 }}
              />
            </ListItem>
          ) : (
            onlineUsers.map((userId, index) => (
              <ListItem key={index}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Circle 
                    sx={{ 
                      fontSize: 12, 
                      color: 'success.main',
                    }} 
                  />
                </ListItemIcon>
                <ListItemText 
                  primary={userId}
                  primaryTypographyProps={{
                    variant: 'body2',
                  }}
                />
              </ListItem>
            ))
          )}
        </List>
      </Collapse>
    </Paper>
  );
};

export default OnlineUsers;