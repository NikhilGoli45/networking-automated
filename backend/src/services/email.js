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

// Send an email using Gmail API
async function sendEmail(to, subject, html) {
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

// Check if the contact has responded
async function hasResponded(email, sinceDate) {
  const auth = await authorize();
  const gmail = google.gmail({ version: "v1", auth });

  const bufferSeconds = 60;
  const sinceUnix = Math.floor(new Date(sinceDate).getTime() / 1000) - bufferSeconds;
  const query = `from:${email} after:${sinceUnix} in:any -in:sent`;

  console.log("→ Gmail search query:", query);

  try {
    const res = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: 1,
    });

    console.log("→ Gmail API response:", JSON.stringify(res.data, null, 2));

    const matched = !!(res.data.messages && res.data.messages.length > 0);
    console.log(`← hasResponded result for ${email}: ${matched}`);
    return matched;
  } catch (err) {
    console.error("Gmail API error:", err);
    return false;
  }
}


// GPT-powered helper to generate subject + body and send in one call
async function sendGeneratedEmail(to, originalEmail, recipientName, followupCount) {
  const { subject, body } = await generateEmail(originalEmail, recipientName, followupCount);
  const html = formatAsHtml(body);
  return await sendEmail(to, subject, html);
}

module.exports = {
  sendEmail,
  hasResponded,
  sendGeneratedEmail,
};
