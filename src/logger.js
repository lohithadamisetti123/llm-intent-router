const fs = require('fs');
const path = require('path');

const LOG_FILE_PATH = path.join(__dirname, '..', 'route_log.jsonl');


function appendRouteLog(entry) {
  const safeEntry = {
    ...entry,
    timestamp: new Date().toISOString()
  };

  const line = JSON.stringify(safeEntry) + '\n';

  fs.appendFile(LOG_FILE_PATH, line, (err) => {
    if (err) {

      console.error('Failed to write to route_log.jsonl:', err);
    }
  });
}

module.exports = {
  appendRouteLog
};
