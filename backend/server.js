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

    console.log('✅ Supabase login successful for:', data.user.email);

    const response = {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email
      }
    };

    console.log('Sending response with real token');
    res.json(response);

  } catch (error) {
    console.error('Login error:', error);
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

// DELETE ACCOUNT ENDPOINT
app.delete('/user/delete-account/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify the user is deleting their own account
    if (req.user.id !== userId && req.user.sub !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own account'
      });
    }

    console.log('🗑️ Starting account deletion for user:', userId);

    // Delete in order due to foreign key constraints

    // 1. Delete scenario progress - FIXED
    // First get all session IDs for this user
    const { data: userSessions, error: sessionsListError } = await supabase
      .from('user_sessions')
      .select('id')
      .eq('user_id', userId);

    if (!sessionsListError && userSessions && userSessions.length > 0) {
      const sessionIds = userSessions.map(session => session.id);

      const { error: progressError } = await supabase
        .from('scenario_progress')
        .delete()
        .in('session_id', sessionIds);

      if (progressError) {
        console.error('Error deleting scenario progress:', progressError);
      } else {
        console.log('✅ Deleted scenario progress');
      }
    }

    // 2. Delete user sessions
    const { error: sessionsError } = await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', userId);

    if (sessionsError) {
      console.error('Error deleting user sessions:', sessionsError);
    } else {
      console.log('✅ Deleted user sessions');
    }

    // 3. Delete user attempts
    const { error: attemptsError } = await supabase
      .from('user_attempts')
      .delete()
      .eq('user_id', userId);

    if (attemptsError) {
      console.error('Error deleting user attempts:', attemptsError);
    } else {
      console.log('✅ Deleted user attempts');
    }

    // 4. Delete user progress
    const { error: userProgressError } = await supabase
      .from('user_progress')
      .delete()
      .eq('user_id', userId);

    if (userProgressError) {
      console.error('Error deleting user progress:', userProgressError);
    } else {
      console.log('✅ Deleted user progress');
    }

    // 5. Delete profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
    } else {
      console.log('✅ Deleted profile');
    }

    // 6. Delete from Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Error deleting auth user:', authError);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete account from authentication system',
        error: authError.message
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

    const { data, error } = await supabase
      .from('user_progress')
      .upsert({
        user_id,
        current_category_id: parseInt(current_category_id),
        current_phase: parseInt(current_phase),
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