import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { generateQuizWithGemini } from './src/server/geminiQuizHandler.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// API route for AI quiz generation
app.post('/api/generate-quiz', async (req, res) => {
  try {
    const questions = await generateQuizWithGemini(req.body);
    res.json({ questions });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate quiz';
    console.error('API Error in /api/generate-quiz:', error);
    res.status(500).json({ error: message });
  }
});

// Serve static frontend files
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback to index.html for SPA
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`QuizPulse server running on port ${port}`);
});
