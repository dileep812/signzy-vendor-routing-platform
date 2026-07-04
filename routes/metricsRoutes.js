import express from 'express';
import { getVendorMetrics } from '../controllers/MetricsController.js';

const router = express.Router();
router.get('/', getVendorMetrics);

export default router;
