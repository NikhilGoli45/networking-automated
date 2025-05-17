const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { google } = require("googleapis");
const { authorize } = require("../services/auth");

const router = express.Router();

router.post("/", async (req, res) => {
  const { username, password } = req.body;

  if (username !== process.env.AUTH_USERNAME)
    return res.status(401).json({ error: "Invalid credentials" });

  const match = await bcrypt.compare(password, process.env.AUTH_PASSWORD_HASH);
  if (!match) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: "7d" });
  
  // Set HTTP-only cookie for cross-site (static frontend) auth
  res.cookie('token', token, {
    httpOnly: true,
    secure: true, // Always true for cross-site cookies (Render uses HTTPS)
    sameSite: 'none', // Must be 'none' for cross-site cookies
    domain: '.onrender.com', // Set to root domain for subdomain sharing
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  
  res.json({ success: true });
});

// Check authentication status
router.get("/check-auth", (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json({ authenticated: false });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    res.json({ authenticated: true });
  } catch {
    res.json({ authenticated: false });
  }
});

// Logout route
router.post("/logout", (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

// Test Gmail API access
router.get("/test-gmail", async (req, res) => {
  try {
    const auth = await authorize();
    const gmail = google.gmail({ version: 'v1', auth });
    
    // Try to get the user's profile to verify access
    const response = await gmail.users.getProfile({ userId: 'me' });
    
    res.json({
      success: true,
      email: response.data.emailAddress,
      message: "Successfully connected to Gmail API"
    });
  } catch (error) {
    console.error("Gmail API test failed:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to connect to Gmail API"
    });
  }
});

module.exports = router;
