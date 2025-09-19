import { supabase } from "../supabaseClient.js"

// GET all scenarios with their choices
export const getScenarios = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("scenarios")
      .select(`
        id, 
        phase_id, 
        title, 
        description, 
        choices:scenario_choices(
          id, 
          scenario_id,
          option, 
          text, 
          is_correct,
          explanation
        )
      `)

    if (error) throw error

    res.status(200).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET single scenario by ID with choices
export const getScenarioById = async (req, res) => {
  const { id } = req.params
  try {
    const { data, error } = await supabase
      .from("scenarios")
      .select(`
        id, 
        phase_id, 
        title, 
        description, 
        choices:scenario_choices(
          id, 
          scenario_id,
          option, 
          text, 
          is_correct,
          explanation
        )
      `)
      .eq("id", id)
      .single()

    if (error) throw error

    res.status(200).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}