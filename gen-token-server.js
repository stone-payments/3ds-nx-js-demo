import http from 'http';
import https from 'https';
import { URL } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3333;
const ALLOWED_HOSTNAMES = process.env.ALLOWED_HOSTNAMES 
  ? process.env.ALLOWED_HOSTNAMES.split(',').map(host => host.trim())
  : ['3ds.stone.com.br', '3ds-sdx.stone.com.br', 'api.pagar.me'];

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
        
        if (!ALLOWED_HOSTNAMES.includes(url.hostname)) {
          res.writeHead(403);
          return res.end('Hostname not allowed');
        }

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
  console.log(`Server running on http://localhost:${PORT}`);
});
