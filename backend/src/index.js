const express = require("express");
require("dotenv").config();
const cors = require("cors");
const contactsRoutes = require("./routes/contacts");
const { runScheduler } = require("./jobs/scheduler"); // Import scheduler
const authMiddleware = require("./middleware/auth");
const authRoutes = require("./routes/auth");

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/login", authRoutes);
app.use("/api/contacts", authMiddleware, contactsRoutes);

// Health check
app.get("/", (_, res) => res.send("Outreach API is running"));

// Scheduler trigger route
app.post("/run-scheduler", async (req, res) => {
  const authHeader = req.headers.authorization;

  // Option A: Check for a valid GitHub token
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  const isGithub = token && token === process.env.SCHEDULER_SECRET;

  // Option B: Check if user is authenticated (you define this)
  const isUser = req.user && req.user.id; // assuming auth middleware sets req.user

  if (!isGithub && !isUser) {
    return res.status(401).json({ error: "Unauthorized" });
  }

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