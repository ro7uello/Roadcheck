import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
const router = express.Router();

// GET user progress
router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', req.user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') { // Not found
      throw error;
    }
    
    res.json(data || {
      current_phase: 1,
      current_scenario_index: 0,
      completed_scenarios: [],
      phase_scores: { 1: 0, 2: 0, 3: 0 },
      total_score: 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update progress
router.put('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: req.user.id,
        current_phase: req.body.currentPhase,
        current_scenario_index: req.body.currentScenarioIndex,
        completed_scenarios: req.body.completedScenarios,
        phase_scores: req.body.phaseScores,
        total_score: req.body.totalScore,
        updated_at: new Date()
      })
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;