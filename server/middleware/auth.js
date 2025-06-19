import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Optionally validate user from DB if needed
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = {
      id: decoded.userId,
      username: decoded.username,
      isGuest: decoded.isGuest || false,
      email: user.email, // From DB
    };

    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const authenticateSocket = (socket, next) => {
  try {
    const { token, guest, sessionId, guestName } = socket.handshake.auth;

    // Guest login
    if (guest && sessionId && guestName) {
      socket.user = {
        id: sessionId,
        username: guestName,
        isGuest: true,
      };
      return next();
    }

    if (!token) {
      return next(new Error('Authentication error: No token'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.user = {
      id: decoded.userId,
      username: decoded.username,
      isGuest: decoded.isGuest || false,
    };

    next();
  } catch (error) {
    console.error('Socket authentication error:', error.message);
    next(new Error('Authentication error: Invalid token'));
  }
};