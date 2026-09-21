import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { ensureDataDirs } from './services/dataStorage.js';
import { ensureDefaultConfigs } from './services/transformConfigService.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok' }));

app.use('/api', routes);
app.use(errorHandler);

async function start() {
  await ensureDataDirs();
  try {
    await ensureDefaultConfigs();
  } catch (err) {
    console.warn('Could not seed transformation configs (database may not be ready):', err.message);
  }
  app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

start();
