import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './routes/api.js';
import { dbManager } from './db.js';
import { seedDatabase } from './seed.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api', apiRouter);

// Serve static frontend in production or if built
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// Client-side routing fallback for Express 5
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, err => {
    if (err) {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Adaptive Memory Guardian API</title></head>
          <body style="font-family: sans-serif; padding: 2rem; background: #0b0f19; color: #f3f4f6;">
            <h2>🛡️ Adaptive Memory Guardian Backend Active</h2>
            <p>Vite dev server is expected at <a style="color: #34d399;" href="http://localhost:5173">http://localhost:5173</a> during development.</p>
            <p>API status: <a style="color: #60a5fa;" href="/api/state">/api/state</a> | <a style="color: #60a5fa;" href="/api/db/status">/api/db/status</a></p>
          </body>
        </html>
      `);
    }
  });
});

async function start() {
  console.log('🚀 Initializing Adaptive Memory Guardian server...');

  // Connect to DB (Atlas or local fallback)
  await dbManager.connect(process.env.MONGODB_URI);

  // Ensure baseline data is seeded
  await seedDatabase(false);

  app.listen(PORT, () => {
    console.log(`✅ Server listening on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
