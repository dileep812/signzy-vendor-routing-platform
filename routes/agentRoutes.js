import express from 'express';
import { AgentController } from '../controllers/AgentController.js';

const router = express.Router();
const agentController = new AgentController();

router.get('/insights', agentController.getInsights);
router.post('/generate-config', agentController.generateConfig);

export default router;
