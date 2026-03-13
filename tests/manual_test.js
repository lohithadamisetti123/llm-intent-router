require('dotenv').config();
const { routeAndRespond } = require('../src/router');

const testMessages = [
  'how do i sort a list of objects in python?',
  'explain this sql query for me',
  'This paragraph sounds awkward, can you help me fix it?',
  "I'm preparing for a job interview, any tips?",
  "what's the average of these numbers: 12, 45, 23, 67, 34",
  'Help me make this better.',
  'I need to write a function that takes a user id and returns their profile, but also i need help with my resume.',
  'hey',
  'Can you write me a poem about clouds?',
  'Rewrite this sentence to be more professional.',
  "I'm not sure what to do with my career.",
  'what is a pivot table',
  'fxi thsi bug pls: for i in range(10) print(i)',
  'How do I structure a cover letter?',
  'My boss says my writing is too verbose.'
];

async function runTests() {
  for (const msg of testMessages) {
    console.log('===================================================');
    console.log('User message:', msg);

    const result = await routeAndRespond(msg);

    console.log('Detected intent:', result.intent);
    console.log('Confidence:', result.confidence);
    console.log('Response:\n', result.response);
    console.log('\n');
  }

  console.log('Done. Check route_log.jsonl for logged entries.');
}

runTests().catch((err) => {
  console.error('Error running manual tests:', err);
  process.exit(1);
});
