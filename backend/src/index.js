const express = require("express");
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const contactsRoutes = require("./routes/contacts");
const { runScheduler } = require("./jobs/scheduler"); // Import scheduler
const authMiddleware = require("./middleware/auth");
const authRoutes = require("./routes/auth");

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5174",
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// Routes
app.use("/api", authRoutes); // This will handle /api/test-gmail
app.use("/api/contacts", authMiddleware, contactsRoutes);

// Health check
app.get("/", (_, res) => res.send("Outreach API is running"));

// Scheduler trigger route (optional POST for safety)
app.post("/run-scheduler", async (req, res) => {
  try {
    await runScheduler();
    res.json({ message: "Scheduler completed successfully." });
  } catch (err) {
    console.error("Scheduler failed:", err);
    res.status(500).json({ error: "Scheduler failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});