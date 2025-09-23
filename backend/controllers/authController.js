import { supabase } from "../config/supabase.js";

// ---------------- Signup ----------------
export const signup = async (req, res) => {
  const { email, password, full_name } = req.body;

  try {
    // 1. Create user in Supabase Auth
    const { data: { user }, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) return res.status(400).json({ error: error.message });

    // 2. Insert into profiles
    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,   // same UUID
      full_name,
      avatar_url: null,
    });

    if (profileError) {
      return res.status(400).json({ error: profileError.message });
    }

    res.status(201).json({ message: "User created successfully", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------- Login ----------------
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Login user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return res.status(400).json({ error: error.message });

    // Extract access_token and user
    const { session, user } = data;

    // 2. Get profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

      return res.json({
      access_token: session.access_token,  // 👈 now you can see this
      user,
      profile,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
