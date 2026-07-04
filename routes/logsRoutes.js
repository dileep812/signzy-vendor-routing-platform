import express from 'express';
import { getRoutingLogs } from '../controllers/LogsController.js';

const router = express.Router();
router.get('/', getRoutingLogs);

export default router;
