import { Router } from 'express';
import {
  listWorkers,
  getWorker,
  createWorker,
  updateWorker,
  archiveWorker,
  unarchiveWorker,
  deleteWorker,
  purgeAllWorkersAndHistory,
} from '../controllers/worker.controller.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { workerCreateSchema, workerUpdateSchema } from '@akfa/shared';
import { requireOwnerAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(requireOwnerAuth);

router.get('/', listWorkers);
router.delete('/all', purgeAllWorkersAndHistory);
router.get('/:id', getWorker);
router.post('/', validateBody(workerCreateSchema), createWorker);
router.put('/:id', validateBody(workerUpdateSchema), updateWorker);
router.delete('/:id', deleteWorker);
router.post('/:id/archive', archiveWorker);
router.post('/:id/unarchive', unarchiveWorker);

export default router;
