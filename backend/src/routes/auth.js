const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.post("/", async (req, res) => {
  const { username, password } = req.body;

  if (username !== process.env.AUTH_USERNAME)
    return res.status(401).json({ error: "Invalid credentials" });

  const match = await bcrypt.compare(password, process.env.AUTH_PASSWORD_HASH);
  if (!match) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ token });
});

// Add token validation endpoint
router.get("/validate-token", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true });
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
});

module.exports = router;
