import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authenticate } from './middleware/auth.js';
import { supabase } from './config/supabase.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: '*',  // Allow all origins for testing
  credentials: true
}));
app.use(express.json());

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
    
    // Use Supabase authentication
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

// ===========================
// CATEGORY & PHASE ROUTES
// ===========================

// GET /categories - Fetch all categories
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

// GET /phases/category/:categoryId - Fetch phases for a specific category
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

// GET /scenarios - Fetch all scenarios
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

// GET /scenarios/:id - Fetch specific scenario
app.get('/scenarios/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get scenario details
    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', id)
      .single();
    
    if (scenarioError) throw scenarioError;
    
    // Get scenario choices
    const { data: choices, error: choicesError } = await supabase
      .from('scenario_choices')
      .select('*')
      .eq('scenario_id', id);
    
    if (choicesError) throw choicesError;
    
    // Transform data to match frontend format
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

// GET /scenario_choices/:scenario_id - Fetch choices for a scenario
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

// GET /user/profile - Fetch current user profile (legacy route)
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

// GET /profiles/:userId - Fetch user profile information
app.get('/profiles/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, created_at')
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

// GET /user-progress/:userId - Fetch user progress
app.get('/user-progress/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no progress found, return default values matching schema
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

// PUT /user-progress - Update user progress
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

// POST /progress/category - Update category progress (legacy route)
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

// POST /progress/phase - Update phase progress (legacy route)
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

// POST /attempts - Record user attempt (legacy route)
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

    // Get the correct answer
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

    // Save the attempt
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

// POST /user-progress/scenario - Enhanced scenario completion tracking
app.post('/user-progress/scenario', async (req, res) => {
  try {
    const { user_id, scenario_id, selected_answer, is_correct } = req.body;
    
    // Insert user attempt record
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

    // Update user progress if correct answer
    if (is_correct) {
      // Get current progress
      const { data: currentProgress } = await supabase
        .from('user_progress')
        .select('completed_scenarios, total_score, user_id')
        .eq('user_id', user_id)
        .single();

      if (currentProgress) {
        // Add scenario to completed_scenarios array if not already there
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

// GET /user-stats/:userId - Fetch aggregated user statistics
app.get('/user-stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get all categories
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

    // For each category, calculate statistics
    for (const category of categories) {
      const categoryKey = category.name.toLowerCase().replace(/\s+/g, '_');
      
      try {
        // Get phases for this category
        const { data: phases } = await supabase
          .from('phases')
          .select('id')
          .eq('category_id', category.id);
        
        if (!phases || phases.length === 0) {
          stats[categoryKey] = {
            total_scenarios: 0,
            completed_scenarios: 0,
            total_attempts: 0,
            correct_answers: 0
          };
          continue;
        }

        // Get scenarios for these phases
        const phaseIds = phases.map(p => p.id);
        const { data: scenarios } = await supabase
          .from('scenarios')
          .select('id')
          .in('phase_id', phaseIds);
        
        if (!scenarios || scenarios.length === 0) {
          stats[categoryKey] = {
            total_scenarios: 0,
            completed_scenarios: 0,
            total_attempts: 0,
            correct_answers: 0
          };
          continue;
        }

        // Get user attempts for these scenarios
        const scenarioIds = scenarios.map(s => s.id);
        const { data: attempts } = await supabase
          .from('user_attempts')
          .select('scenario_id, is_correct')
          .eq('user_id', userId)
          .in('scenario_id', scenarioIds);

        const totalScenarios = scenarios.length;
        const userAttempts = attempts || [];
        const completedScenarios = new Set(userAttempts.map(a => a.scenario_id)).size;
        const totalAttempts = userAttempts.length;
        const correctAnswers = userAttempts.filter(a => a.is_correct).length;

        stats[categoryKey] = {
          total_scenarios: totalScenarios,
          completed_scenarios: completedScenarios,
          total_attempts: totalAttempts,
          correct_answers: correctAnswers
        };
      } catch (err) {
        console.error(`Error processing category ${category.name}:`, err);
        stats[categoryKey] = {
          total_scenarios: 0,
          completed_scenarios: 0,
          total_attempts: 0,
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

// ===========================
// SERVER STARTUP
// ===========================

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 RoadCheck Server running on port ${PORT}`);
});