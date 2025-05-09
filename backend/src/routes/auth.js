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

module.exports = router;
