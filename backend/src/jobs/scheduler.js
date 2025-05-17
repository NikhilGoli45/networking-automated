function isGoodDay() {
  const today = new Date().getDay(); // 0 = Sunday ... 6 = Saturday
  return today === 1 || today === 2 || today === 3; // Monday, Tuesday, Wednesday
}

const db = require("../db").default || require("../db");
const { sendEmail, sendGeneratedEmail, hasResponded } = require("../services/email");
const { generateEmail } = require("../services/gpt");

async function runScheduler() {
  console.log("Running scheduler...");

  // if (!isGoodDay()) {
  //   console.log("Not a good day to send emails. Exiting.");
  //   return;
  // }

  const oneWeekAgo = new Date(Date.now() - 60 * 1000);

  const contacts = await db`
    SELECT * FROM contacts
    WHERE status = 'active'
      AND (
        (followup_count = 0 AND last_sent IS NULL) OR
        (followup_count > 0 AND last_sent < ${oneWeekAgo})
      )
  `;

  console.log(`Found ${contacts.length} contacts to process`);

  for (let contact of contacts) {
    const { id, name, email, original_email, followup_count, last_sent } = contact;

    try {
      let responded = false;

      if (last_sent) {
        console.log(`→ Checking if ${email} has responded...`);
        responded = await hasResponded(email);
        console.log(`← Responded: ${responded}`);
      } else {
        console.log(`Skipping response check for ${email} (no message sent yet)`);
      }

      if (responded) {
        await db`
          UPDATE contacts
          SET status = 'success'
          WHERE id = ${id}
        `;

        await sendEmail(
          process.env.SENDER_EMAIL || "Set SENDER_EMAIL in .env",
          `${name} responded!`,
          `${name} <${email}> has replied to your outreach.\n\nYou can mark the thread as complete.`
        );

        console.log(`Marked ${email} as success and sent notification.`);
        continue;
      }

      if (followup_count >= 4) {
        await db`
          UPDATE contacts
          SET status = 'expired'
          WHERE id = ${id}
        `;
        console.log(`Contact ${email} marked as expired.`);
        continue;
      }

      if (followup_count === 0) {
        const { subject } = await generateEmail(original_email, name, 0);
      
        // Format original body as HTML (same logic as email.js)
        const html = original_email
          .split("\n\n")
          .map(paragraph => `<p>${paragraph.trim()}</p>`)
          .join("");
      
        await sendEmail(email, subject, html, id);
      } else {
        await sendGeneratedEmail(email, original_email, name, followup_count, id); 
      }

      await db`
        UPDATE contacts
        SET followup_count = followup_count + 1,
            last_sent = NOW()
        WHERE id = ${id}
      `;

      console.log(`Email sent to ${email} (attempt ${followup_count + 1})`);
    } catch (err) {
      console.error(`Failed to process ${email}:`, err);
    }
  }

  console.log("Scheduler run complete.");
}

module.exports = { runScheduler };
