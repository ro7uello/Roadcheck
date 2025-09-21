import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';
import { getUserAttempts, getAttemptsSummary } from "../controllers/attemptsController.js";

const router = express.Router()

// Test endpoint
router.get("/test", (req, res) => {
  res.send("Attempts API works 📝")
})

// GET routes
router.get("/", authenticate, getUserAttempts);
router.get("/summary", authenticate, getAttemptsSummary);

// POST route for creating attempts
router.post("/", authenticate, async (req, res) => {
  try {
    console.log("=== ATTEMPTS ENDPOINT DEBUG ===");
    
    const { scenario_id, selected_option } = req.body;
    const user_id = req.user.id;

    console.log("Received data:", { scenario_id, selected_option, user_id });

    // Validate required fields
    if (!scenario_id || !selected_option) {
      console.log("ERROR: Missing required fields");
      return res.status(400).json({ 
        error: "Missing required fields: scenario_id and selected_option" 
      });
    }

    console.log(`Processing attempt for user ${user_id}, scenario ${scenario_id}, option ${selected_option}`);

    // Check if scenario exists
    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', scenario_id)
      .single();

    if (scenarioError) {
      console.error("Scenario lookup error:", scenarioError);
      return res.status(404).json({ error: `Scenario ${scenario_id} not found` });
    }

    console.log(`Scenario found: ${scenario.title}`);

    // Get all choices for this scenario
    const { data: choices, error: choicesError } = await supabase
      .from('scenario_choices')
      .select('*')
      .eq('scenario_id', scenario_id);

    if (choicesError) {
      console.error("Choices lookup error:", choicesError);
      return res.status(500).json({ error: "Failed to get scenario choices" });
    }

    if (!choices || choices.length === 0) {
      console.log("ERROR: No choices found for scenario");
      return res.status(404).json({ error: `No choices found for scenario ${scenario_id}` });
    }

    console.log(`Found ${choices.length} choices for scenario`);
    choices.forEach(choice => {
      console.log(`  - Option ${choice.option}: ${choice.text.substring(0, 50)}... (correct: ${choice.is_correct})`);
    });

    // Find selected choice
    const selectedChoice = choices.find(choice => choice.option === selected_option);
    if (!selectedChoice) {
      console.log(`ERROR: Selected option '${selected_option}' not found`);
      const availableOptions = choices.map(c => c.option);
      return res.status(400).json({ 
        error: `Option ${selected_option} not found for scenario ${scenario_id}`,
        available_options: availableOptions
      });
    }

    console.log(`Selected choice found: ${selectedChoice.text.substring(0, 50)}...`);

    // Find correct choice
    const correctChoice = choices.find(choice => choice.is_correct === true);
    if (!correctChoice) {
      console.log("ERROR: No correct choice found");
      return res.status(500).json({ error: "No correct answer defined for this scenario" });
    }

    console.log(`Correct choice: Option ${correctChoice.option}`);

    const is_correct = selectedChoice.is_correct === true;
    console.log(`Answer is correct: ${is_correct}`);

    // Check for existing attempt
    const { data: existingAttempt } = await supabase
      .from('user_attempts')
      .select('*')
      .eq('user_id', user_id)
      .eq('scenario_id', scenario_id)
      .single();

    let attemptResult;

    if (existingAttempt) {
      console.log("Updating existing attempt");
      // Update existing attempt
      const { data: updatedAttempt, error: updateError } = await supabase
        .from('user_attempts')
        .update({
          chosen_option: selected_option,
          is_correct: is_correct
        })
        .eq('id', existingAttempt.id)
        .select()
        .single();

      if (updateError) {
        console.error("Update attempt error:", updateError);
        console.error("Update error details:", JSON.stringify(updateError, null, 2));
        return res.status(500).json({ 
          error: "Failed to update attempt",
          details: updateError.message
        });
      }

      attemptResult = updatedAttempt;
      console.log("Successfully updated existing attempt");
    } else {
      console.log("Creating new attempt");
      console.log("Data to insert:", {
        user_id: user_id,
        scenario_id: scenario_id, 
        chosen_option: selected_option,
        is_correct: is_correct
      });
      
      // Create new attempt
      const { data: newAttempt, error: attemptError } = await supabase
        .from('user_attempts')
        .insert({
          user_id,
          scenario_id,
          chosen_option: selected_option,
          is_correct: is_correct
        })
        .select()
        .single();

      if (attemptError) {
        console.error("Database insert error:", attemptError);
        console.error("Insert error details:", JSON.stringify(attemptError, null, 2));
        console.error("Data being inserted:", {
          user_id,
          scenario_id,
          chosen_option: selected_option,
          is_correct: is_correct
        });
        return res.status(500).json({ 
          error: "Failed to save attempt",
          details: attemptError.message,
          code: attemptError.code
        });
      }

      attemptResult = newAttempt;
      console.log("Successfully created new attempt");
    }

    // Prepare response
    const responseData = {
      attempt_id: attemptResult.id,
      is_correct: is_correct,
      selected_option: selected_option,
      correct_option: correctChoice.option,
      scenario_id: scenario_id,
      user_id: user_id,
      explanation: {
        correct: scenario.correct_explanation || "Correct answer!",
        selected: selectedChoice.explanation || null
      },
      attempt: attemptResult
    };

    console.log("Sending response:", responseData);
    console.log("=== END ATTEMPTS DEBUG ===");

    res.json(responseData);

  } catch (error) {
    console.error("CRITICAL ERROR in attempts endpoint:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({ 
      error: "Server error", 
      message: error.message 
    });
  }
});

// Debug endpoint (no auth for testing)
router.get("/debug/scenario/:id", async (req, res) => {
  try {
    const scenario_id = parseInt(req.params.id);

    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', scenario_id)
      .single();

    if (scenarioError) {
      return res.status(404).json({ error: `Scenario ${scenario_id} not found` });
    }

    const { data: choices, error: choicesError } = await supabase
      .from('scenario_choices')
      .select('*')
      .eq('scenario_id', scenario_id);

    if (choicesError) {
      return res.status(500).json({ error: "Failed to get choices" });
    }

    const debugData = {
      scenario: {
        id: scenario.id,
        title: scenario.title,
        description: scenario.description,
        phase_id: scenario.phase_id
      },
      choices: choices.map(choice => ({
        id: choice.id,
        option: choice.option,
        text: choice.text,
        is_correct: choice.is_correct,
        explanation: choice.explanation
      })),
      correct_choice: choices.find(c => c.is_correct)?.option || null,
      total_choices: choices.length
    };

    res.json(debugData);

  } catch (error) {
    console.error("Debug endpoint error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;