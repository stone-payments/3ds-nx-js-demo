import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3333;
const ALLOWED_HOSTNAMES = process.env.ALLOWED_HOSTNAMES
  ? process.env.ALLOWED_HOSTNAMES.split(',').map((host) => host.trim())
  : ['3ds.stone.com.br', '3ds-sdx.stone.com.br', 'api.pagar.me'];

// Middlewares
app.use(cors());
app.use(express.json());

// POST /gen-token
app.post('/gen-token', async (req, res) => {
  try {
    const { api, secret_key } = req.body;

    if (typeof api !== 'string' || typeof secret_key !== 'string') {
      return res.status(400).send('Invalid request body');
    }

    const url = new URL(`${api}/tds-token`);

    if (!ALLOWED_HOSTNAMES.includes(url.hostname)) {
      return res.status(403).send('Hostname not allowed');
    }

    const authHeader = 'Basic ' + Buffer.from(`${secret_key}:`).toString('base64');
    console.log('Fetching token from:', url.toString());
    const response = await axios.get(url.toString(), {
      headers: {
        Authorization: authHeader,
      },
    });

    if (!response.data?.tds_token) {
      throw new Error('Missing tds_token');
    }

    res.json({ token: response.data.tds_token });
  } catch (error) {
    console.error('Error processing request:', error.message);

    if (axios.isAxiosError(error)) {
      console.log('Axios error details:', error);
      return res.status(502).send('Error fetching token');
    }

    if (error instanceof SyntaxError) {
      return res.status(400).send('Invalid JSON');
    }

    res.status(502).send('Invalid token response');
  }
});

// 404 handler
app.use((_req, res) => {
  res.status(404).send('Not Found');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
