const express = require("express");
const router = express.Router();
const db = require("../db").default || require("../db");

// Helper: Normalize email
function normalizeEmail(email) {
  let [local, domain] = email.toLowerCase().trim().split("@");
  if (domain === "gmail.com" || domain === "googlemail.com") {
    local = local.split("+")[0].replace(/\./g, ""); // Remove +aliases and dots
  }
  return `${local}@${domain}`;
}

// Check for valid email format
function isValidEmailSyntax(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Add a new contact
router.post("/", async (req, res) => {
  const { name, email, original_email } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!isValidEmailSyntax(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  try {
    // Check for existing active contact
    const existing = await db`
      SELECT * FROM contacts
      WHERE email = ${normalizedEmail}
        AND status != 'expired'
    `;

    if (existing.length > 0) {
      return res.status(409).json({ error: "Contact already exists and is active." });
    }

    // Insert new contact with normalized email
    const result = await db`
      INSERT INTO contacts (name, email, original_email)
      VALUES (${name}, ${normalizedEmail}, ${original_email})
      RETURNING *
    `;

    res.json(result[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add contact" });
  }
});

// List all contacts
router.get("/", async (_, res) => {
  try {
    const result = await db`
      SELECT * FROM contacts ORDER BY created_at DESC
    `;
    res.json(result); // same as result.rows
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

// Delete a contact
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db`
      DELETE FROM contacts WHERE id = ${id}
      RETURNING *
    `;
    if (result.length === 0) {
      return res.status(404).json({ error: "Contact not found" });
    }
    res.json({ message: "Contact deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete contact" });
  }
});

module.exports = router;
