import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database';

// Validation rules
export const createPaymentValidation = [
  body('user_id').notEmpty().withMessage('User ID is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('currency').optional().isString(),
  body('payment_method').isIn(['pi', 'card', 'wallet']).withMessage('Invalid payment method'),
];

export const approvePaymentValidation = [
  body('payment_id').notEmpty().withMessage('Payment ID is required'),
  body('pi_payment_id').optional().isString(),
];

// Create a new payment
export async function createPayment(req: Request, res: Response): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array(),
        },
      });
      return;
    }

    const { user_id, amount, currency = 'USD', payment_method, metadata } = req.body;

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        user_id,
        amount,
        currency,
        payment_method,
        metadata: metadata || {},
      },
    });

    res.status(201).json({
      success: true,
      data: {
        payment,
        message: 'Payment created successfully',
      },
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create payment',
      },
    });
  }
}

// Approve a payment
export async function approvePayment(req: Request, res: Response): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array(),
        },
      });
      return;
    }

    const { payment_id, pi_payment_id } = req.body;

    // Find payment
    const payment = await prisma.payment.findUnique({
      where: { id: payment_id },
    });

    if (!payment) {
      res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: 'Payment not found',
        },
      });
      return;
    }

    if (payment.status !== 'pending') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Payment cannot be approved',
        },
      });
      return;
    }

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: payment_id },
      data: {
        status: 'approved',
        pi_payment_id: pi_payment_id || undefined,
      },
    });

    res.json({
      success: true,
      data: {
        payment: updatedPayment,
        message: 'Payment approved successfully',
      },
    });
  } catch (error) {
    console.error('Approve payment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to approve payment',
      },
    });
  }
}

// Complete a payment
export async function completePayment(req: Request, res: Response): Promise<void> {
  try {
    const { payment_id } = req.body;

    if (!payment_id) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PAYMENT_ID',
          message: 'Payment ID is required',
        },
      });
      return;
    }

    // Find payment
    const payment = await prisma.payment.findUnique({
      where: { id: payment_id },
    });

    if (!payment) {
      res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: 'Payment not found',
        },
      });
      return;
    }

    if (payment.status !== 'approved') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Payment must be approved before completion',
        },
      });
      return;
    }

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: payment_id },
      data: {
        status: 'completed',
      },
    });

    res.json({
      success: true,
      data: {
        payment: updatedPayment,
        message: 'Payment completed successfully',
      },
    });
  } catch (error) {
    console.error('Complete payment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to complete payment',
      },
    });
  }
}

// Get payment status
export async function getPaymentStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        amount: true,
        currency: true,
        payment_method: true,
        pi_payment_id: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!payment) {
      res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: 'Payment not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: { payment },
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get payment status',
      },
    });
  }
}
