import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Logout, Chat, Brightness4, Brightness7 } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../features/auth/authSlice';
import { toggleTheme } from '../../features/theme/themeSlice';
import { clearGuestSession } from '../../features/guest/guestSlice';
import { socketService } from '../../services/socketService';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { guestName, isGuestMode } = useAppSelector((state) => state.guest);
  const { isDarkMode } = useAppSelector((state) => state.theme);

  const handleLogout = () => {
    socketService.disconnect();
    if (isGuestMode) {
      dispatch(clearGuestSession());
    } else {
      dispatch(logout());
    }
  };

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  const displayName = isGuestMode ? guestName : user?.username;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar position="static" elevation={2}>
        <Toolbar>
          <Chat sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            RealTime Chat
          </Typography>
          
          {(isAuthenticated || isGuestMode) && (
            <>
              <Typography variant="body1" sx={{ mr: 2 }}>
                {displayName} {isGuestMode && '(Guest)'}
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={isDarkMode}
                    onChange={handleThemeToggle}
                    icon={<Brightness7 />}
                    checkedIcon={<Brightness4 />}
                  />
                }
                label=""
                sx={{ mr: 1 }}
              />
              
              <IconButton
                color="inherit"
                onClick={handleLogout}
                aria-label="logout"
              >
                <Logout />
              </IconButton>
            </>
          )}
        </Toolbar>
      </AppBar>
      
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {children}
      </Box>
    </Box>
  );
};

export default AppLayout;