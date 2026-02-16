import { Router } from 'express';
import {
  getWallets,
  linkWallet,
  getBalance,
  getTransactions,
  linkWalletValidation,
} from '../controllers/wallet.controller';

const router = Router();

// Wallet routes
router.get('/wallets', getWallets);
router.post('/wallets/link', linkWalletValidation, linkWallet);
router.get('/wallets/:id/balance', getBalance);
router.get('/wallets/:id/transactions', getTransactions);

export default router;
