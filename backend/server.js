import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authenticate } from './middleware/auth.js';
import { supabase } from './supabaseClient.js';
import authRoutes from "./routes/auth.js";
import scenariosRoutes from "./routes/scenarios.js";
import attemptsRoutes from "./routes/attempts.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/scenarios", scenariosRoutes);
app.use("/attempts", attemptsRoutes);

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});