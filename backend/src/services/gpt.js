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
    1. "subject":
      - If follow-up number is 0 (initial outreach), generate a clear and formal subject line (max 12 words) that matches the body content. It should reflect the topic professionally, such as "Inquiry About New Grad Hiring Timeline and Quick Chat".
      - If follow-up number is greater than 0, use a short (max 5 words), casual subject line that is neutral, friendly, and matches the body.
    2. "body": the email body. For follow-ups (followup_count > 0), match the tone of the original email. Do not be overly formal. Avoid adding urgency, emotional appeals, or pressure. Do not reference how many times you've followed up. Keep the message brief — ideally shorter than the original. Format it with three clear sections: greeting, body, and closing. Separate these sections with double line breaks (\\n\\n). Do not return HTML. End with "Best,\n Nikhil".
    
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
