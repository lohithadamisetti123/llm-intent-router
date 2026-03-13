require('dotenv').config();
const OpenAI = require('openai');
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1'
});

const DEFAULT_CLASSIFICATION = {
  intent: 'unclear',
  confidence: 0.0
};

function buildClassifierPrompt(userMessage) {
  return `
Your task is to classify the user's intent.

Based on the user message below, choose one of the following labels:
- "code"      (questions about programming, debugging, or code design)
- "data"      (questions about data analysis, statistics, or interpreting numbers)
- "writing"   (questions about improving text, tone, or structure)
- "career"    (questions about jobs, interviews, resumes, or long-term career choices)
- "unclear"   (if the intent does not clearly match any of the above)

Respond with a single JSON object containing exactly two keys:
- "intent": the label you chose as a string
- "confidence": a float from 0.0 to 1.0 representing your certainty

The response must be valid JSON and must not contain any extra text, comments, or explanations.

User message:
"""${userMessage}"""
`.trim();
}


function parseClassifierResponse(raw) {
  try {
    const parsed = JSON.parse(raw);

    if (
      typeof parsed.intent === 'string' &&
      typeof parsed.confidence === 'number'
    ) {
      return parsed;
    }

    return DEFAULT_CLASSIFICATION;
  } catch (err) {
    return DEFAULT_CLASSIFICATION;
  }
}

async function classifyIntent(userMessage) {
  const systemPrompt = buildClassifierPrompt(userMessage);

  try {
    const completion = await client.chat.completions.create({
      model: process.env.GROQ_CLASSIFIER_MODEL || 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.0, 
      max_tokens: 64
    });

    const raw = completion.choices[0].message.content;
    const result = parseClassifierResponse(raw);

    return result;
  } catch (err) {
    console.error('Error during classifyIntent LLM call:', err);
    return DEFAULT_CLASSIFICATION;
  }
}

module.exports = {
  classifyIntent,
  parseClassifierResponse,
  DEFAULT_CLASSIFICATION
};
