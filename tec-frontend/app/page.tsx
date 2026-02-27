'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePiAuth } from '@/lib-client/hooks/usePiAuth';
import { usePiPayment } from '@/lib-client/hooks/usePiPayment';
import { useDiagnostics } from '@/lib-client/hooks/useDiagnostics';
import { useTranslation } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import styles from './page.module.css';

type PaymentState = 'idle' | 'processing' | 'success' | 'error' | 'cancelled';

/** How long to wait for SDK init signals before marking SDK as unavailable (ms) */
const SDK_DETECTION_TIMEOUT_MS = 5000;

export default function HomePage() {
  const { isAuthenticated, isLoading, error, login } = usePiAuth();
  const { addEvent } = useDiagnostics();
  
  // Memoize the diagnostic callback to prevent unnecessary re-renders
  const diagnosticCallback = useCallback((type: string, message: string, data?: unknown) => {
    addEvent(type as any, message, data);
  }, [addEvent]);
  
  const { isProcessing, lastPayment, error: paymentError, errorType: paymentErrorType, payDemoPi } = usePiPayment({
    onDiagnostic: diagnosticCallback,
  });
  const { t } = useTranslation();
  const router = useRouter();
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  // null = unknown/loading, true = SDK ready, false = SDK failed/unavailable
  const [sdkReady, setSdkReady] = useState<boolean | null>(null);
  const [warningDismissed, setWarningDismissed] = useState(false);
  const [sdkTestResult, setSdkTestResult] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) router.push('/dashboard');
  }, [isAuthenticated, router]);

  // Determine SDK availability via events (not User-Agent)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Already initialized before this component mounted
    if (window.__TEC_PI_READY) {
      setSdkReady(true);
      return;
    }
    if (window.__TEC_PI_ERROR) {
      setSdkReady(false);
      return;
    }

    const onReady = () => setSdkReady(true);
    const onError = () => setSdkReady(false);

    window.addEventListener('tec-pi-ready', onReady, { once: true });
    window.addEventListener('tec-pi-error', onError, { once: true });

    // After 5 seconds with no signal, mark as unavailable
    const timer = setTimeout(() => {
      if (window.__TEC_PI_READY) {
        setSdkReady(true);
      } else {
        setSdkReady(false);
      }
    }, SDK_DETECTION_TIMEOUT_MS);

    return () => {
      window.removeEventListener('tec-pi-ready', onReady);
      window.removeEventListener('tec-pi-error', onError);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    // Add SDK initialization event on mount
    if (typeof window !== 'undefined') {
      const checkSDK = () => {
        const ready = !!(window as any).__TEC_PI_READY;
        if (ready) {
          addEvent('sdk_init', 'Pi SDK initialized successfully');
        }
      };

      const handlePiReady = () => {
        addEvent('sdk_init', 'Pi SDK initialized successfully');
      };

      checkSDK();
      window.addEventListener('tec-pi-ready', handlePiReady);

      return () => {
        window.removeEventListener('tec-pi-ready', handlePiReady);
      };
    }
  }, [addEvent]);

  const handleLogin = async () => {
    try {
      addEvent('auth', 'Login attempt started');
      await login();
      addEvent('auth', 'Login successful');
      router.push('/dashboard');
    } catch (err: unknown) {
      // Error is already handled in usePiAuth hook
      const errorMsg = err instanceof Error ? err.message : 'Login failed';
      addEvent('error', `Login failed: ${errorMsg}`);
      console.error('Login failed:', err);
    }
  };

  const handlePayDemo = async () => {
    try {
      setPaymentState('processing');
      setErrorMessage('');
      
      console.log('[HomePage] Starting demo payment...');
      const result = await payDemoPi();
      
      console.log('[HomePage] Payment result:', result);
      
      if (result.success && result.status === 'completed') {
        setPaymentState('success');
      } else if (result.status === 'cancelled') {
        setPaymentState('cancelled');
      } else {
        setPaymentState('error');
        setErrorMessage(result.message || 'فشلت الدفعة / Payment failed');
      }
    } catch (err) {
      console.error('[HomePage] Payment error:', err);
      setPaymentState('error');
      
      const message = paymentError || (err instanceof Error ? err.message : 'حدث خطأ غير متوقع / Unexpected error occurred');
      setErrorMessage(message);
    }
  };

  const handleRetry = () => {
    setPaymentState('idle');
    setErrorMessage('');
  };

  const handleTestSdk = () => {
    const ready = !!(typeof window !== 'undefined' && (window as any).__TEC_PI_READY);
    const piAvailable = !!(typeof window !== 'undefined' && typeof (window as any).Pi !== 'undefined');
    const message = ready
      ? '✅ Pi SDK is loaded! Check console for details.'
      : piAvailable
      ? '⚠️ Pi object found but SDK not fully initialized.'
      : '❌ Pi SDK not available. Open in Pi Browser.';
    console.log('[TEC] Test SDK:', { ready, piAvailable });
    setSdkTestResult(message);
    if (typeof window !== 'undefined') {
      window.alert(message);
    }
  };

  const getPaymentStatusMessage = () => {
    switch (paymentState) {
      case 'processing':
        return 'جاري معالجة الدفعة... / Processing payment...';
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

  const getErrorMessageWithInstructions = () => {
    if (paymentState === 'error' && paymentErrorType) {
      switch (paymentErrorType) {
        case 'not_pi_browser':
          return (
            <>
              <div>❌ {errorMessage}</div>
              <div style={{ marginTop: '8px', fontSize: '0.9em' }}>
                <div>📱 يرجى فتح التطبيق داخل متصفح Pi Network</div>
                <div>📱 Please open the app inside Pi Browser</div>
              </div>
            </>
          );
        case 'timeout':
          return (
            <>
              <div>⏱️ {errorMessage}</div>
              <div style={{ marginTop: '8px', fontSize: '0.9em' }}>
                <div>🔄 يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى</div>
                <div>🔄 Please check your internet connection and try again</div>
              </div>
            </>
          );
        case 'approval_failed':
          return (
            <>
              <div>❌ {errorMessage}</div>
              <div style={{ marginTop: '8px', fontSize: '0.9em' }}>
                <div>⚠️ فشلت الموافقة على الدفع من الخادم</div>
                <div>⚠️ Server approval failed - payment may be incomplete</div>
              </div>
            </>
          );
        default:
          return <div>❌ {errorMessage}</div>;
      }
    }
    
    return <div>❌ {errorMessage}</div>;
  };

  const apps = [
    { name: 'Nexus' },
    { name: 'Commerce' },
    { name: 'Assets' },
    { name: 'Fundx' },
    { name: 'Estate' },
    { name: 'Analytics' },
  ];

  return (
    <main className={styles.main}>
      <div className={styles.bg}>
        <div className={styles.bgOrb1} />
        <div className={styles.bgOrb2} />
        <div className={styles.bgGrid} />
      </div>

      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 100 }}>
        <LanguageSwitcher />
      </div>

      <section className={styles.hero}>
        {/* Pi Browser warning banner – only shown when SDK is confirmed unavailable and not dismissed */}
        {sdkReady === false && !warningDismissed && (
          <div className={styles.warningBanner}>
            <span className={styles.warningBannerIcon}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div className={styles.warningBannerTitle}>أنت لست داخل متصفح Pi Network / You are not in Pi Browser</div>
              <div className={styles.warningBannerText}>
                لن تعمل المصادقة والمدفوعات خارج Pi Browser. افتح تطبيق Pi Network → التطبيقات → TEC App
                <br />
                Authentication and payments only work inside Pi Browser. Open Pi Network app → Apps → TEC App
              </div>
            </div>
            <button
              type="button"
              className={styles.warningBannerClose}
              onClick={() => setWarningDismissed(true)}
              aria-label="Dismiss warning"
            >
              ✕
            </button>
          </div>
        )}

        <div className={`${styles.badge} fade-up`}>
          <span className={styles.badgeDot} />
          {t.common.piEcosystem}
        </div>

        <h1 className={`${styles.title} fade-up-1`}>
          <span className="gold-text">{t.common.appName}</span>
          <br />
          <span className={styles.titleSub}>{t.common.tagline}</span>
        </h1>

        <p className={`${styles.desc} fade-up-2`}>
          {t.home.description}
          <br />
          {t.home.subDescription}
        </p>

        <div className={`${styles.ctaWrap} fade-up-3`}>
          {/* Connect with Pi Button */}
          <button
            className={styles.btnConnect}
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <><span className={styles.spinner} />{t.common.loading}</>
            ) : (
              <>🔗 {t.dashboard.piIntegration.connectBtn}</>
            )}
          </button>
          {error && (
            <p className={styles.error}>{error}</p>
          )}

          {/* Mode indicator */}
          <div className={styles.modeIndicator}>
            🌐 Testnet Mode: Demo payments
          </div>

          {/* Test Pi SDK Button */}
          <button
            className={styles.btnTestSdk}
            onClick={handleTestSdk}
          >
            🖊️ Test Pi SDK (Check Console)
          </button>
          {sdkTestResult && (
            <div className={styles.sdkStatus} data-status={sdkReady ? 'ready' : 'unavailable'}>
              {sdkTestResult}
            </div>
          )}

          {/* Pay 1 Pi Demo Button — always visible */}
          <button
            className={styles.btnPayDemo}
            onClick={() => {
              if (!isAuthenticated) {
                window.alert('Please connect with Pi first / سجّل الدخول أولاً');
                return;
              }
              handlePayDemo();
            }}
            disabled={isProcessing || paymentState === 'processing'}
          >
            {isProcessing || paymentState === 'processing' ? (
              <><span className={styles.spinner} /> Processing...</>
            ) : (
              <>💎 Pay 1 Pi - Demo Payment</>
            )}
          </button>

          {/* Payment Status Messages */}
          {paymentState === 'success' && lastPayment && (
            <div className={styles.paymentSuccess}>
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
            <div className={styles.paymentWarning}>
              ⚠️ {getPaymentStatusMessage()}
            </div>
          )}

          {paymentState === 'error' && (
            <div className={styles.paymentError}>
              <div className={styles.errorMessage}>
                {getErrorMessageWithInstructions()}
              </div>
              <button
                className={styles.btnRetry}
                onClick={handleRetry}
              >
                🔄 Retry
              </button>
            </div>
          )}

          {paymentState === 'processing' && (
            <div className={styles.paymentProcessing}>
              <div className={styles.spinner}></div>
              <div>{getPaymentStatusMessage()}</div>
            </div>
          )}

        </div>

        <div className={`${styles.stats} fade-up-4`}>
          {[
            { num: '24',   label: t.home.stats.apps },
            { num: '47M+', label: t.home.stats.piUsers },
            { num: '1',    label: t.home.stats.identity },
          ].map(s => (
            <div key={s.label} className={styles.stat}>
              <span className={`${styles.statNum} gold-text`}>{s.num}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.appsSection}>
        <p className={styles.sectionLabel}>{t.home.ecosystem}</p>
        <h2 className={styles.sectionTitle}>{t.home.ecosystemTitle.split('—')[0]}— <span className="gold-text">{t.home.ecosystemTitle.split('—')[1]}</span></h2>
        <div className={styles.appsGrid}>
          {apps.map((app, i) => (
            <div key={app.name} className={styles.appCard} style={{ animationDelay: `${i * 0.07}s` }}>
              <span className={styles.appName}>{app.name}</span>
              <span className={styles.appDesc}>{t.apps[app.name as keyof typeof t.apps]}</span>
              <span className={styles.appDomain}>{app.name.toLowerCase()}.pi</span>
            </div>
          ))}
          <div className={`${styles.appCard} ${styles.appCardMore}`}>
            <span className={styles.moreNum}>+18</span>
            <span className={styles.appDesc}>{t.home.moreApps}</span>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <span className="gold-text" style={{ fontFamily: 'Cormorant Garamond', fontSize: '18px' }}>{t.common.appName}</span>
        <span className={styles.footerText}>© 2025 {t.common.tagline}</span>
      </footer>
    </main>
  );
}
