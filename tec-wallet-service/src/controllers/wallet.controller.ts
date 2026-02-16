import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Validation rules
export const linkWalletValidation = [
  body('user_id').notEmpty().withMessage('User ID is required'),
  body('wallet_address').notEmpty().withMessage('Wallet address is required'),
  body('wallet_type').isIn(['pi', 'crypto', 'fiat']).withMessage('Invalid wallet type'),
  body('currency').optional().isString(),
];

// Get all wallets for a user
export async function getWallets(req: Request, res: Response): Promise<void> {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_USER_ID',
          message: 'User ID is required',
        },
      });
      return;
    }

    const wallets = await prisma.wallet.findMany({
      where: {
        user_id: user_id as string,
        is_active: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    res.json({
      success: true,
      data: { wallets },
    });
  } catch (error) {
    console.error('Get wallets error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get wallets',
      },
    });
  }
}

// Link a new wallet
export async function linkWallet(req: Request, res: Response): Promise<void> {
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

    const { user_id, wallet_address, wallet_type, currency = 'USD' } = req.body;

    // Check if wallet already exists
    const existingWallet = await prisma.wallet.findUnique({
      where: { wallet_address },
    });

    if (existingWallet) {
      res.status(409).json({
        success: false,
        error: {
          code: 'WALLET_EXISTS',
          message: 'Wallet with this address already exists',
        },
      });
      return;
    }

    // Create wallet
    const wallet = await prisma.wallet.create({
      data: {
        user_id,
        wallet_address,
        wallet_type,
        currency,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        wallet,
        message: 'Wallet linked successfully',
      },
    });
  } catch (error) {
    console.error('Link wallet error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to link wallet',
      },
    });
  }
}

// Get wallet balance
export async function getBalance(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const wallet = await prisma.wallet.findUnique({
      where: { id },
      select: {
        id: true,
        balance: true,
        currency: true,
        wallet_type: true,
      },
    });

    if (!wallet) {
      res.status(404).json({
        success: false,
        error: {
          code: 'WALLET_NOT_FOUND',
          message: 'Wallet not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: { wallet },
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get balance',
      },
    });
  }
}

// Get wallet transactions
export async function getTransactions(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Check if wallet exists
    const wallet = await prisma.wallet.findUnique({
      where: { id },
    });

    if (!wallet) {
      res.status(404).json({
        success: false,
        error: {
          code: 'WALLET_NOT_FOUND',
          message: 'Wallet not found',
        },
      });
      return;
    }

    // Get transactions
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { wallet_id: id },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count({
        where: { wallet_id: id },
      }),
    ]);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get transactions',
      },
    });
  }
}
