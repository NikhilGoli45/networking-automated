const fs = require("fs");
const { google } = require("googleapis");
const { authorize } = require("./auth");
const db = require("../db").default || require("../db");
const { generateEmail } = require("./gpt");

// Converts plain text with \n\n into paragraph-separated HTML
function formatAsHtml(text) {
  return text
    .split("\n\n")
    .map(paragraph => `<p>${paragraph.trim()}</p>`)
    .join("");
}

// Encode the email message to base64url format
function createRawMessage(to, subject, body) {
  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    `Content-Type: text/html; charset=UTF-8`,
    "",
    body,
  ].join("\n");

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Send an email using Gmail API and optionally log it
async function sendEmail(to, subject, html, contactId) {
  console.log(`→ sendEmail() called for ${to}`);
  try {
    const auth = await authorize();
    const gmail = google.gmail({ version: "v1", auth });

    const raw = createRawMessage(to, subject, html);

    const res = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw,
      },
    });
    console.log(`Email sent to ${to}:`, res.data);

    // Insert into email_logs if contactId is provided
    if (contactId) {
      await db`
        INSERT INTO email_logs (contact_id, thread_id, message_id)
        VALUES (${contactId}, ${res.data.threadId}, ${res.data.id})
      `;
    }

    return res.data;
  } catch (err) {
    console.error(`Error sending to ${to}:`, err);

    // Optionally mark as bounced
    await db`
      UPDATE contacts
      SET status = 'bounced'
      WHERE email = ${to}
    `;

    throw err;
  }
}

// Check if the contact has responded (old method still included for fallback/testing)
async function hasResponded(email) {
  const auth = await authorize();
  const gmail = google.gmail({ version: "v1", auth });

  try {
    // Get all unique thread IDs for this contact's email
    const threads = await db`
      SELECT DISTINCT thread_id
      FROM email_logs
      WHERE contact_id = (
        SELECT id FROM contacts WHERE email = ${email}
      )
    `;

    console.log(`→ Checking ${threads.length} thread(s) for replies from ${email}`);

    for (const { thread_id } of threads) {
      const thread = await gmail.users.threads.get({
        userId: "me",
        id: thread_id,
        format: "metadata",
      });

      const messageCount = thread.data.messages?.length || 0;

      if (messageCount > 1) {
        console.log(`← Reply found in thread ${thread_id} (${messageCount} messages)`);
        return true;
      }
    }

    console.log(`← No replies found across ${threads.length} thread(s)`);
    return false;
  } catch (err) {
    console.error("Error in hasResponded:", err);
    return false;
  }
}

// GPT-powered helper to generate subject + body and send in one call
async function sendGeneratedEmail(to, originalEmail, recipientName, followupCount, contactId) {
  const { subject, body } = await generateEmail(originalEmail, recipientName, followupCount);
  const html = formatAsHtml(body);
  return await sendEmail(to, subject, html, contactId);
}

module.exports = {
  sendEmail,
  hasResponded,
  sendGeneratedEmail,
};
