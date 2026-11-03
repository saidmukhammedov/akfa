import { Router } from 'express';
import {
  listVolumes,
  getVolume,
  createVolume,
  updateVolume,
  deleteVolume,
  getVolumeOverview,
} from '../controllers/volume.controller.js';
import { requireOwnerAuth } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { volumeCreateSchema, volumeUpdateSchema } from '@akfa/shared';

const router = Router();

// Multi-tenant protection: all volume endpoints require owner authentication
router.use(requireOwnerAuth);

router.get('/', listVolumes);
router.get('/overview', getVolumeOverview);
router.get('/:id', getVolume);
router.post('/', validateBody(volumeCreateSchema), createVolume);
router.put('/:id', validateBody(volumeUpdateSchema), updateVolume);
router.delete('/:id', deleteVolume);

export default router;
