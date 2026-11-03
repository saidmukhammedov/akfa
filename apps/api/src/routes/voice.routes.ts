import { Router } from 'express';
import {
  processAudio,
  parseTextCommand,
  confirmVoiceCommand,
  getVoiceHistory,
} from '../controllers/voice.controller.js';
import { requireOwnerAuth } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import {
  processAudioInputSchema,
  parseTextInputSchema,
  confirmVoiceCommandSchema,
} from '@akfa/shared';

const router = Router();

// Multi-tenant protection: all voice command endpoints require owner authentication
router.use(requireOwnerAuth);

router.post('/process-audio', validateBody(processAudioInputSchema), processAudio);
router.post('/parse-text', validateBody(parseTextInputSchema), parseTextCommand);
router.post('/confirm', validateBody(confirmVoiceCommandSchema), confirmVoiceCommand);
router.get('/history', getVoiceHistory);

export default router;
