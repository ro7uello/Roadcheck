import { supabase } from "../supabaseClient.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }

    const token = authHeader.split(" ")[1];

    // Handle fake token for testing
    if (token === "fake-jwt-token") {
      req.user = { id: "test-user-id" };
      return next();
    }

    // Handle real Supabase JWT tokens
    const { data: { user }, error } = await supabase.auth.getUser(token);

    console.log("Supabase auth result:", { user: user?.id, error: error?.message });

    if (error) {
      console.error("Supabase auth error:", error);
      return res.status(401).json({ error: "Invalid token", details: error.message });
    }

    if (!user) {
      return res.status(401).json({ error: "No user found" });
    }

    req.user = user;
    console.log("Authenticated user:", user.id);
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(500).json({ error: "Auth middleware failed", details: err.message });
  }
};