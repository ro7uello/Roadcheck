import express from "express";
import { supabase } from '../config/supabase.js';
import { signup, login } from "../controllers/authController.js"

const router = express.Router();

// Signup
router.post("/signup", signup)

// Login
router.post("/login", login)

export default router
