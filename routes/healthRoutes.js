import express from 'express';
import { getHealthStatus } from '../controllers/healthController.js';

const router = express.Router();

// Maps GET /health directly to the status evaluator
router.get('/', getHealthStatus);

export default router;