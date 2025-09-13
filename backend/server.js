import express from "express"
import cors from "cors"
import dotenv from "dotenv"

import authRoutes from "./routes/auth.js"
import scenariosRoutes from "./routes/scenarios.js"
import attemptsRoutes from "./routes/attempts.js"

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

// Routes
app.use("/auth", authRoutes)
app.use("/scenarios", scenariosRoutes)
app.use("/attempts", attemptsRoutes)

// Root test route
app.get("/", (req, res) => {
  res.send("RoadCheck backend is alive 🚦")
})

app.listen(process.env.PORT || 5000, () => {
  console.log(`🚀 Server running on port ${process.env.PORT || 5000}`)
})
