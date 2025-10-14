// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authenticate } from './middleware/auth.js';
import { supabase } from './config/supabase.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Add debug logging
console.log('📧 EMAIL_USER:', process.env.EMAIL_USER);
console.log('🔑 EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✓ Set (' + process.env.EMAIL_PASSWORD.length + ' chars)' : '✗ Not set');

// Verify email configuration on startup
transporter.verify(function(error, success) {
  if (error) {
    console.error('❌ Email configuration error:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

// ===========================
// PASSWORD VALIDATION HELPER
// ===========================
const validatePassword = (password) => {
  const errors = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[./!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    errors.push('Password must contain at least one special character (./!@#$%^&*()_+-=[]{}|;:,.<>?)');
  }

  return errors;
};

// ===========================
// AUTHENTICATION ROUTES
// ===========================

app.post('/auth/login', async (req, res) => {
  try {
    console.log('Login request received:', req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    console.log('Attempting Supabase login for:', email);

    // First, authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password
    });

    if (error) {
      console.log('Supabase login error:', error.message);
      return res.status(401).json({ message: error.message || 'Invalid credentials' });
    }

    if (!data.user || !data.session) {
      console.log('No user or session returned from Supabase');
      return res.status(401).json({ message: 'Login failed' });
    }

    const userId = data.user.id;
    console.log('✅ Supabase authentication successful for:', data.user.email);

    // ============================================
    // 🆕 CHECK FOR EXISTING ACTIVE SESSION
    // ============================================

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('current_session_token, session_expires_at')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error checking profile:', profileError);
      return res.status(500).json({ message: 'Server error checking session' });
    }

    // Check if there's an active session
    if (profile?.current_session_token && profile?.session_expires_at) {
      const expiresAt = new Date(profile.session_expires_at);
      const now = new Date();

      // If session is still valid (not expired)
      if (expiresAt > now) {
        console.log('⚠️ User already has an active session');
        return res.status(409).json({
          message: 'You are already logged in on another device. Please logout from the other device first.',
          code: 'ALREADY_LOGGED_IN',
          session_expires_at: profile.session_expires_at
        });
      } else {
        console.log('⏰ Previous session expired, allowing new login');
      }
    }

    // ============================================
    // 🆕 SAVE NEW SESSION TOKEN
    // ============================================

    // Calculate session expiration (Supabase default is 1 hour)
    const sessionExpiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        current_session_token: data.session.access_token,
        session_created_at: new Date().toISOString(),
        session_expires_at: sessionExpiresAt.toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error saving session token:', updateError);
      // Don't fail login if we can't save the token, just log it
    } else {
      console.log('✅ Session token saved to database');
    }

    console.log('✅ Login successful - new session created');

    const response = {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===========================
// 🆕 LOGOUT ENDPOINT
// ===========================

app.post('/auth/logout', authenticate, async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;

    console.log('Logout request for user:', userId);

    // Clear session token from database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        current_session_token: null,
        session_created_at: null,
        session_expires_at: null
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error clearing session:', updateError);
      return res.status(500).json({
        message: 'Error during logout',
        error: updateError.message
      });
    }

    console.log('✅ User logged out successfully');

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      message: 'Server error during logout',
      error: error.message
    });
  }
});

// ===========================
// 🆕 OPTIONAL: FORCE LOGOUT FROM OTHER DEVICES
// ===========================

app.post('/auth/force-logout-others', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    console.log('Force logout requested for:', email);

    // Verify credentials first
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password
    });

    if (error || !data.user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const userId = data.user.id;

    // Clear the existing session
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        current_session_token: null,
        session_created_at: null,
        session_expires_at: null
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error clearing session:', updateError);
      return res.status(500).json({ message: 'Error clearing session' });
    }

    // Now create a new session
    const sessionExpiresAt = new Date(Date.now() + 3600000);

    await supabase
      .from('profiles')
      .update({
        current_session_token: data.session.access_token,
        session_created_at: new Date().toISOString(),
        session_expires_at: sessionExpiresAt.toISOString()
      })
      .eq('id', userId);

    console.log('✅ Other devices logged out, new session created');

    res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email
      },
      message: 'Other devices have been logged out'
    });

  } catch (error) {
    console.error('Force logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// NEW: Check username availability endpoint
app.get('/auth/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const usernameLower = username.toLowerCase().trim();

    console.log('Checking username availability for:', usernameLower);

    // Validate username format
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(usernameLower)) {
      return res.json({
        available: false,
        message: 'Username must be 3-20 characters and contain only letters, numbers, underscores, or hyphens'
      });
    }

    // Check in profiles table - FIXED: Removed problematic query
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', usernameLower)
      .maybeSingle();

    // Handle errors properly
    if (error) {
      console.error('Username check database error:', error);
      // Don't throw, return a safe response
      return res.json({
        available: false,
        message: 'Unable to check username availability'
      });
    }

    const available = !data;

    console.log('Username check result:', { username: usernameLower, available });

    res.json({
      available,
      message: available ? 'Username is available' : 'Username is already taken'
    });

  } catch (error) {
    console.error('Check username error:', error);
    res.status(500).json({
      error: 'Server error checking username',
      available: false
    });
  }
});

// NEW: Check email availability endpoint
app.get('/auth/check-email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const emailLower = email.toLowerCase().trim();

    console.log('Checking email availability for:', emailLower);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLower)) {
      return res.json({
        available: false,
        message: 'Invalid email format'
      });
    }

    // Check in Supabase Auth
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('Error listing users:', error);
      return res.json({
        available: false,
        message: 'Unable to check email availability'
      });
    }

    const emailExists = users.some(user =>
      user.email?.toLowerCase() === emailLower
    );

    console.log('Email check result:', { email: emailLower, exists: emailExists });

    res.json({
      available: !emailExists,
      message: emailExists ? 'Email is already registered' : 'Email is available'
    });

  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({
      error: 'Server error checking email',
      available: false
    });
  }
});

app.post('/auth/signup', async (req, res) => {
  const { email, password, username, firstName, lastName } = req.body;

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  // Validate password
  const passwordErrors = validatePassword(password);
  if (passwordErrors.length > 0) {
    return res.status(400).json({ error: passwordErrors.join(', ') });
  }

  // Validate username
  if (!username || username.trim().length < 3 || username.trim().length > 20) {
    return res.status(400).json({ error: 'Username must be 3-20 characters' });
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return res.status(400).json({ error: 'Username can only contain letters, numbers, underscores, and hyphens' });
  }

  // Validate first and last name
  if (!firstName || !firstName.trim()) {
    return res.status(400).json({ error: 'First name is required' });
  }
  if (!lastName || !lastName.trim()) {
    return res.status(400).json({ error: 'Last name is required' });
  }

  const usernameLower = username.toLowerCase().trim();
  const emailLower = email.toLowerCase().trim();
  const fullName = `${firstName.trim()} ${lastName.trim()}`;

  try {
    console.log('=== SIGNUP PROCESS START ===');
    console.log('Email:', emailLower);
    console.log('Username:', usernameLower);
    console.log('Full Name:', fullName);

    // 1. Check if username already exists in profiles
    const { data: existingUsername, error: usernameCheckError } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', usernameLower)
      .maybeSingle();

    if (usernameCheckError && usernameCheckError.code !== 'PGRST116') {
      console.error('Username check error:', usernameCheckError);
      throw usernameCheckError;
    }

    if (existingUsername) {
      console.log('❌ Username already taken');
      return res.status(400).json({
        error: 'Username is already taken'
      });
    }

    console.log('✅ Username available');

    // 2. Create user in Supabase Auth
    console.log('Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: emailLower,
      password: password,
      options: {
        data: {
          username: usernameLower,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: fullName
        },
        emailRedirectTo: undefined
      }
    });

    if (authError) {
      console.error('❌ Supabase signup error:', authError);
      return res.status(400).json({
        error: authError.message || 'Registration failed'
      });
    }

    if (!authData.user) {
      console.error('❌ No user returned from signup');
      return res.status(400).json({
        error: 'Registration failed - no user created'
      });
    }

    console.log('✅ Auth user created:', authData.user.id);

    // 3. Create profile entry
    console.log('Creating profile entry...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        username: usernameLower,
        full_name: fullName,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Profile creation error:', profileError);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({
        error: 'Failed to create user profile',
        details: profileError.message
      });
    }

    console.log('✅ Profile created successfully');

    // 4. Initialize user progress
    await supabase
      .from('user_progress')
      .insert({
        user_id: authData.user.id,
        current_phase: 1,
        current_category_id: 1,
        current_scenario_index: 0,
        completed_scenarios: [],
        phase_scores: { "1": 0, "2": 0, "3": 0 },
        total_score: 0
      });

    console.log('=== SIGNUP PROCESS COMPLETE ===');

    res.status(201).json({
      message: 'Account created successfully!',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username: usernameLower,
        full_name: fullName
      }
    });

  } catch (err) {
    console.error('❌ Signup error:', err);
    res.status(500).json({
      error: 'Server error during registration',
      details: err.message
    });
  }
});

// ===========================
// PASSWORD RESET ROUTES
// ===========================

// 1. Request Password Reset
app.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const emailLower = email.toLowerCase().trim();
    console.log('🔄 Password reset requested for:', emailLower);

    // Check if user exists in Supabase Auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      throw listError;
    }

    const user = users.find(u => u.email?.toLowerCase() === emailLower);

    // Don't reveal if user exists or not (security)
    if (!user) {
      console.log('⚠️ User not found, but returning success message');
      return res.status(200).json({ 
        message: 'If an account exists, a reset link has been sent to your email' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save token to profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry.toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error saving reset token:', updateError);
      throw updateError;
    }

    console.log('✅ Reset token generated and saved');

    // Create reset link (for mobile app deep linking)
    const resetLink = `roadcheck://reset-password?token=${resetToken}`;
    // For testing in Expo Go, use: 
    // const resetLink = `exp://192.168.x.x:8081/--/reset-password?token=${resetToken}`;

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: emailLower,
      subject: 'RoadCheck - Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4ef5a2;">RoadCheck Password Reset</h2>
          <p>You requested to reset your password.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetLink}" 
             style="display: inline-block; padding: 12px 24px; background-color: #4ef5a2; 
                    color: black; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">
            Reset Password
          </a>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 1 hour.
          </p>
          <p style="color: #666; font-size: 14px;">
            If you didn't request this, please ignore this email.
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            If the button doesn't work, copy and paste this link into your browser:<br/>
            ${resetLink}
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Reset email sent successfully');

    res.status(200).json({ 
      message: 'If an account exists, a reset link has been sent to your email' 
    });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// 2. Verify Reset Token
app.get('/auth/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, reset_token, reset_token_expiry')
      .eq('reset_token', token)
      .single();

    if (error || !profile) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Check if token is expired
    if (new Date() > new Date(profile.reset_token_expiry)) {
      return res.status(400).json({ message: 'Reset token has expired' });
    }

    // Get email from auth users
    const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(profile.id);

    res.status(200).json({ 
      message: 'Token is valid', 
      email: user?.email || null 
    });

  } catch (error) {
    console.error('❌ Token verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 3. Reset Password
app.post('/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    // Validate password
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      return res.status(400).json({ message: passwordErrors.join(', ') });
    }

    // Find user by token
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, reset_token, reset_token_expiry')
      .eq('reset_token', token)
      .single();

    if (error || !profile) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Check if token is expired
    if (new Date() > new Date(profile.reset_token_expiry)) {
      return res.status(400).json({ message: 'Reset token has expired' });
    }

    console.log('🔄 Updating password for user:', profile.id);

    // Update password in Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      profile.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      throw updateError;
    }

    // Clear reset token from profiles
    await supabase
      .from('profiles')
      .update({
        reset_token: null,
        reset_token_expiry: null
      })
      .eq('id', profile.id);

    console.log('✅ Password reset successful');

    res.status(200).json({ message: 'Password reset successful' });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// ADD THIS DIAGNOSTIC ENDPOINT TO CHECK EXISTING USERS
app.get('/auth/diagnostic/users', async (req, res) => {
  try {
    // Get all auth users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) throw authError;

    // Get all profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*');

    if (profileError) throw profileError;

    // Compare and find orphaned users
    const orphanedUsers = users.filter(user =>
      !profiles.some(profile => profile.id === user.id)
    );

    res.json({
      total_auth_users: users.length,
      total_profiles: profiles.length,
      orphaned_users: orphanedUsers.map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        metadata: u.user_metadata
      })),
      all_users: users.map(u => ({
        id: u.id,
        email: u.email,
        has_profile: profiles.some(p => p.id === u.id)
      }))
    });

  } catch (error) {
    console.error('Diagnostic error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ADD THIS ENDPOINT TO FIX ORPHANED USERS
app.post('/auth/fix-orphaned-users', async (req, res) => {
  try {
    console.log('Starting orphaned users fix...');

    // Get all auth users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;

    // Get all profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id');
    if (profileError) throw profileError;

    const profileIds = profiles.map(p => p.id);
    const orphanedUsers = users.filter(user => !profileIds.includes(user.id));

    console.log(`Found ${orphanedUsers.length} orphaned users`);

    const results = [];

    for (const user of orphanedUsers) {
      try {
        const username = user.user_metadata?.username ||
                        user.email?.split('@')[0] ||
                        `user_${user.id.substring(0, 8)}`;

        const fullName = user.user_metadata?.full_name ||
                        `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() ||
                        'Unknown User';

        console.log(`Creating profile for user ${user.id} with username: ${username}`);

        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: username.toLowerCase(),
            full_name: fullName,
            created_at: user.created_at
          })
          .select()
          .single();

        if (insertError) {
          console.error(`Failed to create profile for ${user.email}:`, insertError);
          results.push({
            user_id: user.id,
            email: user.email,
            success: false,
            error: insertError.message
          });
        } else {
          console.log(`✅ Profile created for ${user.email}`);

          // Also create user_progress
          await supabase
            .from('user_progress')
            .insert({
              user_id: user.id,
              current_phase: 1,
              current_category_id: 1,
              current_scenario_index: 0,
              completed_scenarios: [],
              phase_scores: { "1": 0, "2": 0, "3": 0 },
              total_score: 0
            });

          results.push({
            user_id: user.id,
            email: user.email,
            username: username,
            success: true
          });
        }
      } catch (err) {
        console.error(`Error processing user ${user.id}:`, err);
        results.push({
          user_id: user.id,
          email: user.email,
          success: false,
          error: err.message
        });
      }
    }

    res.json({
      message: 'Orphaned users processing complete',
      total_orphaned: orphanedUsers.length,
      results: results
    });

  } catch (error) {
    console.error('Fix orphaned users error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===========================
// CATEGORY & PHASE ROUTES
// ===========================

app.get('/categories', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .order('id');

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Error fetching categories',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error in /categories:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

app.get('/phases/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;

    const { data, error } = await supabase
      .from('phases')
      .select('id, name, category_id')
      .eq('category_id', categoryId)
      .order('id');

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Error fetching phases',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error in /phases/category/:categoryId:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// ===========================
// SCENARIO ROUTES
// ===========================

app.get('/scenarios', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('scenarios')
      .select('*');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/scenarios/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', id)
      .single();

    if (scenarioError) throw scenarioError;

    const { data: choices, error: choicesError } = await supabase
      .from('scenario_choices')
      .select('*')
      .eq('scenario_id', id);

    if (choicesError) throw choicesError;

    const response = {
      success: true,
      data: {
        question: scenario.description,
        options: choices.map(choice => choice.option),
        correct_answer: choices.find(choice => choice.is_correct)?.option,
        wrong_explanations: choices.reduce((acc, choice) => {
          if (!choice.is_correct && choice.explanation) {
            acc[choice.option] = choice.explanation;
          }
          return acc;
        }, {})
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get scenario error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/scenario_choices/:scenario_id', authenticate, async (req, res) => {
  try {
    const { scenario_id } = req.params;

    const { data, error } = await supabase
      .from('scenario_choices')
      .select('*')
      .eq('scenario_id', scenario_id);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Get choices error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===========================
// USER PROFILE ROUTES
// ===========================

app.get('/user/profile', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.sub || req.user.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/profiles/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('Fetching profile for userId:', userId);

    // First, check if profile exists
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, created_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Profile fetch error:', error);
      return res.status(400).json({
        success: false,
        message: 'Error fetching profile',
        error: error.message
      });
    }

    if (!data) {
      console.log('❌ No profile found for userId:', userId);

      // Try to get email from auth.users
      const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(userId);

      if (authError || !user) {
        return res.status(404).json({
          success: false,
          message: 'Profile and user not found',
          error: 'No profile or user exists'
        });
      }

      // User exists in auth but no profile - return minimal info
      console.log('⚠️ User exists in auth but no profile. Email:', user.email);
      return res.json({
        success: true,
        data: {
          id: userId,
          username: user.email?.split('@')[0] || 'user',
          email: user.email,
          missing_profile: true
        },
        warning: 'Profile not found in database, using auth data'
      });
    }

    console.log('✅ Profile found:', data);

    // Get email from auth
    const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(userId);

    res.json({
      success: true,
      data: {
        ...data,
        email: user?.email || null
      }
    });
  } catch (error) {
    console.error('Error in /profiles/:userId:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

app.delete('/user/delete-account/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify the user is deleting their own account
    // req.user.sub contains the user ID from JWT token
    if (req.user.sub !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own account'
      });
    }

    console.log('🗑️ Starting account deletion for user:', userId);

    // Use a transaction-like approach - collect all errors
    const errors = [];

    // 1. Delete scenario progress
    try {
      const { data: userSessions, error: sessionsListError } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('user_id', userId);

      if (sessionsListError) {
        throw new Error(`Sessions list error: ${sessionsListError.message}`);
      }

      if (userSessions && userSessions.length > 0) {
        const sessionIds = userSessions.map(session => session.id);

        const { error: progressError } = await supabase
          .from('scenario_progress')
          .delete()
          .in('session_id', sessionIds);

        if (progressError) {
          throw new Error(`Progress deletion error: ${progressError.message}`);
        }
        console.log('✅ Deleted scenario progress');
      }
    } catch (error) {
      console.error('Error deleting scenario progress:', error);
      errors.push({ table: 'scenario_progress', error: error.message });
    }

    // 2. Delete user sessions
    try {
      const { error: sessionsError } = await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', userId);

      if (sessionsError) {
        throw new Error(`Sessions deletion error: ${sessionsError.message}`);
      }
      console.log('✅ Deleted user sessions');
    } catch (error) {
      console.error('Error deleting user sessions:', error);
      errors.push({ table: 'user_sessions', error: error.message });
    }

    // 3. Delete user attempts
    try {
      const { error: attemptsError } = await supabase
        .from('user_attempts')
        .delete()
        .eq('user_id', userId);

      if (attemptsError) {
        throw new Error(`Attempts deletion error: ${attemptsError.message}`);
      }
      console.log('✅ Deleted user attempts');
    } catch (error) {
      console.error('Error deleting user attempts:', error);
      errors.push({ table: 'user_attempts', error: error.message });
    }

    // 4. Delete user progress
    try {
      const { error: userProgressError } = await supabase
        .from('user_progress')
        .delete()
        .eq('user_id', userId);

      if (userProgressError) {
        throw new Error(`User progress deletion error: ${userProgressError.message}`);
      }
      console.log('✅ Deleted user progress');
    } catch (error) {
      console.error('Error deleting user progress:', error);
      errors.push({ table: 'user_progress', error: error.message });
    }

    // 5. Delete profile
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        throw new Error(`Profile deletion error: ${profileError.message}`);
      }
      console.log('✅ Deleted profile');
    } catch (error) {
      console.error('Error deleting profile:', error);
      errors.push({ table: 'profiles', error: error.message });
    }

    // 6. Delete from Supabase Auth (most critical step)
    try {
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) {
        throw new Error(`Auth deletion error: ${authError.message}`);
      }
      console.log('✅ Deleted auth user');
    } catch (error) {
      console.error('Error deleting auth user:', error);
      // If auth deletion fails, this is critical
      return res.status(500).json({
        success: false,
        message: 'Failed to delete account from authentication system',
        error: error.message,
        partialErrors: errors
      });
    }

    // Check if there were any non-critical errors
    if (errors.length > 0) {
      console.warn('⚠️ Account deleted with some errors:', errors);
      return res.json({
        success: true,
        message: 'Account deleted successfully (with some warnings)',
        warnings: errors
      });
    }

    console.log('✅ Account deleted successfully for user:', userId);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account',
      error: error.message
    });
  }
});

// ===========================
// USER PROGRESS ROUTES
// ===========================

app.get('/user-progress/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.json({
          success: true,
          data: {
            user_id: userId,
            current_phase: 1,
            current_category_id: 1,
            current_scenario_index: 0,
            completed_scenarios: [],
            phase_scores: {"1": 0, "2": 0, "3": 0},
            total_score: 0,
            last_scenario_id: null
          }
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Error fetching user progress',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error in /user-progress/:userId:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

app.put('/user-progress', async (req, res) => {
  try {
    const { user_id, current_category_id, current_phase, current_scenario_index } = req.body;

    // Convert display phase to database phase ID
    let actualPhaseId = parseInt(current_phase);
    const categoryId = parseInt(current_category_id);

    if (categoryId === 2) {
      actualPhaseId = actualPhaseId + 3;  // Traffic Signs: 1,2,3 → 4,5,6
    } else if (categoryId === 3) {
      actualPhaseId = actualPhaseId + 6;  // Intersection: 1,2,3 → 7,8,9
    }
    // categoryId 1 stays the same (1,2,3)
    // categoryId 4 stays as 1 → will need phase 10

    const { data, error } = await supabase
      .from('user_progress')
      .upsert({
        user_id,
        current_category_id: categoryId,
        current_phase: actualPhaseId,  // ✅ Now using correct DB phase ID
        current_scenario_index: parseInt(current_scenario_index),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Error updating user progress',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: data,
      message: 'User progress updated successfully'
    });
  } catch (error) {
    console.error('Error in PUT /user-progress:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Track category selection (for both Driver and Pedestrian)
app.post('/progress/select-category', async (req, res) => {
  try {
    const { user_id, category_id } = req.body;

    console.log('Category selected:', { user_id, category_id });

    const { data, error } = await supabase
      .from('user_progress')
      .upsert({
        user_id,
        current_category_id: parseInt(category_id),
        current_phase: 1,
        current_scenario_index: 0,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error tracking category:', error);
      return res.status(400).json({
        success: false,
        message: 'Error tracking category selection',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: data,
      message: 'Category tracked successfully'
    });
  } catch (error) {
    console.error('Error in /progress/select-category:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get progress for specific category
app.get('/progress/category/:userId/:categoryId', async (req, res) => {
  try {
    const { userId, categoryId } = req.params;

    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('current_category_id', categoryId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      return res.status(400).json({
        success: false,
        message: 'Error fetching category progress',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: data || null
    });
  } catch (error) {
    console.error('Error in /progress/category:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

app.post('/progress/category', authenticate, async (req, res) => {
  try {
    const { category_id } = req.body;
    const user_id = req.user.id;

    const { data, error } = await supabase
      .from('user_progress')
      .upsert({
        user_id,
        current_category_id: parseInt(category_id),
        current_phase: 1,
        current_scenario_index: 0,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/progress/phase', authenticate, async (req, res) => {
  try {
    const { phase } = req.body;
    const user_id = req.user.id;

    const { data, error } = await supabase
      .from('user_progress')
      .update({
        current_phase: parseInt(phase),
        current_scenario_index: 0,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user_id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===========================
// USER ATTEMPTS & STATS ROUTES
// ===========================

app.post('/attempts', authenticate, async (req, res) => {
  try {
    console.log("=== ATTEMPTS DEBUG ===");
    console.log("Full request body:", req.body);
    console.log("User from auth:", req.user);
    console.log("===================");

    const { scenario_id, selected_option } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "User not authenticated properly" });
    }

    const user_id = req.user.id;

    console.log("Extracted values:", { scenario_id, selected_option, user_id });

    if (!scenario_id || !selected_option) {
      return res.status(400).json({
        error: "Missing required fields",
        received: { scenario_id, selected_option, user_id }
      });
    }

    const { data: correctChoice, error: choiceError } = await supabase
      .from('scenario_choices')
      .select('*')
      .eq('scenario_id', scenario_id)
      .eq('is_correct', true)
      .single();

    if (choiceError) {
      console.error("Choice error:", choiceError);
      return res.status(500).json({ error: "Failed to get correct answer" });
    }

    const is_correct = correctChoice.option === selected_option;

    console.log("About to insert:", {
      user_id,
      scenario_id,
      chosen_option: selected_option,
      is_correct
    });

    const { data: attempt, error: attemptError } = await supabase
      .from('user_attempts')
      .insert({
        user_id,
        scenario_id: parseInt(scenario_id),
        chosen_option: selected_option,
        is_correct
      })
      .select()
      .single();

    if (attemptError) {
      console.error("Database insert error:", attemptError);
      return res.status(500).json({ error: "Failed to save attempt", details: attemptError });
    }

    res.json({ is_correct, attempt });

  } catch (error) {
    console.error("Attempts endpoint error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get('/attempts/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { category, phase } = req.query;

    console.log('Fetching attempts for user:', userId, { category, phase });

    let query = supabase
      .from('user_attempts')
      .select(`
        *,
        scenarios!inner(
          id,
          title,
          phase_id,
          phases!inner(
            id,
            name,
            category_id
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply filters if provided
    if (category) {
      query = query.eq('scenarios.phases.category_id', parseInt(category));
    }

    if (phase) {
      query = query.eq('scenarios.phase_id', parseInt(phase));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching attempts:', error);
      return res.status(400).json({
        success: false,
        message: 'Error fetching user attempts',
        error: error.message
      });
    }

    // Transform data to flatten the structure
    const transformedData = data.map(attempt => ({
      id: attempt.id,
      user_id: attempt.user_id,
      scenario_id: attempt.scenario_id,
      chosen_option: attempt.chosen_option,
      is_correct: attempt.is_correct,
      created_at: attempt.created_at,
      scenario_title: attempt.scenarios?.title,
      phase_id: attempt.scenarios?.phase_id,
      phase_name: attempt.scenarios?.phases?.name,
      category_id: attempt.scenarios?.phases?.category_id
    }));

    res.json({
      success: true,
      data: transformedData,
      count: transformedData.length
    });

  } catch (error) {
    console.error('Error in /attempts/user/:userId:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// ============================================
// 🆕 ALTERNATIVE: If you want a simpler version without joins
// ============================================

app.get('/attempts/user/:userId/simple', async (req, res) => {
  try {
    const { userId } = req.params;
    const { category, phase, scenario_id } = req.query;

    let query = supabase
      .from('user_attempts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Filter by specific scenario if provided
    if (scenario_id) {
      query = query.eq('scenario_id', parseInt(scenario_id));
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // If category/phase filters provided, need to get scenarios first
    let filteredData = data;

    if (category || phase) {
      const { data: scenarios } = await supabase
        .from('scenarios')
        .select('id, phase_id');

      const scenarioMap = {};
      scenarios.forEach(s => {
        scenarioMap[s.id] = s.phase_id;
      });

      // Get phases for category filtering
      if (category) {
        const { data: phases } = await supabase
          .from('phases')
          .select('id')
          .eq('category_id', parseInt(category));

        const phaseIds = phases.map(p => p.id);

        filteredData = data.filter(attempt => {
          const phaseId = scenarioMap[attempt.scenario_id];
          return phaseIds.includes(phaseId);
        });
      }

      if (phase) {
        filteredData = data.filter(attempt => {
          return scenarioMap[attempt.scenario_id] === parseInt(phase);
        });
      }
    }

    res.json({
      success: true,
      data: filteredData,
      count: filteredData.length
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 📊 BONUS: Get attempts summary/statistics
// ============================================

app.get('/attempts/user/:userId/summary', async (req, res) => {
  try {
    const { userId } = req.params;
    const { category, phase } = req.query;

    let query = supabase
      .from('user_attempts')
      .select('is_correct, scenario_id')
      .eq('user_id', userId);

    const { data: attempts, error } = await query;

    if (error) throw error;

    // Calculate summary statistics
    const total = attempts.length;
    const correct = attempts.filter(a => a.is_correct).length;
    const uniqueScenarios = [...new Set(attempts.map(a => a.scenario_id))].length;

    const summary = {
      total_attempts: total,
      correct_attempts: correct,
      incorrect_attempts: total - correct,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      unique_scenarios_attempted: uniqueScenarios
    };

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/user-progress/scenario', async (req, res) => {
  try {
    const { user_id, scenario_id, selected_answer, is_correct } = req.body;

    const { data: attemptData, error: attemptError } = await supabase
      .from('user_attempts')
      .insert({
        user_id,
        scenario_id: parseInt(scenario_id),
        chosen_option: selected_answer,
        is_correct,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (attemptError) {
      return res.status(400).json({
        success: false,
        message: 'Error recording user attempt',
        error: attemptError.message
      });
    }

    if (is_correct) {
      const { data: currentProgress } = await supabase
        .from('user_progress')
        .select('completed_scenarios, total_score, user_id')
        .eq('user_id', user_id)
        .single();

      if (currentProgress) {
        const completedScenarios = currentProgress.completed_scenarios || [];
        const scenarioIdInt = parseInt(scenario_id);

        if (!completedScenarios.includes(scenarioIdInt)) {
          completedScenarios.push(scenarioIdInt);
        }

        const newTotalScore = (currentProgress.total_score || 0) + 10;

        await supabase
          .from('user_progress')
          .update({
            completed_scenarios: completedScenarios,
            total_score: newTotalScore,
            last_scenario_id: scenarioIdInt,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user_id);
      }
    }

    res.json({
      success: true,
      data: attemptData,
      message: 'User attempt recorded successfully'
    });
  } catch (error) {
    console.error('Error in /user-progress/scenario:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

app.get('/user-stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // ✅ Make sure this gets ALL 4 categories including Pedestrian
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name');

    if (categoriesError) {
      return res.status(400).json({
        success: false,
        message: 'Error fetching categories',
        error: categoriesError.message
      });
    }

    const stats = {};

    for (const category of categories) {
      const categoryKey = category.name.toLowerCase().replace(/\s+/g, '_');

      try {
        const { data: phases } = await supabase
          .from('phases')
          .select('id')
          .eq('category_id', category.id);

        if (!phases || phases.length === 0) {
          stats[categoryKey] = {
            total_scenarios: category.id === 4 ? 10 : 30, // ✅ 10 for pedestrian
            completed_scenarios: 0,
            correct_answers: 0
          };
          continue;
        }

        const phaseIds = phases.map(p => p.id);
        const { data: scenarios } = await supabase
          .from('scenarios')
          .select('id')
          .in('phase_id', phaseIds);

        if (!scenarios || scenarios.length === 0) {
          stats[categoryKey] = {
            total_scenarios: 30,
            completed_scenarios: 0,
            correct_answers: 0
          };
          continue;
        }

        const scenarioIds = scenarios.map(s => s.id);

        const { data: correctAttempts } = await supabase
          .from('user_attempts')
          .select('scenario_id')
          .eq('user_id', userId)
          .eq('is_correct', true)
          .in('scenario_id', scenarioIds);

        const uniqueCorrectScenarios = correctAttempts
          ? [...new Set(correctAttempts.map(a => a.scenario_id))]
          : [];

        const { data: allAttempts } = await supabase
          .from('user_attempts')
          .select('scenario_id')
          .eq('user_id', userId)
          .in('scenario_id', scenarioIds);

        const uniqueAttemptedScenarios = allAttempts
          ? [...new Set(allAttempts.map(a => a.scenario_id))]
          : [];

        stats[categoryKey] = {
          total_scenarios: 30,
          completed_scenarios: uniqueAttemptedScenarios.length,
          correct_answers: uniqueCorrectScenarios.length
        };

      } catch (err) {
        console.error(`Error processing category ${category.name}:`, err);
        stats[categoryKey] = {
          total_scenarios: 30,
          completed_scenarios: 0,
          correct_answers: 0
        };
      }
    }

    res.json({
          success: true,
          data: stats
        });
      } catch (error) {
        console.error('Error in /user-stats/:userId:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          error: error.message
        });
      }
    });

app.post('/sessions/start', async (req, res) => {
  try {
    const { user_id, category_id, phase_id } = req.body;

    if (!user_id || !category_id || !phase_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: user_id, category_id, phase_id'
      });
    }

    const { data, error } = await supabase
      .from('user_sessions')
      .insert({
        user_id,
        category_id: parseInt(category_id),
        phase_id: parseInt(phase_id),
        status: 'in_progress'
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Error creating session',
        error: error.message
      });
    }

    const scenarioProgressData = [];
    for (let i = 1; i <= 10; i++) {
      scenarioProgressData.push({
        session_id: data.id,
        scenario_id: i,
        scenario_number: i,
        is_attempted: false,
        is_correct: false
      });
    }

    const { error: progressError } = await supabase
      .from('scenario_progress')
      .insert(scenarioProgressData);

    if (progressError) {
      console.warn('Error creating scenario progress records:', progressError);
    }

    res.json({
      success: true,
      data: data,
      message: 'Session started successfully'
    });

  } catch (error) {
    console.error('Error in /sessions/start:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// TEST EMAIL ENDPOINT
app.post('/test-email', async (req, res) => {
  try {
    console.log('📧 Sending test email to:', process.env.EMAIL_USER);
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'RoadCheck Email Test',
      html: '<h1>✅ Email configuration works!</h1><p>Your email setup is ready for password resets!</p>'
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent:', info.messageId);
    
    res.json({ 
      success: true, 
      message: 'Test email sent! Check your inbox.',
      messageId: info.messageId 
    });
  } catch (error) {
    console.error('❌ Email test failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.put('/sessions/:sessionId/scenario/:scenarioId', async (req, res) => {
  const { sessionId, scenarioId } = req.params;
  const { selected_answer, is_correct, time_taken_seconds } = req.body;

  try {
    console.log('Updating scenario progress:', {
      sessionId,
      scenarioId,
      selected_answer,
      is_correct,
      time_taken_seconds
    });

    const { data: sessionData, error: sessionError } = await supabase
      .from('user_sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      console.error('Error fetching session:', sessionError);
      throw sessionError;
    }

    console.log('Session user_id:', sessionData.user_id);

    const scenarioNumber = ((parseInt(scenarioId) - 1) % 10) + 1;
    console.log('Calculated scenario_number:', scenarioNumber);

    const { data, error } = await supabase
      .from('scenario_progress')
      .update({
        scenario_id: parseInt(scenarioId),
        selected_answer,
        is_correct,
        time_taken_seconds,
        is_attempted: true,
        attempted_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .eq('scenario_number', scenarioNumber)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Updated scenario progress:', data);

    const { data: attemptData, error: attemptError } = await supabase
      .from('user_attempts')
      .insert({
        user_id: sessionData.user_id,
        scenario_id: parseInt(scenarioId),
        chosen_option: selected_answer,
        is_correct
      });

    if (attemptError) {
      console.error('Error inserting user attempt:', attemptError);
    } else {
      console.log('✅ User attempt saved successfully');
    }

    res.json({ success: true, data });

  } catch (error) {
    console.error('Error updating scenario progress:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating scenario progress',
      error: error.message
    });
  }
});

app.get('/sessions/:sessionId/progress', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const { data: session, error: sessionError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      return res.status(400).json({
        success: false,
        message: 'Error fetching session',
        error: sessionError.message
      });
    }

    const { data: scenarios, error: scenariosError } = await supabase
      .from('scenario_progress')
      .select('*')
      .eq('session_id', sessionId)
      .order('scenario_number');

    if (scenariosError) {
      return res.status(400).json({
        success: false,
        message: 'Error fetching scenario progress',
        error: scenariosError.message
      });
    }

    const attemptedScenarios = scenarios.filter(s => s.is_attempted);
    const correctScenarios = scenarios.filter(s => s.is_correct);
    const totalTime = scenarios.reduce((sum, s) => sum + (s.time_taken_seconds || 0), 0);

    const summary = {
      total_scenarios: scenarios.length,
      attempted_scenarios: attemptedScenarios.length,
      correct_scenarios: correctScenarios.length,
      accuracy: attemptedScenarios.length > 0
        ? Math.round((correctScenarios.length / attemptedScenarios.length) * 100)
        : 0,
      total_time_seconds: totalTime,
      current_scenario: attemptedScenarios.length + 1
    };

    res.json({
      success: true,
      data: {
        session,
        scenarios,
        summary
      }
    });

  } catch (error) {
    console.error('Error in /sessions/:sessionId/progress:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

app.put('/sessions/:sessionId/complete', async (req, res) => {
  console.log('🔍 Complete session called for:', req.params.sessionId);
  console.log('🔍 Request body:', req.body);
  try {
    const { sessionId } = req.params;
    const { total_time_seconds, total_score } = req.body;

    const { data, error } = await supabase
      .from('user_sessions')
      .update({
        session_completed_at: new Date().toISOString(),
        total_time_seconds: parseInt(total_time_seconds) || 0,
        total_score: parseInt(total_score) || 0,
        status: 'completed'
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Error completing session',
        error: error.message
      });
    }
    console.log('✅ Session completed successfully');
    res.json({
      success: true,
      data: data,
      message: 'Session completed successfully'
    });

  } catch (error) {
    console.error('Error in /sessions/:sessionId/complete:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

app.get('/users/:userId/recent-sessions', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const { data, error } = await supabase
      .from('user_sessions')
      .select(`
        *,
        categories(name),
        phases(name)
      `)
      .eq('user_id', userId)
      .order('session_started_at', { ascending: false })
      .limit(limit);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Error fetching user sessions',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Error in /users/:userId/recent-sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

app.get('/api/scenarios', async (req, res) => {
  try {
    const { start_id, end_id } = req.query;

    const { data, error } = await supabase
      .from('scenarios')
      .select(`
        id,
        title,
        description,
        phases(
          id,
          name,
          categories(
            id,
            name
          )
        )
      `)
      .gte('id', start_id || 1)
      .lte('id', end_id || 100)
      .order('id');

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    res.status(500).json({ error: 'Failed to fetch scenarios' });
  }
});

app.get('/api/scenario-choices', async (req, res) => {
  try {
    const { start_id, end_id, scenario_ids } = req.query;

    let query = supabase
      .from('scenario_choices')
      .select('*');

    if (scenario_ids) {
      const ids = scenario_ids.split(',').map(id => parseInt(id));
      query = query.in('scenario_id', ids);
    } else if (start_id && end_id) {
      query = query.gte('id', start_id).lte('id', end_id);
    }

    const { data, error } = await query.order('scenario_id').order('id');

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error fetching scenario choices:', error);
    res.status(500).json({ error: 'Failed to fetch scenario choices' });
  }
});

app.get('/api/scenarios-with-choices', async (req, res) => {
  try {
    const { scenario_start, scenario_end } = req.query;

    const { data: scenarios, error: scenariosError } = await supabase
      .from('scenarios')
      .select(`
        id,
        title,
        description,
        scenario_choices(
          id,
          option,
          text,
          is_correct,
          explanation
        )
      `)
      .gte('id', scenario_start || 41)
      .lte('id', scenario_end || 50)
      .order('id');

    if (scenariosError) throw scenariosError;

    res.json(scenarios);
  } catch (error) {
    console.error('Error fetching scenarios with choices:', error);
    res.status(500).json({ error: 'Failed to fetch scenarios with choices' });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`🚀 RoadCheck Server running on port ${PORT}`);
});