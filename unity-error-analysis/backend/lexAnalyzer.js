const fs = require("fs");

function extractErrors(logFilePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(logFilePath, "utf8", (err, data) => {
      if (err) return reject(err);

      const errors = [];
      const lines = data.split("\n");

      lines.forEach((line) => {
        if (line.includes("Error") || line.includes("Exception")) {
          const match = line.match(/(\d+:\d+:\d+).*?(Error|Exception): (.+)/);
          if (match) {
            const [_, timestamp, errorType, message] = match;
            errors.push({ timestamp, type: errorType, message });
          }
        }
      });

      resolve(errors);
    });
  });
}

module.exports = { extractErrors };
