import { Router } from 'express';
import { createId, nowIso, paceSecondsPerKilo, toDateKey } from '../utils.js';

function sanitizePoint(point, index) {
  const latitude = Number(point.latitude);
  const longitude = Number(point.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return {
    id: createId(),
    latitude,
    longitude,
    accuracy: Number.isFinite(Number(point.accuracy)) ? Number(point.accuracy) : null,
    timestamp: point.timestamp || nowIso(),
    sequence: index,
  };
}

export function createRunsRouter(store) {
  const router = Router();

  router.post('/', async (req, res) => {
    try {
      const {
        startedAt,
        endedAt,
        distanceMeters,
        durationSeconds,
        caloriesKcal,
        notes,
        points,
      } = req.body || {};

      if (!startedAt || !endedAt) {
        return res.status(400).json({ error: '缺少开始或结束时间' });
      }
      const distance = Number(distanceMeters);
      const duration = Number(durationSeconds);
      if (!Number.isFinite(distance) || distance < 0) {
        return res.status(400).json({ error: '距离不合法' });
      }
      if (!Number.isFinite(duration) || duration <= 0) {
        return res.status(400).json({ error: '时长不合法' });
      }

      const runPoints = Array.isArray(points)
        ? points.map(sanitizePoint).filter(Boolean)
        : [];

      const run = await store.update((db) => {
        const record = {
          id: createId(),
          userId: req.user.id,
          startedAt: new Date(startedAt).toISOString(),
          endedAt: new Date(endedAt).toISOString(),
          distanceMeters: distance,
          durationSeconds: duration,
          avgPaceSecondsPerKilo: paceSecondsPerKilo(distance, duration),
          caloriesKcal: Number.isFinite(Number(caloriesKcal)) ? Number(caloriesKcal) : null,
          notes: typeof notes === 'string' ? notes.trim() : '',
          createdAt: nowIso(),
        };
        db.runs.push(record);
        for (const point of runPoints) {
          db.trackPoints.push({ ...point, runId: record.id });
        }
        return record;
      });

      return res.status(201).json({ run, points: runPoints });
    } catch (error) {
      return res.status(500).json({ error: error.message || '保存跑步记录失败' });
    }
  });

  router.get('/', async (req, res) => {
    const db = await store.read();
    let runs = db.runs.filter((run) => run.userId === req.user.id);

    const month = typeof req.query.month === 'string' ? req.query.month : null;
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      runs = runs.filter((run) => toDateKey(run.startedAt)?.startsWith(month));
    }

    runs.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
    return res.json({ runs });
  });

  router.get('/:id', async (req, res) => {
    const db = await store.read();
    const run = db.runs.find((item) => item.id === req.params.id && item.userId === req.user.id);
    if (!run) {
      return res.status(404).json({ error: '跑步记录不存在' });
    }
    const points = db.trackPoints
      .filter((point) => point.runId === run.id)
      .sort((a, b) => a.sequence - b.sequence);
    return res.json({ run, points });
  });

  return router;
}
