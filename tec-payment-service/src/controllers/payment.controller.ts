import { Request, Response } from 'express';
import { validationResult, ValidationError } from 'express-validator';
import { prisma } from '../config/database';
import { 
  PrismaClientKnownRequestError,
  PrismaClientInitializationError,
  PrismaClientRustPanicError 
} from '@prisma/client/runtime/library';

// Create a new payment (Stage 1: Created)
export const createPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn('CreatePayment validation failed:', { errors: errors.array(), body: req.body });
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data. Please check the request parameters.',
          details: errors.array().map((err: ValidationError) => ({
            field: err.type === 'field' ? err.path : 'unknown',
            message: err.msg,
            value: err.type === 'field' ? err.value : undefined,
          })),
        },
      });
      return;
    }

    const { userId, amount, currency = 'PI', payment_method, metadata } = req.body;
    
    console.log('Creating payment:', { userId, amount, currency, payment_method });

    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

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

    console.log('Payment created successfully:', { paymentId: payment.id, status: payment.status });

    res.status(201).json({
      success: true,
      data: { payment },
    });
  } catch (error) {
    console.error('CreatePayment error:', error);
    
    // Handle Prisma-specific errors
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_PAYMENT',
            message: 'A payment with this information already exists',
          },
        });
        return;
      }
      if (error.code === 'P2003') {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_USER',
            message: 'User ID does not exist in the system',
          },
        });
        return;
      }
    }
    
    // Handle database connection errors
    if (error instanceof PrismaClientInitializationError || 
        error instanceof PrismaClientRustPanicError) {
      res.status(503).json({
        success: false,
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Database connection failed. Please check DATABASE_URL configuration.',
        },
      });
      return;
    }
    
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
      console.warn('ApprovePayment validation failed:', { errors: errors.array(), body: req.body });
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data. Please check the request parameters.',
          details: errors.array().map((err: ValidationError) => ({
            field: err.type === 'field' ? err.path : 'unknown',
            message: err.msg,
            value: err.type === 'field' ? err.value : undefined,
          })),
        },
      });
      return;
    }

    const { payment_id, pi_payment_id } = req.body;
    
    console.log('Approving payment:', { payment_id, pi_payment_id });

    // Find payment
    const payment = await prisma.payment.findUnique({
      where: { id: payment_id },
    });

    if (!payment) {
      console.warn('Payment not found:', { payment_id });
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
      console.warn('Invalid payment status for approval:', { payment_id, currentStatus: payment.status });
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: `Payment cannot be approved from status: ${payment.status}. Expected status: created`,
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

    console.log('Payment approved successfully:', { paymentId: updatedPayment.id, status: updatedPayment.status });

    res.json({
      success: true,
      data: { payment: updatedPayment },
    });
  } catch (error) {
    console.error('ApprovePayment error:', error);
    
    // Handle Prisma-specific errors
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        res.status(410).json({
          success: false,
          error: {
            code: 'PAYMENT_MODIFIED',
            message: 'Payment was modified or deleted during approval',
          },
        });
        return;
      }
      if (error.code === 'P2002') {
        res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_PI_PAYMENT',
            message: 'This Pi payment ID is already associated with another payment',
          },
        });
        return;
      }
    }
    
    // Handle database connection errors
    if (error instanceof PrismaClientInitializationError || 
        error instanceof PrismaClientRustPanicError) {
      res.status(503).json({
        success: false,
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Database connection failed. Please check DATABASE_URL configuration.',
        },
      });
      return;
    }
    
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
      console.warn('CompletePayment validation failed:', { errors: errors.array(), body: req.body });
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data. Please check the request parameters.',
          details: errors.array().map((err: ValidationError) => ({
            field: err.type === 'field' ? err.path : 'unknown',
            message: err.msg,
            value: err.type === 'field' ? err.value : undefined,
          })),
        },
      });
      return;
    }

    const { payment_id, transaction_id } = req.body;
    
    console.log('Completing payment:', { payment_id, transaction_id });

    // Find payment
    const payment = await prisma.payment.findUnique({
      where: { id: payment_id },
    });

    if (!payment) {
      console.warn('Payment not found:', { payment_id });
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
      console.warn('Invalid payment status for completion:', { payment_id, currentStatus: payment.status });
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: `Payment cannot be completed from status: ${payment.status}. Expected status: approved`,
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
          ...(typeof payment.metadata === 'object' && payment.metadata !== null ? payment.metadata : {}),
          transaction_id,
        },
      },
    });

    console.log('Payment completed successfully:', { paymentId: updatedPayment.id, status: updatedPayment.status });

    res.json({
      success: true,
      data: { payment: updatedPayment },
    });
  } catch (error) {
    console.error('CompletePayment error:', error);
    
    // Handle Prisma-specific errors
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        res.status(410).json({
          success: false,
          error: {
            code: 'PAYMENT_MODIFIED',
            message: 'Payment was modified or deleted during completion',
          },
        });
        return;
      }
    }
    
    // Handle database connection errors
    if (error instanceof PrismaClientInitializationError || 
        error instanceof PrismaClientRustPanicError) {
      res.status(503).json({
        success: false,
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Database connection failed. Please check DATABASE_URL configuration.',
        },
      });
      return;
    }
    
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
      console.warn('GetPaymentStatus validation failed:', { errors: errors.array(), params: req.params });
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data. Please check the request parameters.',
          details: errors.array().map((err: ValidationError) => ({
            field: err.type === 'field' ? err.path : 'unknown',
            message: err.msg,
            value: err.type === 'field' ? err.value : undefined,
          })),
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
      console.warn('Payment not found:', { id });
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
    
    // Handle database connection errors
    if (error instanceof PrismaClientInitializationError || 
        error instanceof PrismaClientRustPanicError) {
      res.status(503).json({
        success: false,
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Database connection failed. Please check DATABASE_URL configuration.',
        },
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get payment status',
      },
    });
  }
};
