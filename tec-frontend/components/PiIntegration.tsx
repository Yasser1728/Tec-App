'use client';

import { usePiAuth } from '@/hooks/usePiAuth';
import { usePiPayment } from '@/hooks/usePiPayment';
import { useTranslation } from '@/lib/i18n';
import { useState } from 'react';
import styles from './PiIntegration.module.css';

type PaymentState = 'idle' | 'processing' | 'approving' | 'completing' | 'success' | 'error' | 'cancelled';

export default function PiIntegration() {
  const { user, isAuthenticated, login } = usePiAuth();
  const { isProcessing, lastPayment, testSDK, payDemoPi } = usePiPayment();
  const { t } = useTranslation();
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleConnect = async () => {
    if (!isAuthenticated) {
      await login();
    }
  };

  const handleTestSdk = () => {
    const available = testSDK();
    if (available) {
      console.log('✅ Pi SDK Test: PASSED');
      console.log('🌐 Testnet Mode: Demo payments enabled');
    } else {
      console.log('❌ Pi SDK Test: FAILED - SDK not available');
    }
  };

  const handlePayDemo = async () => {
    try {
      setPaymentState('processing');
      setErrorMessage('');
      
      console.log('[PiIntegration] Starting demo payment...');
      const result = await payDemoPi();
      
      console.log('[PiIntegration] Payment result:', result);
      
      if (result.success && result.status === 'completed') {
        setPaymentState('success');
      } else if (result.status === 'cancelled') {
        setPaymentState('cancelled');
      } else {
        setPaymentState('error');
        setErrorMessage(result.message || 'فشلت الدفعة / Payment failed');
      }
    } catch (err) {
      console.error('[PiIntegration] Payment error:', err);
      setPaymentState('error');
      setErrorMessage(err instanceof Error ? err.message : 'حدث خطأ غير متوقع / Unexpected error occurred');
    }
  };

  const handleRetry = () => {
    setPaymentState('idle');
    setErrorMessage('');
  };

  const getPaymentStatusMessage = () => {
    switch (paymentState) {
      case 'processing':
        return 'جاري معالجة الدفعة... / Processing payment...';
      case 'approving':
        return 'جاري الموافقة... / Approving...';
      case 'completing':
        return 'جاري الإكمال... / Completing...';
      case 'success':
        return lastPayment?.message || 'تمت الدفعة بنجاح! 🎉 / Payment successful! 🎉';
      case 'cancelled':
        return 'ألغيت الدفعة / Payment cancelled';
      case 'error':
        return errorMessage;
      default:
        return '';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h3 className={styles.title}>
          🌐 {t.dashboard.piIntegration.title}
        </h3>

        {!isAuthenticated ? (
          <button className={`${styles.btn} ${styles.btnConnect}`} onClick={handleConnect}>
            {t.dashboard.piIntegration.connectBtn}
          </button>
        ) : (
          <>
            <div className={styles.authenticated}>
              <span className={styles.checkmark}>✅</span>
              <span>{t.dashboard.piIntegration.authenticated} <strong>@{user?.piUsername}</strong></span>
            </div>

            <div className={styles.mainnetIndicator}>
              🌐 Testnet Mode: Demo payments
            </div>

            <div className={styles.buttonGroup}>
              <button 
                className={`${styles.btn} ${styles.btnTest}`} 
                onClick={handleTestSdk}
              >
                🖊️ {t.dashboard.piIntegration.testSdk}
              </button>

              <button 
                className={`${styles.btn} ${styles.btnPay}`} 
                onClick={handlePayDemo}
                disabled={isProcessing || paymentState === 'processing'}
              >
                {isProcessing || paymentState === 'processing' ? (
                  <span>⏳ {t.dashboard.piIntegration.processing}</span>
                ) : (
                  <span>💎 {t.dashboard.piIntegration.payDemo}</span>
                )}
              </button>
            </div>

            {/* Payment Status Messages */}
            {paymentState === 'success' && lastPayment && (
              <div className={styles.success}>
                <div className={styles.successMessage}>
                  ✅ {getPaymentStatusMessage()}
                </div>
                {lastPayment.txid && (
                  <div className={styles.txidInfo}>
                    <small>
                      txid: <code>{lastPayment.txid}</code>
                    </small>
                  </div>
                )}
                {lastPayment.paymentId && (
                  <div className={styles.paymentIdInfo}>
                    <small>
                      Payment ID: <code>{lastPayment.paymentId}</code>
                    </small>
                  </div>
                )}
              </div>
            )}

            {paymentState === 'cancelled' && (
              <div className={styles.warning}>
                ⚠️ {getPaymentStatusMessage()}
              </div>
            )}

            {paymentState === 'error' && (
              <div className={styles.error}>
                <div className={styles.errorMessage}>
                  ❌ {getPaymentStatusMessage()}
                </div>
                <button 
                  className={`${styles.btn} ${styles.btnRetry}`} 
                  onClick={handleRetry}
                >
                  🔄 إعادة المحاولة / Retry
                </button>
              </div>
            )}

            {(paymentState === 'processing' || paymentState === 'approving' || paymentState === 'completing') && (
              <div className={styles.processing}>
                <div className={styles.spinner}></div>
                <div>{getPaymentStatusMessage()}</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
