function isGoodDay() {
    const today = new Date().getDay(); // 0 = Sunday ... 6 = Saturday
    return today === 2 || today === 3; // Tuesday or Wednesday
}

const db = require("../db");
const { sendEmail, hasResponded } = require("../services/email");
const { generateFollowup } = require("../services/gpt");

async function runScheduler() {
  console.log("Running scheduler...");

  if (!isGoodDay()) {
    console.log("Not a good day to send emails. Exiting.");
    return;
  }

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const result = await db.query(`
    SELECT * FROM contacts
    WHERE status = 'active'
      AND (
        (followup_count = 0 AND last_sent IS NULL) OR
        (followup_count > 0 AND last_sent < $1)
      )
  `, [oneWeekAgo]);

  const contacts = result.rows;

  for (let contact of contacts) {
    const { id, name, email, original_email, followup_count, last_sent } = contact;
  
    try {
      const responded = await hasResponded(email, last_sent || contact.created_at);
  
      if (responded) {
        await db.query(`UPDATE contacts SET status = 'success' WHERE id = $1`, [id]);
  
        await sendEmail(
          "your_email@example.com",
          `✅ ${name} responded!`,
          `${name} <${email}> has replied to your outreach.\n\nYou can mark the thread as complete.`
        );
  
        console.log(`Marked ${email} as success and sent notification.`);
        continue;
      }
  
      if (followup_count >= 4) {
        await db.query(`UPDATE contacts SET status = 'expired' WHERE id = $1`, [id]);
        console.log(`Contact ${email} marked as expired.`);
        continue;
      }
  
      let subject, body;

      if (followup_count === 0) {
        // First email: original outreach
        subject = "Quick intro";
        body = original_email;
      } else {
        // Follow-up email
        subject = "Quick follow-up";
        body = await generateFollowup(original_email, name, followup_count);
      }

      await sendEmail(email, subject, body);
  
      await db.query(`
        UPDATE contacts
        SET followup_count = followup_count + 1,
            last_sent = NOW()
        WHERE id = $1
      `, [id]);
  
      console.log(`Follow-up sent to ${email} (attempt ${followup_count + 1})`);
    } catch (err) {
      console.error(`Failed to process ${email}:`, err);
    }
  }
}

module.exports = { runScheduler };