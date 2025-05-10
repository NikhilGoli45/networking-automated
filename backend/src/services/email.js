const fetch = require("node-fetch");
require("dotenv").config();

async function sendEmail(to, subject, html) {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.SENDER_EMAIL,
        to,
        subject,
        html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(`Failed to send email to ${to}`, data);

      // Optionally mark as bounced
      await db`
        UPDATE contacts
        SET status = 'bounced'
        WHERE email = ${to}
      `;

      throw new Error(`Email send failed: ${data.error?.message || res.statusText}`);
    }

    return data;
  } catch (err) {
    console.error(`Error sending to ${to}:`, err);
    throw err;
  }
}

module.exports = { sendEmail };

const fs = require("fs");
const { google } = require("googleapis");
const { authorize } = require("./auth");

const credentials = JSON.parse(fs.readFileSync("src/client_secret.json"));

async function hasResponded(email, sinceDate) {
  return new Promise((resolve, reject) => {
    authorize(credentials, async (auth) => {
      const gmail = google.gmail({ version: "v1", auth });

      const query = `from:${email} after:${Math.floor(new Date(sinceDate).getTime() / 1000)}`;

      try {
        const res = await gmail.users.messages.list({
          userId: "me",
          q: query,
          maxResults: 1,
        });

        const hasReply = res.data.messages && res.data.messages.length > 0;
        resolve(hasReply);
      } catch (err) {
        console.error("Gmail API error:", err);
        reject(err);
      }
    });
  });
}

module.exports = { hasResponded };
