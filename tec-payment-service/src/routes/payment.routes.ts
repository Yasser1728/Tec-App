import { Router } from 'express';
import {
  createPayment,
  approvePayment,
  completePayment,
  getPaymentStatus,
  createPaymentValidation,
  approvePaymentValidation,
} from '../controllers/payment.controller';

const router = Router();

// Payment routes
router.post('/payments/create', createPaymentValidation, createPayment);
router.post('/payments/approve', approvePaymentValidation, approvePayment);
router.post('/payments/complete', completePayment);
router.get('/payments/:id/status', getPaymentStatus);

export default router;
