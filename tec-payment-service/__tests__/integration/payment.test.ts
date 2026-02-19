import request from 'supertest';
import express from 'express';
import { body, param, validationResult } from 'express-validator';

// Mock prisma client
const mockPrismaClient = {
  payment: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  $queryRaw: jest.fn(),
};

// Mock the database module
jest.mock('../../src/config/database', () => ({
  prisma: mockPrismaClient,
}));

// Import after mocking
import {
  createPayment,
  approvePayment,
  completePayment,
  getPaymentStatus,
} from '../../src/controllers/payment.controller';

// Test app setup
const app = express();
app.use(express.json());

// Routes
app.post(
  '/payments/create',
  [
    body('userId').notEmpty().isUUID(),
    body('amount').isFloat({ min: 0.01 }),
    body('currency').optional().isString(),
    body('payment_method').isIn(['pi', 'card', 'wallet']),
    body('metadata').optional().isObject(),
  ],
  createPayment
);

app.post(
  '/payments/approve',
  [body('payment_id').isUUID(), body('pi_payment_id').optional()],
  approvePayment
);

app.post(
  '/payments/complete',
  [body('payment_id').isUUID(), body('transaction_id').optional()],
  completePayment
);

app.get('/payments/:id/status', [param('id').isUUID()], getPaymentStatus);

describe('Payment Service Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /payments/create', () => {
    const validPaymentData = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      amount: 10.5,
      currency: 'PI',
      payment_method: 'pi',
      metadata: { description: 'Test payment' },
    };

    it('should create a payment successfully', async () => {
      const mockPayment = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        user_id: validPaymentData.userId,
        amount: validPaymentData.amount,
        currency: validPaymentData.currency,
        status: 'created',
        payment_method: validPaymentData.payment_method,
        metadata: validPaymentData.metadata,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrismaClient.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      mockPrismaClient.payment.create.mockResolvedValue(mockPayment);

      const response = await request(app)
        .post('/payments/create')
        .send(validPaymentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.payment).toMatchObject({
        id: mockPayment.id,
        user_id: validPaymentData.userId,
        amount: validPaymentData.amount,
        status: 'created',
      });
    });

    it('should return 400 for missing userId', async () => {
      const invalidData = { ...validPaymentData, userId: undefined };

      const response = await request(app)
        .post('/payments/create')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid amount (zero)', async () => {
      const invalidData = { ...validPaymentData, amount: 0 };

      const response = await request(app)
        .post('/payments/create')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid payment_method', async () => {
      const invalidData = { ...validPaymentData, payment_method: 'invalid' };

      const response = await request(app)
        .post('/payments/create')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid userId format', async () => {
      const invalidData = { ...validPaymentData, userId: 'not-a-uuid' };

      const response = await request(app)
        .post('/payments/create')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /payments/approve', () => {
    const validApprovalData = {
      payment_id: '123e4567-e89b-12d3-a456-426614174001',
      pi_payment_id: 'pi_123456',
    };

    it('should approve a payment successfully', async () => {
      const mockPayment = {
        id: validApprovalData.payment_id,
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        amount: 10.5,
        currency: 'PI',
        status: 'created',
        payment_method: 'pi',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockUpdatedPayment = {
        ...mockPayment,
        status: 'approved',
        pi_payment_id: validApprovalData.pi_payment_id,
        approved_at: new Date(),
      };

      mockPrismaClient.payment.findUnique.mockResolvedValue(mockPayment);
      mockPrismaClient.payment.update.mockResolvedValue(mockUpdatedPayment);

      const response = await request(app)
        .post('/payments/approve')
        .send(validApprovalData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.payment.status).toBe('approved');
    });

    it('should return 404 if payment not found', async () => {
      mockPrismaClient.payment.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/payments/approve')
        .send(validApprovalData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 if payment is not in created status', async () => {
      const mockPayment = {
        id: validApprovalData.payment_id,
        status: 'approved',
      };

      mockPrismaClient.payment.findUnique.mockResolvedValue(mockPayment);

      const response = await request(app)
        .post('/payments/approve')
        .send(validApprovalData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_STATUS');
    });

    it('should return 400 for invalid payment_id format', async () => {
      const invalidData = { ...validApprovalData, payment_id: 'not-a-uuid' };

      const response = await request(app)
        .post('/payments/approve')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /payments/complete', () => {
    const validCompletionData = {
      payment_id: '123e4567-e89b-12d3-a456-426614174001',
      transaction_id: 'tx_123456',
    };

    it('should complete a payment successfully', async () => {
      const mockPayment = {
        id: validCompletionData.payment_id,
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        amount: 10.5,
        currency: 'PI',
        status: 'approved',
        payment_method: 'pi',
        metadata: {},
        created_at: new Date(),
        approved_at: new Date(),
        updated_at: new Date(),
      };

      const mockUpdatedPayment = {
        ...mockPayment,
        status: 'completed',
        completed_at: new Date(),
        metadata: {
          transaction_id: validCompletionData.transaction_id,
        },
      };

      mockPrismaClient.payment.findUnique.mockResolvedValue(mockPayment);
      mockPrismaClient.payment.update.mockResolvedValue(mockUpdatedPayment);

      const response = await request(app)
        .post('/payments/complete')
        .send(validCompletionData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.payment.status).toBe('completed');
    });

    it('should return 404 if payment not found', async () => {
      mockPrismaClient.payment.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/payments/complete')
        .send(validCompletionData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 if payment is not in approved status', async () => {
      const mockPayment = {
        id: validCompletionData.payment_id,
        status: 'created',
      };

      mockPrismaClient.payment.findUnique.mockResolvedValue(mockPayment);

      const response = await request(app)
        .post('/payments/complete')
        .send(validCompletionData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_STATUS');
    });
  });

  describe('GET /payments/:id/status', () => {
    const paymentId = '123e4567-e89b-12d3-a456-426614174001';

    it('should get payment status successfully', async () => {
      const mockPayment = {
        id: paymentId,
        status: 'completed',
        amount: 10.5,
        currency: 'PI',
        payment_method: 'pi',
        created_at: new Date(),
        approved_at: new Date(),
        completed_at: new Date(),
        updated_at: new Date(),
      };

      mockPrismaClient.payment.findUnique.mockResolvedValue(mockPayment);

      const response = await request(app).get(`/payments/${paymentId}/status`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.payment).toMatchObject({
        id: paymentId,
        status: 'completed',
      });
    });

    it('should return 404 if payment not found', async () => {
      mockPrismaClient.payment.findUnique.mockResolvedValue(null);

      const response = await request(app).get(`/payments/${paymentId}/status`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid payment ID format', async () => {
      const response = await request(app).get('/payments/not-a-uuid/status');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
