require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { routeAndRespond } = require('./router');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/chat', async (req, res) => {
  const { message } = req.body || {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      error: 'Invalid request: body.message must be a non-empty string.'
    });
  }

  try {
    const result = await routeAndRespond(message);

    return res.json({
      intent: result.intent,
      confidence: result.confidence,
      response: result.response
    });
  } catch (err) {
    console.error('Unexpected error in /api/chat:', err);
    return res.status(500).json({
      error: 'Internal server error.'
    });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`llm-intent-router (Groq) listening on port ${PORT}`);
  });
}

module.exports = app;
