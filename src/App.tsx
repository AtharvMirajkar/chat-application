import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { store } from './store/store';
import { useAppSelector, useAppDispatch } from './store/hooks';
import { lightTheme, darkTheme } from './theme/theme';
import { setUser } from './features/auth/authSlice';
import { socketService } from './services/socketService';

// Pages
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import GuestSetupPage from './pages/Guest/GuestSetupPage';
import ChatPage from './pages/Chat/ChatPage';

// Layout
import AppLayout from './components/Layout/AppLayout';

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isDarkMode } = useAppSelector((state) => state.theme);
  const { isAuthenticated, token } = useAppSelector((state) => state.auth);
  const { isGuestMode, sessionId, guestName } = useAppSelector((state) => state.guest);

  useEffect(() => {
    // Initialize socket connection if user is authenticated or in guest mode
    if (isAuthenticated && token) {
      socketService.connect(token);
    } else if (isGuestMode && sessionId && guestName) {
      socketService.connect(undefined, { sessionId, guestName });
    }

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, token, isGuestMode, sessionId, guestName]);

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppLayout>
          <Routes>
            <Route 
              path="/" 
              element={
                isAuthenticated || isGuestMode ? 
                <Navigate to="/chat" replace /> : 
                <Navigate to="/login" replace />
              } 
            />
            <Route 
              path="/login" 
              element={
                isAuthenticated || isGuestMode ? 
                <Navigate to="/chat" replace /> : 
                <LoginPage />
              } 
            />
            <Route 
              path="/register" 
              element={
                isAuthenticated || isGuestMode ? 
                <Navigate to="/chat" replace /> : 
                <RegisterPage />
              } 
            />
            <Route 
              path="/guest" 
              element={
                isAuthenticated || isGuestMode ? 
                <Navigate to="/chat" replace /> : 
                <GuestSetupPage />
              } 
            />
            <Route 
              path="/chat" 
              element={
                isAuthenticated || isGuestMode ? 
                <ChatPage /> : 
                <Navigate to="/login" replace />
              } 
            />
          </Routes>
        </AppLayout>
      </Router>
    </ThemeProvider>
  );
};

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;