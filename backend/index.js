import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import { handleUserUpdate } from '../updateAgent.js';

// ESM __dirname shim
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
  // Send the 'index.html' file located in the current directory
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// API endpoint to handle updates
app.post('/api/update-user', async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Missing input text.' });
  }

  try {
    const result = await handleUserUpdate(text);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
