import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { prisma } from '../config/database';

// Create a new payment (Stage 1: Created)
export const createPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: errors.array(),
        },
      });
      return;
    }

    const { userId, amount, currency = 'PI', payment_method, metadata } = req.body;

    const payment = await prisma.payment.create({
      data: {
        user_id: userId,
        amount,
        currency,
        payment_method,
        status: 'created',
        metadata: metadata || {},
      },
    });

    res.status(201).json({
      success: true,
      data: { payment },
    });
  } catch (error) {
    console.error('CreatePayment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create payment',
      },
    });
  }
};

// Approve a payment (Stage 2: Approved)
export const approvePayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
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
          code: 'NOT_FOUND',
          message: 'Payment not found',
        },
      });
      return;
    }

    if (payment.status !== 'created') {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Payment cannot be approved from status: ${payment.status}`,
        },
      });
      return;
    }

    // Update payment to approved
    const updatedPayment = await prisma.payment.update({
      where: { id: payment_id },
      data: {
        status: 'approved',
        pi_payment_id,
        approved_at: new Date(),
      },
    });

    res.json({
      success: true,
      data: { payment: updatedPayment },
    });
  } catch (error) {
    console.error('ApprovePayment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to approve payment',
      },
    });
  }
};

// Complete a payment (Stage 3: Completed)
export const completePayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: errors.array(),
        },
      });
      return;
    }

    const { payment_id, transaction_id } = req.body;

    // Find payment
    const payment = await prisma.payment.findUnique({
      where: { id: payment_id },
    });

    if (!payment) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Payment not found',
        },
      });
      return;
    }

    if (payment.status !== 'approved') {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Payment cannot be completed from status: ${payment.status}`,
        },
      });
      return;
    }

    // Update payment to completed
    const updatedPayment = await prisma.payment.update({
      where: { id: payment_id },
      data: {
        status: 'completed',
        completed_at: new Date(),
        metadata: {
          ...(payment.metadata as object || {}),
          transaction_id,
        },
      },
    });

    res.json({
      success: true,
      data: { payment: updatedPayment },
    });
  } catch (error) {
    console.error('CompletePayment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to complete payment',
      },
    });
  }
};

// Get payment status
export const getPaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: errors.array(),
        },
      });
      return;
    }

    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        amount: true,
        currency: true,
        payment_method: true,
        created_at: true,
        approved_at: true,
        completed_at: true,
        updated_at: true,
      },
    });

    if (!payment) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
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
    console.error('GetPaymentStatus error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get payment status',
      },
    });
  }
};
