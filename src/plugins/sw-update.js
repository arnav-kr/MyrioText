import fs from 'fs';
import path from 'path';

export default (fileName, buildDir) => {
  return {
    name: 'sw-update',
    closeBundle() {
      const nonce = Date.now().toString(16).slice(6) + Math.floor(Math.random() * 1e6).toString(16);
      const swFilePath = path.resolve(__dirname, "../../", buildDir, fileName);

      fs.readFile(swFilePath, 'utf8', (err, data) => {
        if (err) {
          console.error('Error reading service worker file:', err);
          return;
        }
        let newData = data.replace(/\/\/ nonce\{.*\} (.*)/i, `// nonce{${nonce}} $1`);
        fs.writeFile(swFilePath, newData, 'utf8', (err) => {
          if (err) {
            console.error('Error writing to service worker file:', err);
          }
        });
      });
    },
  };
};
