import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { PersonAdd, Chat, VpnKey, Login } from '@mui/icons-material';
import { useAppDispatch } from '../../store/hooks';
import { setGuestSession } from '../../features/guest/guestSlice';
import { useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';

const GuestSetupPage: React.FC = () => {
  const [guestName, setGuestName] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleCreateSession = async () => {
    if (!guestName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const newSessionId = nanoid(8).toUpperCase();
      dispatch(setGuestSession({ 
        sessionId: newSessionId, 
        guestName: guestName.trim() 
      }));
      navigate('/chat');
    } catch (err) {
      setError('Failed to create session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSession = async () => {
    if (!guestName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!sessionCode.trim()) {
      setError('Please enter a session code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      dispatch(setGuestSession({ 
        sessionId: sessionCode.trim().toUpperCase(), 
        guestName: guestName.trim() 
      }));
      navigate('/chat');
    } catch (err) {
      setError('Failed to join session');
    } finally {
      setIsLoading(false);
    }
  };

  const generateRandomCode = () => {
    setSessionCode(nanoid(8).toUpperCase());
  };

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={4}
          sx={{
            p: 4,
            borderRadius: 3,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <Chat sx={{ fontSize: 40, color: 'primary.main', mr: 1 }} />
            <Typography component="h1" variant="h4" fontWeight="600">
              Guest Chat
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 4 }}>
            <Typography variant="body2">
              <strong>Guest Mode:</strong> Your chat will be temporary and won't be saved permanently. 
              For persistent chat history, please create an account.
            </Typography>
          </Alert>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 4 }}>
            <TextField
              fullWidth
              label="Your Name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Enter your display name"
              sx={{ mb: 3 }}
              inputProps={{ maxLength: 30 }}
              helperText="This name will be visible to other users"
            />
          </Box>

          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PersonAdd sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" fontWeight="600">
                    Create New Session
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Start a new chat session and share the session code with others to join.
                </Typography>
                <LoadingButton
                  fullWidth
                  variant="contained"
                  loading={isLoading}
                  onClick={handleCreateSession}
                  disabled={!guestName.trim()}
                  sx={{ py: 1.5 }}
                >
                  Create Session
                </LoadingButton>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Login sx={{ mr: 1, color: 'secondary.main' }} />
                  <Typography variant="h6" fontWeight="600">
                    Join Existing Session
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Enter a session code shared by someone to join their chat.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Session Code"
                    value={sessionCode}
                    onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                    placeholder="e.g., ABC123XY"
                    inputProps={{ maxLength: 12 }}
                  />
                  <Button
                    variant="outlined"
                    onClick={generateRandomCode}
                    sx={{ minWidth: 'auto', px: 2 }}
                  >
                    <VpnKey />
                  </Button>
                </Box>
                <LoadingButton
                  fullWidth
                  variant="contained"
                  color="secondary"
                  loading={isLoading}
                  onClick={handleJoinSession}
                  disabled={!guestName.trim() || !sessionCode.trim()}
                  sx={{ py: 1.5 }}
                >
                  Join Session
                </LoadingButton>
              </CardContent>
            </Card>
          </Box>

          <Divider sx={{ my: 4 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Want to save your chat history and have a permanent account?
            </Typography>
            <Button
              variant="outlined"
              onClick={() => navigate('/register')}
              sx={{ mr: 2 }}
            >
              Create Account
            </Button>
            <Button
              variant="text"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default GuestSetupPage;