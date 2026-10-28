import { Router } from 'express';
import {
  listWorkers,
  getWorker,
  createWorker,
  updateWorker,
  archiveWorker,
  unarchiveWorker,
} from '../controllers/worker.controller.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { workerCreateSchema, workerUpdateSchema } from '@akfa/shared';
import { requireOwnerAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(requireOwnerAuth);

router.get('/', listWorkers);
router.get('/:id', getWorker);
router.post('/', validateBody(workerCreateSchema), createWorker);
router.put('/:id', validateBody(workerUpdateSchema), updateWorker);
router.post('/:id/archive', archiveWorker);
router.post('/:id/unarchive', unarchiveWorker);

export default router;
