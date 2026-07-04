import express from 'express';
import { VendorController } from '../controllers/VendorController.js';

const router = express.Router();
const vendorController = new VendorController();

// Map POST traffic endpoint directly to the controller execution block
router.post('/', vendorController.register);
router.get('/', vendorController.getAll);
export default router;