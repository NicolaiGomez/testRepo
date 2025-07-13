import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUDIT_FILE = path.join(__dirname, '../data/audit-log.json');
const EMBED_URL = 'https://api.openai.com/v1/embeddings';
const EMBEDDING_MODEL = 'text-embedding-3-small';


const getEmbedding = async (text) => {
  const response = await axios.post(
    EMBED_URL,
    {
      input: text,
      model: EMBEDDING_MODEL
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data.data[0].embedding;
};

const cosineSimilarity = (a, b) => {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val ** 2, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val ** 2, 0));
  return dot / (normA * normB);
};

export async function getSimilarAuditEntries  (query, topK = 3) {
  const auditEntries = JSON.parse(await fs.readFile(AUDIT_FILE, 'utf-8'));
  const queryEmbedding = await getEmbedding(query);

  const results = [];
  for (const entry of auditEntries) {
    const reason = entry.reason || '';
    const reasonEmbedding = await getEmbedding(reason);
    const similarity = cosineSimilarity(queryEmbedding, reasonEmbedding);
    results.push({ ...entry, similarity });
  }

  return results.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
};
