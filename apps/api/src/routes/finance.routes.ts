import { Router } from 'express';
import {
  getFinanceOverview,
  getWorkerFinanceSummaries,
  getWorkerFinanceDetails,
  recordPayment,
  getPaymentHistory,
} from '../controllers/finance.controller.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { paymentCreateSchema } from '@akfa/shared';
import { requireOwnerAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(requireOwnerAuth);

router.get('/overview', getFinanceOverview);
router.get('/summaries', getWorkerFinanceSummaries);
router.get('/workers/:workerId', getWorkerFinanceDetails);
router.post('/payments', validateBody(paymentCreateSchema), recordPayment);
router.get('/payments', getPaymentHistory);

export default router;
