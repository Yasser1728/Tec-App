'use client';

import { usePiAuth } from '@/hooks/usePiAuth';
import { usePiPayment } from '@/hooks/usePiPayment';
import { useTranslation } from '@/lib/i18n';
import styles from './PiIntegration.module.css';

export default function PiIntegration() {
  const { user, isAuthenticated, login } = usePiAuth();
  const { isProcessing, lastPayment, testSDK, payDemoPi } = usePiPayment();
  const { t } = useTranslation();

  const handleConnect = async () => {
    if (!isAuthenticated) {
      await login();
    }
  };

  const handleTestSdk = () => {
    const available = testSDK();
    if (available) {
      console.log('✅ Pi SDK Test: PASSED');
      console.log('🌐 Mainnet Mode: Real Pi payments enabled');
    } else {
      console.log('❌ Pi SDK Test: FAILED - SDK not available');
    }
  };

  const handlePayDemo = async () => {
    try {
      await payDemoPi();
    } catch (err) {
      console.error('Payment error:', err);
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
              🌐 {t.dashboard.piIntegration.mainnetMode}
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
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <span>{t.dashboard.piIntegration.processing}</span>
                ) : (
                  <span>💎 {t.dashboard.piIntegration.payDemo}</span>
                )}
              </button>
            </div>

            {lastPayment?.success && (
              <div className={styles.success}>
                ✅ {t.dashboard.piIntegration.paymentSuccess}
              </div>
            )}

            {lastPayment && !lastPayment.success && (
              <div className={styles.error}>
                ❌ {t.dashboard.piIntegration.paymentFailed}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
