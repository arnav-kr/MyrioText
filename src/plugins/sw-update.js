import fs from 'fs';
import path from 'path';

export default (fileName, buildDir) => {
  return {
    name: 'sw-update',
    transform(code, id) {
      if (id.endsWith(fileName)) {
        let nonce = Date.now().toString(16).slice(6) + Math.floor(Math.random() * 1e6).toString(16);
        const newContent = `// ${nonce}\n${code}`;
        return { code: newContent, map: null };
      }
      return null;
    },
    closeBundle() {
      const nonce = Date.now().toString(16).slice(6) + Math.floor(Math.random() * 1e6).toString(16);
      const swFilePath = path.resolve(__dirname, "../../", buildDir, fileName);

      fs.readFile(swFilePath, 'utf8', (err, data) => {
        if (err) {
          console.error('Error reading service worker file:', err);
          return;
        }

        const newContent = `// ${nonce}\n${data}`;
        fs.writeFile(swFilePath, newContent, 'utf8', (err) => {
          if (err) {
            console.error('Error writing to service worker file:', err);
          }
        });
      });
    },
  };
};
