import express from 'express';
import { updateFuelPrice, getCurrentFuelPrice } from '../controllers/fuelPriceController.js';

const router = express.Router();

router.post('/update', updateFuelPrice);
router.get('/current', getCurrentFuelPrice);

export default router;