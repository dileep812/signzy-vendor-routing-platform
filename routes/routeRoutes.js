import express from 'express';
import { RouteController } from '../controllers/RouteController.js';

const router = express.Router();
const routeController = new RouteController();

router.post('/', routeController.handleRoute);

export default router;
