require('dotenv').config();
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const { classifyIntent } = require('./classifier');
const { appendRouteLog } = require('./logger');

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1'
});

const PROMPTS_PATH = path.join(__dirname, '..', 'config', 'prompts.json');
const promptsConfig = JSON.parse(fs.readFileSync(PROMPTS_PATH, 'utf-8'));

const CONFIDENCE_THRESHOLD = parseFloat(process.env.CONFIDENCE_THRESHOLD || '0.7');

const MANUAL_INTENT_PREFIXES = ['@code', '@data', '@writing', '@career'];


function detectManualOverride(userMessage) {
  const trimmed = userMessage.trim();
  const parts = trimmed.split(/\s+/);
  const first = parts[0].toLowerCase();

  if (MANUAL_INTENT_PREFIXES.includes(first)) {
    const manualIntent = first.replace('@', '');
    const cleanedMessage = parts.slice(1).join(' ');
    return { manualIntent, cleanedMessage };
  }

  return { manualIntent: null, cleanedMessage: userMessage };
}


async function generateClarificationQuestion(userMessage) {
  const clarificationPrompt = promptsConfig['clarification']?.system_prompt;

  if (!clarificationPrompt) {
    return 'I am not sure what you need help with. Are you asking for help with coding, data analysis, writing, or career advice?';
  }

  const completion = await client.chat.completions.create({
  model: process.env.GROQ_GENERATION_MODEL || 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: clarificationPrompt },
      { role: 'user', content: userMessage }
    ],
    temperature: 0.2,
    max_tokens: 128
  });

  return completion.choices[0].message.content.trim();
}


async function routeAndRespond(userMessage) {
  const { manualIntent, cleanedMessage } = detectManualOverride(userMessage);

  let intentResult = null;
  let finalIntent = null;
  let finalConfidence = null;

  if (manualIntent) {
    finalIntent = manualIntent;
    finalConfidence = 1.0;
  } else {
    intentResult = await classifyIntent(cleanedMessage);
    finalIntent = intentResult.intent;
    finalConfidence = intentResult.confidence;

    if (finalConfidence < CONFIDENCE_THRESHOLD) {
      finalIntent = 'unclear';
    }
  }

  let finalResponseText = '';

  if (finalIntent === 'unclear') {
    finalResponseText = await generateClarificationQuestion(cleanedMessage);
  } else {
    const personaConfig = promptsConfig[finalIntent];

    if (!personaConfig) {
      finalIntent = 'unclear';
      finalResponseText = await generateClarificationQuestion(cleanedMessage);
    } else {
      const systemPrompt = personaConfig.system_prompt;

      const completion = await client.chat.completions.create({
        model: process.env.GROQ_GENERATION_MODEL || 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: cleanedMessage }
        ],
        temperature: 0.4,
        max_tokens: 512
      });

      finalResponseText = completion.choices[0].message.content.trim();
    }
  }

  appendRouteLog({
    intent: finalIntent,
    confidence: finalConfidence,
    user_message: userMessage,
    final_response: finalResponseText
  });

  return {
    intent: finalIntent,
    confidence: finalConfidence,
    response: finalResponseText
  };
}

module.exports = {
  routeAndRespond,
  detectManualOverride
};
