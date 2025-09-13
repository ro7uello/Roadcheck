import express from "express"
import { authenticate } from "../middleware/auth.js";
import { createAttempt, getUserAttempts, getAttemptsSummary } from "../controllers/attemptsController.js";

const router = express.Router()

// test endpoint
router.get("/", (req, res) => {
  res.send("Attempts API works 📝")
})

// Protect both routes
router.post("/", authenticate, createAttempt);
router.get("/", authenticate, getUserAttempts);
router.get("/summary", authenticate, getAttemptsSummary);

export default router
