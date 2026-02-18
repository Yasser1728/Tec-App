'use client';

import { useEffect, useState } from 'react';
import styles from './DiagnosticsPanel.module.css';

interface DiagnosticsData {
  sdkInitialized: boolean;
  userAuthenticated: boolean;
  approvalCallbackFired: boolean;
  completionCallbackFired: boolean;
  lastApprovalPaymentId: string | null;
  lastCompletionPaymentId: string | null;
  lastCompletionTxid: string | null;
  errors: string[];
  isSandbox: boolean;
}

export default function DiagnosticsPanel() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsData>({
    sdkInitialized: false,
    userAuthenticated: false,
    approvalCallbackFired: false,
    completionCallbackFired: false,
    lastApprovalPaymentId: null,
    lastCompletionPaymentId: null,
    lastCompletionTxid: null,
    errors: [],
    isSandbox: process.env.NEXT_PUBLIC_PI_SANDBOX === 'true',
  });

  useEffect(() => {
    // Check if SDK is initialized
    const checkSdkStatus = () => {
      const sdkInitialized = typeof window !== 'undefined' && 
                            typeof window.Pi !== 'undefined' && 
                            window.__TEC_PI_READY === true;
      setDiagnostics(prev => ({ ...prev, sdkInitialized }));
    };

    // Check authentication status
    const checkAuthStatus = () => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('tec_pi_user');
        const userAuthenticated = !!stored;
        setDiagnostics(prev => ({ ...prev, userAuthenticated }));
      }
    };

    // Listen for SDK ready event
    const handleSdkReady = () => {
      console.log('[Diagnostics] SDK ready event received');
      setDiagnostics(prev => ({ ...prev, sdkInitialized: true }));
    };

    // Listen for SDK error event
    const handleSdkError = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      console.error('[Diagnostics] SDK error event received:', detail);
      setDiagnostics(prev => ({ 
        ...prev, 
        errors: [...prev.errors, `SDK Error: ${detail?.message || 'Unknown error'}`] 
      }));
    };

    // Listen for custom payment events (we'll dispatch these from pi-payment.ts)
    const handleApprovalCallback = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      console.log('[Diagnostics] Approval callback fired:', detail);
      setDiagnostics(prev => ({
        ...prev,
        approvalCallbackFired: true,
        lastApprovalPaymentId: detail?.paymentId || null,
      }));
    };

    const handleCompletionCallback = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      console.log('[Diagnostics] Completion callback fired:', detail);
      setDiagnostics(prev => ({
        ...prev,
        completionCallbackFired: true,
        lastCompletionPaymentId: detail?.paymentId || null,
        lastCompletionTxid: detail?.txid || null,
      }));
    };

    const handlePaymentError = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      console.error('[Diagnostics] Payment error:', detail);
      setDiagnostics(prev => ({ 
        ...prev, 
        errors: [...prev.errors, `Payment Error: ${detail?.message || 'Unknown error'}`] 
      }));
    };

    // Initial checks
    checkSdkStatus();
    checkAuthStatus();

    // Add event listeners
    window.addEventListener('tec-pi-ready', handleSdkReady);
    window.addEventListener('tec-pi-error', handleSdkError);
    window.addEventListener('tec-payment-approval', handleApprovalCallback);
    window.addEventListener('tec-payment-completion', handleCompletionCallback);
    window.addEventListener('tec-payment-error', handlePaymentError);

    // Periodic status check (for auth changes)
    const interval = setInterval(() => {
      checkSdkStatus();
      checkAuthStatus();
    }, 2000);

    return () => {
      window.removeEventListener('tec-pi-ready', handleSdkReady);
      window.removeEventListener('tec-pi-error', handleSdkError);
      window.removeEventListener('tec-payment-approval', handleApprovalCallback);
      window.removeEventListener('tec-payment-completion', handleCompletionCallback);
      window.removeEventListener('tec-payment-error', handlePaymentError);
      clearInterval(interval);
    };
  }, []);

  // Only show diagnostics in sandbox mode
  if (!diagnostics.isSandbox) {
    return null;
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>🔍 Payment Diagnostics (Testnet)</span>
      </div>
      
      <div className={styles.content}>
        <div className={styles.section}>
          <div className={styles.statusRow}>
            <span className={styles.label}>Pi SDK Initialized:</span>
            <span className={diagnostics.sdkInitialized ? styles.statusOk : styles.statusError}>
              {diagnostics.sdkInitialized ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          
          <div className={styles.statusRow}>
            <span className={styles.label}>User Authenticated:</span>
            <span className={diagnostics.userAuthenticated ? styles.statusOk : styles.statusError}>
              {diagnostics.userAuthenticated ? '✅ Yes' : '❌ No'}
            </span>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Payment Callbacks</div>
          
          <div className={styles.statusRow}>
            <span className={styles.label}>onReadyForServerApproval:</span>
            <span className={diagnostics.approvalCallbackFired ? styles.statusOk : styles.statusPending}>
              {diagnostics.approvalCallbackFired ? '✅ Fired' : '⏳ Not fired'}
            </span>
          </div>
          
          {diagnostics.lastApprovalPaymentId && (
            <div className={styles.detail}>
              PaymentId: <code>{diagnostics.lastApprovalPaymentId}</code>
            </div>
          )}

          <div className={styles.statusRow}>
            <span className={styles.label}>onReadyForServerCompletion:</span>
            <span className={diagnostics.completionCallbackFired ? styles.statusOk : styles.statusPending}>
              {diagnostics.completionCallbackFired ? '✅ Fired' : '⏳ Not fired'}
            </span>
          </div>
          
          {diagnostics.lastCompletionPaymentId && (
            <div className={styles.detail}>
              PaymentId: <code>{diagnostics.lastCompletionPaymentId}</code>
            </div>
          )}
          
          {diagnostics.lastCompletionTxid && (
            <div className={styles.detail}>
              Txid: <code>{diagnostics.lastCompletionTxid.substring(0, 16)}...</code>
            </div>
          )}
        </div>

        {diagnostics.errors.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Errors</div>
            {diagnostics.errors.slice(-3).map((error, i) => (
              <div key={i} className={styles.error}>
                ⚠️ {error}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
