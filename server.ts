/**
 * Simple HTTP Server for Development
 * Serves static files for the FL Studio Web DAW
 */

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url ?? '');

  const ext = path.extname(filePath);
  let contentType = 'text/html';

  switch (ext) {
    case '.css':
      contentType = 'text/css';
      break;
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.jpg':
    case '.jpeg':
      contentType = 'image/jpeg';
      break;
    case '.svg':
      contentType = 'image/svg+xml';
      break;
    default:
      contentType = 'text/html';
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

const PORT = 8000;
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`FL Studio Web App server running at http://localhost:${PORT}`);
});

