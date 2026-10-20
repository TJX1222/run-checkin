import { Router } from 'express';
import { computeStreak, toDateKey } from '../utils.js';

export function createStatsRouter(store) {
  const router = Router();

  router.get('/summary', async (req, res) => {
    const db = await store.read();
    const runs = db.runs.filter((run) => run.userId === req.user.id);
    const today = new Date().toISOString().slice(0, 10);
    const month = today.slice(0, 7);

    const todayRuns = runs.filter((run) => toDateKey(run.startedAt) === today);
    const monthRuns = runs.filter((run) => toDateKey(run.startedAt)?.startsWith(month));

    const sumDistance = (items) => items.reduce((total, run) => total + run.distanceMeters, 0);
    const sumDuration = (items) => items.reduce((total, run) => total + run.durationSeconds, 0);

    return res.json({
      today: {
        checkedIn: todayRuns.length > 0,
        count: todayRuns.length,
        distanceMeters: sumDistance(todayRuns),
        durationSeconds: sumDuration(todayRuns),
      },
      streakDays: computeStreak(runs),
      month: {
        count: monthRuns.length,
        distanceMeters: sumDistance(monthRuns),
        durationSeconds: sumDuration(monthRuns),
      },
      total: {
        count: runs.length,
        distanceMeters: sumDistance(runs),
        durationSeconds: sumDuration(runs),
      },
    });
  });

  return router;
}
