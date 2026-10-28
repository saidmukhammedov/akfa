import { Router } from 'express';
import authRoutes from './auth.routes.js';
import workerRoutes from './worker.routes.js';
import attendanceRoutes from './attendance.routes.js';
import financeRoutes from './finance.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    system: 'AKFA Workshop API',
    version: '0.1.0',
    phase: 1,
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/workers', workerRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/finance', financeRoutes);

export default router;
