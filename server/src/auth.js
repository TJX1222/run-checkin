import jwt from 'jsonwebtoken';
import { config } from './config.js';

export function signToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

export function requireAuth(store) {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;
      if (!token) {
        return res.status(401).json({ error: '缺少登录凭证' });
      }

      const payload = jwt.verify(token, config.jwtSecret);
      const db = await store.read();
      const user = db.users.find((item) => item.id === payload.sub);
      if (!user) {
        return res.status(401).json({ error: '用户不存在或登录已失效' });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ error: '登录凭证无效或已过期' });
    }
  };
}
