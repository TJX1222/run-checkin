import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { config } from '../config.js';
import { publicUser } from '../utils.js';

function requireAdminToken(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token || token !== config.adminToken) {
    return res.status(401).json({ error: '管理端令牌无效' });
  }
  next();
}

export function createAdminRouter(store) {
  const router = Router();

  router.use(requireAdminToken);

  router.get('/users', async (_req, res) => {
    try {
      const db = await store.read();
      const users = db.users.map((user) => {
        const userRuns = db.runs.filter((run) => run.userId === user.id);
        const totalDistance = userRuns.reduce((sum, run) => sum + (run.distanceMeters || 0), 0);
        return {
          ...publicUser(user),
          runCount: userRuns.length,
          totalDistanceMeters: totalDistance,
        };
      });
      return res.json({ users });
    } catch (error) {
      return res.status(500).json({ error: '获取用户列表失败' });
    }
  });

  router.get('/runs', async (req, res) => {
    try {
      const db = await store.read();
      const { userId } = req.query;
      let runs = db.runs;
      if (userId) {
        runs = runs.filter((run) => run.userId === userId);
      }
      runs = runs.slice().sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
      return res.json({ runs });
    } catch (error) {
      return res.status(500).json({ error: '获取跑步记录失败' });
    }
  });

  router.get('/stats', async (_req, res) => {
    try {
      const db = await store.read();
      const totalDistance = db.runs.reduce((sum, run) => sum + (run.distanceMeters || 0), 0);
      const totalDuration = db.runs.reduce((sum, run) => sum + (run.durationSeconds || 0), 0);
      return res.json({
        userCount: db.users.length,
        runCount: db.runs.length,
        totalDistanceMeters: totalDistance,
        totalDurationSeconds: totalDuration,
      });
    } catch (error) {
      return res.status(500).json({ error: '获取统计失败' });
    }
  });

  router.post('/users/:id/reset-password', async (req, res) => {
    try {
      const { password } = req.body || {};
      if (!password || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ error: '新密码至少 6 个字符' });
      }

      const updated = await store.update((db) => {
        const user = db.users.find((item) => item.id === req.params.id);
        if (!user) {
          const error = new Error('用户不存在');
          error.status = 404;
          throw error;
        }
        user.passwordHash = bcrypt.hashSync(password, 10);
        user.updatedAt = new Date().toISOString();
        return user;
      });

      return res.json({ user: publicUser(updated), message: '密码已重置' });
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message || '重置密码失败' });
    }
  });

  return router;
}
