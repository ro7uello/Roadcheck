import { supabase } from "../supabaseClient.js";

// Route: POST /attempts
export const createAttempt = async (req, res) => {
  const { scenario_id, chosen_option } = req.body;
  const user_id = req.user.id;

  try {
    // 1. Find the correct answer
    const { data: choices, error: choicesError } = await supabase
      .from("scenario_choices")
      .select("option, is_correct")
      .eq("scenario_id", scenario_id);

    if (choicesError) return res.status(400).json({ error: choicesError.message });

    const correctChoice = choices.find((c) => c.is_correct);

    // 2. Check if chosen option is correct
    const is_correct = correctChoice.option === chosen_option;

    // 3. Insert attempt
    const { data, error } = await supabase.from("user_attempts").insert({
      user_id,
      scenario_id,
      chosen_option,
      is_correct,
    });

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json({ message: "Attempt recorded", is_correct });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Route: GET /attempts/:user_id
export const getUserAttempts = async (req, res) => {
  const user_id = req.user.id;

  try {
    const { data, error } = await supabase
      .from("user_attempts")
      .select(`
        id,
        chosen_option,
        is_correct,
        created_at,
        scenarios (title, description)
      `)
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /attempts/summary
 * Returns: { total, correct, accuracy, recent_attempts }
 */
export const getAttemptsSummary = async (req, res) => {
  const user_id = req.user.id;

  try {
    // 1) total attempts (use count)
    const { count: totalCount, error: totalError } = await supabase
      .from("user_attempts")
      .select("id", { count: "exact", head: false })
      .eq("user_id", user_id);

    if (totalError) {
      return res.status(400).json({ error: totalError.message });
    }

    // 2) correct attempts (count where is_correct = true)
    const { count: correctCount, error: correctError } = await supabase
      .from("user_attempts")
      .select("id", { count: "exact", head: false })
      .eq("user_id", user_id)
      .eq("is_correct", true);

    if (correctError) {
      return res.status(400).json({ error: correctError.message });
    }

    const total = totalCount || 0;
    const correct = correctCount || 0;
    const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);

    // 3) recent attempts (last 10) with scenario title (joined)
    const { data: recentAttempts, error: recentError } = await supabase
      .from("user_attempts")
      .select(`
        id,
        chosen_option,
        is_correct,
        created_at,
        scenarios (id, title, category_id, phase_id)
      `)
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (recentError) {
      return res.status(400).json({ error: recentError.message });
    }

    return res.json({
      total,
      correct,
      accuracy, // integer percent
      recent_attempts: recentAttempts || [],
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};