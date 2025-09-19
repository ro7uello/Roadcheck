import { supabase } from "../supabaseClient.js";
import express from "express"
import { authenticate } from "../middleware/auth.js";
import { createAttempt, getUserAttempts, getAttemptsSummary } from "../controllers/attemptsController.js";

const router = express.Router()

// GET /scenarios - fetch all scenarios
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("scenarios")
      .select("*");

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /scenarios/:id - fetch scenario by ID with choices
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("scenarios")
      .select(`
        id,
        phase_id,
        title,
        description,
        scenario_choices(id, option, text, is_correct, explanation)
      `)
      .eq("id", id)
      .single();

    if (error) return res.status(404).json({ error: "Scenario not found" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


export default router;
