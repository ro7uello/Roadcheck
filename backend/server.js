import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authenticate } from './middleware/auth.js';
import { supabase } from './config/supabase.js';
import authRoutes from "./routes/auth.js";
import scenariosRoutes from "./routes/scenarios.js";
import attemptsRoutes from "./routes/attempts.js";
import progressRoutes from "./routes/progress.js";
dotenv.config();

const app = express();
app.use(cors({
  origin: '*',  // Allow all origins for testing
  credentials: true
}));
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/scenarios", scenariosRoutes);
app.use("/attempts", attemptsRoutes);
app.use('/progress', progressRoutes);

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email === "test@example.com" && password === "1234") {
      return res.json({ access_token: "fake-jwt-token" });
    } else {
      return res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Scenarios route
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

// Scenario choices route
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
    res.status(500).json({ error: error.message });
  }
});

app.get('/scenarios/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Get scenario error:', error);
    res.status(500).json({ error: error.message });
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

// Attempts route
// Attempts route
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
        scenario_id,
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

// POST /progress/category
app.post('/progress/category', authenticate, async (req, res) => {
  try {
    const { category_id } = req.body;  // Make sure this matches frontend
    const user_id = req.user.id;
    
    const { data, error } = await supabase
      .from('user_progress')
      .update({
        current_category_id: category_id,
        current_phase: 1,
        current_scenario_index: 0,
        updated_at: new Date()
      })
      .eq('user_id', user_id);
      
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /progress/phase  
app.post('/progress/phase', authenticate, (req, res) => {
  const { phase } = req.body;
  // Update current_phase and reset scenario index
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});