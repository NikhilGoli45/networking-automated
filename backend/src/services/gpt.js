const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate an email (initial or follow-up) with subject and body.
 * @param {string} originalEmail - The original email message sent.
 * @param {string} recipientName - The name of the recipient.
 * @param {number} followupCount - 0 for initial outreach, >0 for follow-ups.
 * @returns {Promise<{ subject: string, body: string }>}
 */
async function generateEmail(originalEmail, recipientName, followupCount) {
  const prompt = `
    You are writing a follow-up networking email.
    
    Here is the original email that was sent:
    "${originalEmail}"
    
    The recipient's name is ${recipientName}. This is follow-up #${followupCount} (0 means it's the first outreach).
    
    Write a JSON response with two fields:
    1. "subject" — a short (max 5 words), casual subject line, make sure it matches the content of the body. Do not include follow-up count or any urgency. Keep it neutral and friendly. If the follow-up number is 0, make it a subject that would be appropriate for an initial outreach email.
    2. "body" — the email body. For follow-ups (followup_count > 0), match the tone of the original email. Do not be overly formal. Avoid adding urgency, emotional appeals, or pressure. Do not reference how many times you've followed up. Keep the message brief — ideally shorter than the original. Format it with three clear sections: greeting, body, and closing. Separate these sections with double line breaks (\\n\\n). Do not return HTML. End with "Best, Nikhil".
    
    Avoid using any placeholders like [recipient's name] or [your name].
    Return valid JSON in this format:
    {
      "subject": "...",
      "body": "..."
    }
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  try {
    const parsed = JSON.parse(response.choices[0].message.content);
    return {
      subject: parsed.subject,
      body: parsed.body,
    };
  } catch (e) {
    throw new Error("Failed to parse GPT response: " + response.choices[0].message.content);
  }
}

module.exports = {
  generateEmail,
};
