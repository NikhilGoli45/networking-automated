const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate a follow-up email based on the original message and follow-up count
 */
async function generateFollowup(originalEmail, name, followupCount) {
  let prompt;

  if (followupCount === 1) {
    prompt = `You're helping write a polite, friendly follow-up email to ${name} who hasn't replied to the following message:

"${originalEmail}"

This is the first follow-up. Gently remind them about the original message—use wording like "I'm not sure if you saw my last email"—and keep it short and respectful. Do not be pushy.`;
  } else if (followupCount === 2) {
    prompt = `You're writing a second follow-up email to ${name}. They have not replied to the original message:

"${originalEmail}"

Do not restate the original email in detail. Instead, write a friendly, stand-alone message that shows continued interest but respects their time. It should still be concise and professional.`;
  } else {
    prompt = `This is the final follow-up email to ${name}, who has not responded to two previous messages.

Write a short, professional closing message that leaves the door open for future contact. Be kind, thank them for their time, and don't reference previous emails directly.`;
  }

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  return res.choices[0].message.content;
}

module.exports = { generateFollowup };
