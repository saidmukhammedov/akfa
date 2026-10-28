import { Router } from 'express';
import {
  getAttendanceByDate,
  markAttendance,
  bulkMarkAttendance,
} from '../controllers/attendance.controller.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { markAttendanceSchema, bulkAttendanceSchema } from '@akfa/shared';
import { requireOwnerAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(requireOwnerAuth);

router.get('/', getAttendanceByDate);
router.post('/mark', validateBody(markAttendanceSchema), markAttendance);
router.post('/bulk', validateBody(bulkAttendanceSchema), bulkMarkAttendance);

export default router;
