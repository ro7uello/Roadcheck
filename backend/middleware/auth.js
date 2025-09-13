import { supabase } from "../supabaseClient.js";

export const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header: "Bearer <token>"
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }

    const token = authHeader.split(" ")[1];

    // Validate token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Attach user to request so routes can access it
    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ error: "Auth middleware failed", details: err.message });
  }
};