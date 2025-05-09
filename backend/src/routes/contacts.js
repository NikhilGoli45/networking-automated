const express = require("express");
const router = express.Router();
const db = require("../db").default || require("../db"); // Ensure compatibility with ES module export

// Add a new contact
router.post("/", async (req, res) => {
  const { name, email, original_email } = req.body;

  try {
    const result = await db`
      INSERT INTO contacts (name, email, original_email)
      VALUES (${name}, ${email}, ${original_email})
      RETURNING *
    `;
    res.json(result[0]); // same as result.rows[0]
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
