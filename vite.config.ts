import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import dotenv from 'dotenv';

// Load environment variables for server-side Gemini integration
dotenv.config();

function quizApiPlugin(): Plugin {
  return {
    name: 'quiz-api-plugin',
    configureServer(server) {
      server.middlewares.use('/api/generate-quiz', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', async () => {
          try {
            const { generateQuizWithGemini } = await import('./src/server/geminiQuizHandler.ts');
            const data = JSON.parse(body || '{}');
            const questions = await generateQuizWithGemini(data);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ questions }));
          } catch (err: unknown) {
            console.error('Server error generating quiz:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            const message = err instanceof Error ? err.message : 'Failed to generate quiz';
            res.end(JSON.stringify({ error: message }));
          }
        });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), quizApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
