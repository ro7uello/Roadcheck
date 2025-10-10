// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authenticate } from './middleware/auth.js';
import { supabase } from './config/supabase.js';
import { body, validationResult } from 'express-validator';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

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

    // Validate username format
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
      return res.json({
        available: false,
        message: 'Username must be 3-20 characters and contain only letters, numbers, underscores, or hyphens'
      });
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    const available = !data;

    res.json({
      available,
      message: available ? 'Username is available' : 'Username is already taken'
    });

  } catch (error) {
    console.error('Check username error:', error);
    res.status(500).json({ error: 'Server error checking username' });
  }
});

// NEW: Check email availability endpoint
app.get('/auth/check-email/:email', async (req, res) => {
  try {
    const { email } = req.params;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.json({
        available: false,
        message: 'Invalid email format'
      });
    }

    // Check in Supabase Auth using admin API
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('Error listing users:', error);
      throw error;
    }

    const emailExists = users.some(user =>
      user.email?.toLowerCase() === email.toLowerCase()
    );

    res.json({
      available: !emailExists,
      message: emailExists ? 'Email is already registered' : 'Email is available'
    });

  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ error: 'Server error checking email' });
  }
});

app.post('/auth/signup', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').custom((value) => {
    const errors = validatePassword(value);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
    return true;
  }),
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters')
    .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Username can only contain letters, numbers, underscores, and hyphens')
    .notEmpty().withMessage('Username is required'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required')
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { email, password, username, firstName, lastName } = req.body;
  const usernameLower = username.toLowerCase().trim();

  try {
    console.log('Signup request received:', { email, username: usernameLower, firstName, lastName });

    // Check if username already exists
    const { data: existingUsername } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', usernameLower)
      .single();

    if (existingUsername) {
      return res.status(400).json({
        error: 'Username is already taken'
      });
    }

    // Use Supabase Auth to create user
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: {
          username: usernameLower,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: `${firstName.trim()} ${lastName.trim()}`
        }
      }
    });

    if (error) {
      console.error('Supabase signup error:', error);
      return res.status(400).json({
        error: error.message || 'Registration failed'
      });
    }

    console.log('✅ User created in auth:', data.user.id);

    // Create profile entry with username
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        username: usernameLower,
        full_name: `${firstName.trim()} ${lastName.trim()}`,
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // If profile creation fails due to duplicate username, delete the auth user
      if (profileError.code === '23505') { // Unique violation
        await supabase.auth.admin.deleteUser(data.user.id);
        return res.status(400).json({
          error: 'Username is already taken'
        });
      }
      throw profileError;
    } else {
      console.log('✅ Profile created');
    }

    // Initialize user progress
    const { error: progressError } = await supabase
      .from('user_progress')
      .insert({
        user_id: data.user.id,
        current_phase: 1,
        current_category_id: 1,
        current_scenario_index: 0,
        completed_scenarios: [],
        phase_scores: { "1": 0, "2": 0, "3": 0 },
        total_score: 0,
        last_scenario_id: null
      });

    if (progressError) {
      console.error('Progress initialization error:', progressError);
    } else {
      console.log('✅ User progress initialized');
    }

    console.log('✅ User signup complete:', data.user.email);

    res.status(201).json({
      message: 'User created successfully! Please check your email to confirm.',
      user: {
        id: data.user.id,
        email: data.user.email,
        username: usernameLower,
        full_name: `${firstName.trim()} ${lastName.trim()}`
      }
    });

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error during registration' });
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

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, created_at')
      .eq('id', userId)
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Error fetching profile',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: data
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
            total_scenarios: 30,
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