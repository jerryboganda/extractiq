import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/ready', async (_req, res) => {
  // Could check DB/Redis/MinIO connectivity here
  res.json({ status: 'ready', timestamp: new Date().toISOString() });
});

export { router as healthRouter };
