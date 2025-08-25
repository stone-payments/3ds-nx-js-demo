import http from 'http';
import https from 'https';
import { URL } from 'url';

const PORT = 3333;

const setCORS = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

const server = http.createServer(async (req, res) => {
  setCORS(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (req.method === 'POST' && req.url === '/gen-token') {
    let body = '';

    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const { api, secret_key } = JSON.parse(body);
        if (typeof api !== 'string' || typeof secret_key !== 'string') {
          res.writeHead(400);
          return res.end('Invalid request body');
        }

        const url = new URL(`${api}/tds-token`);
        const protocol = url.protocol === 'https:' ? https : http;

        const options = {
          hostname: url.hostname,
          port: url.port || (url.protocol === 'https:' ? 443 : 80),
          path: url.pathname + url.search,
          method: 'GET',
          headers: {
            Authorization:
              'Basic ' + Buffer.from(`${secret_key}:`).toString('base64'),
          },
        };

        const tokenReq = protocol.request(options, (tokenRes) => {
          let tokenData = '';
          tokenRes.on('data', (chunk) => (tokenData += chunk));
          tokenRes.on('end', () => {
            try {
              const parsed = JSON.parse(tokenData);
              if (!parsed.tds_token) throw new Error('Missing tds_token');
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ token: parsed.tds_token }));
            } catch (e) {
              // eslint-disable-next-line no-console
              console.error('Error parsing token response:', e);
              res.writeHead(502);
              res.end('Invalid token response');
            }
          });
        });

        tokenReq.on('error', () => {
          res.writeHead(502);
          res.end('Error fetching token');
        });

        tokenReq.end();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Error processing request:', e);
        res.writeHead(400);
        res.end('Invalid JSON');
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${PORT}`);
});
