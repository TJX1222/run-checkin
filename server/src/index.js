import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { JsonStore } from './store.js';
import { requireAuth } from './auth.js';
import { publicUser } from './utils.js';
import { createAuthRouter } from './routes/auth.js';
import { createRunsRouter } from './routes/runs.js';
import { createStatsRouter } from './routes/stats.js';
import { createAdminRouter } from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const store = new JsonStore(config.dataFile);
const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'run-checkin-server' });
});

app.use('/api/auth', createAuthRouter(store));
app.use('/api/me', requireAuth(store), (req, res) => {
  res.json({ user: publicUser(req.user) });
});
app.use('/api/runs', requireAuth(store), createRunsRouter(store));
app.use('/api/stats', requireAuth(store), createStatsRouter(store));
app.use('/api/admin', createAdminRouter(store));

app.get('/admin', (_req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'public', 'admin.html'));
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在', path: req.path });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(config.port, () => {
  console.log(`Run check-in server listening on http://localhost:${config.port}`);
});
