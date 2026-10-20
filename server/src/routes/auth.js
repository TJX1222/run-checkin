import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { signToken } from '../auth.js';
import { createId, nowIso, publicUser } from '../utils.js';

export function createAuthRouter(store) {
  const router = Router();

  router.post('/register', async (req, res) => {
    try {
      const { username, password, email } = req.body || {};
      if (!username || typeof username !== 'string' || username.trim().length < 3) {
        return res.status(400).json({ error: '用户名至少 3 个字符' });
      }
      if (!password || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ error: '密码至少 6 个字符' });
      }

      const normalizedUsername = username.trim();
      const normalizedEmail = email && typeof email === 'string' ? email.trim() : null;

      const created = await store.update((db) => {
        if (db.users.some((user) => user.username === normalizedUsername)) {
          const error = new Error('用户名已存在');
          error.status = 409;
          throw error;
        }

        const user = {
          id: createId(),
          username: normalizedUsername,
          email: normalizedEmail,
          passwordHash: bcrypt.hashSync(password, 10),
          createdAt: nowIso(),
        };
        db.users.push(user);
        return user;
      });

      return res.status(201).json({
        user: publicUser(created),
        token: signToken(created),
      });
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message || '注册失败' });
    }
  });

  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body || {};
      if (!username || !password) {
        return res.status(400).json({ error: '请输入用户名和密码' });
      }

      const db = await store.read();
      const user = db.users.find((item) => item.username === username.trim());
      if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
        return res.status(401).json({ error: '用户名或密码错误' });
      }

      return res.json({
        user: publicUser(user),
        token: signToken(user),
      });
    } catch (error) {
      return res.status(500).json({ error: '登录失败' });
    }
  });

  return router;
}
