import { supabase } from '../config/supabase.js';
import jwt from 'jsonwebtoken';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // First, verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.log('Supabase auth error:', error?.message);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // 🆕 NEW: Check if this token matches the current session in database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('current_session_token, session_expires_at')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error checking profile session:', profileError);
      // Allow the request to continue if we can't check the profile
      req.user = user;
      return next();
    }

    // Check if there's a session token stored
    if (profile.current_session_token) {
      // Check if the current token matches the stored token
      if (profile.current_session_token !== token) {
        console.log('Token mismatch - session was ended on another device');
        return res.status(401).json({
          error: 'Session ended',
          code: 'SESSION_ENDED_OTHER_DEVICE',
          message: 'Your session was ended because you logged in on another device'
        });
      }

      // Check if session has expired
      if (profile.session_expires_at) {
        const expiresAt = new Date(profile.session_expires_at);
        const now = new Date();

        if (now > expiresAt) {
          console.log('Session expired');
          return res.status(401).json({
            error: 'Session expired',
            code: 'SESSION_EXPIRED'
          });
        }
      }
    }

    // Token is valid and matches current session
    req.user = user;
    next();

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};