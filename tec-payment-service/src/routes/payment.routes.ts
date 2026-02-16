import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  createPayment,
  approvePayment,
  completePayment,
  getPaymentStatus,
} from '../controllers/payment.controller';

const router = Router();

// POST /payments/create - Create a new payment
router.post(
  '/create',
  [
    body('userId').notEmpty(),
    body('amount').isFloat({ min: 0 }),
    body('currency').optional(),
    body('payment_method').isIn(['pi', 'card', 'wallet']),
    body('metadata').optional().isObject(),
  ],
  createPayment
);

// POST /payments/approve - Approve a payment (second stage)
router.post(
  '/approve',
  [
    body('payment_id').isUUID(),
    body('pi_payment_id').optional(),
  ],
  approvePayment
);

// POST /payments/complete - Complete a payment (final stage)
router.post(
  '/complete',
  [
    body('payment_id').isUUID(),
    body('transaction_id').optional(),
  ],
  completePayment
);

// GET /payments/:id/status - Get payment status
router.get(
  '/:id/status',
  [param('id').isUUID()],
  getPaymentStatus
);

export default router;
