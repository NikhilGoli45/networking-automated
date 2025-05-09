const fetch = require("node-fetch");
require("dotenv").config();

async function sendEmail(to, subject, html) {
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

  return res.json();
}

module.exports = { sendEmail };
