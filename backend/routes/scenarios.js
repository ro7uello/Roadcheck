import express from "express"
import { getScenarios, getScenarioById } from "../controllers/scenariosController.js"

const router = express.Router()

// GET all scenarios
router.get("/", getScenarios)

// GET single scenario by ID
router.get("/:id", getScenarioById)

export default router