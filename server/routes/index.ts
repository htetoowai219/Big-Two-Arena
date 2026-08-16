import { Router } from 'express';
import { getRoom } from '../controllers/roomController';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

router.get('/rooms/:roomId', getRoom);

export default router;
