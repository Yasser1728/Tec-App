'use client';

import { useEffect, useState } from 'react';
import styles from './PaymentDiagnostics.module.css';

export interface DiagnosticEvent {
  timestamp: string;
  type: 'sdk_init' | 'auth' | 'approval' | 'completion' | 'error' | 'cancel';
  message: string;
  data?: unknown;
}

interface PaymentDiagnosticsProps {
  isAuthenticated: boolean;
  username?: string;
  events: DiagnosticEvent[];
}

export default function PaymentDiagnostics({ 
  isAuthenticated, 
  username,
  events 
}: PaymentDiagnosticsProps) {
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkInitTime, setSdkInitTime] = useState<string | null>(null);
  const [isTestnet, setIsTestnet] = useState(false);

  useEffect(() => {
    // Check if we're in testnet mode
    const testnetMode = process.env.NEXT_PUBLIC_PI_SANDBOX === 'true';
    setIsTestnet(testnetMode);

    // Check SDK readiness
    const checkSDK = () => {
      if (typeof window !== 'undefined') {
        const ready = !!(window as any).__TEC_PI_READY;
        setSdkReady(ready);
        if (ready && !sdkInitTime) {
          setSdkInitTime(new Date().toISOString());
        }
      }
    };

    checkSDK();

    // Listen for SDK ready event
    const handlePiReady = () => {
      setSdkReady(true);
      setSdkInitTime(new Date().toISOString());
    };

    window.addEventListener('tec-pi-ready', handlePiReady);
    
    // Poll for SDK ready state
    const interval = setInterval(checkSDK, 1000);

    return () => {
      window.removeEventListener('tec-pi-ready', handlePiReady);
      clearInterval(interval);
    };
  }, [sdkInitTime]);

  // Only show diagnostics in testnet mode
  if (!isTestnet) {
    return null;
  }

  const getEventIcon = (type: DiagnosticEvent['type']) => {
    switch (type) {
      case 'sdk_init': return '🔧';
      case 'auth': return '🔑';
      case 'approval': return '✅';
      case 'completion': return '✨';
      case 'error': return '❌';
      case 'cancel': return '⚠️';
      default: return '📋';
    }
  };

  return (
    <div className={styles.diagnostics}>
      <div className={styles.header}>
        <h3 className={styles.title}>🔍 Payment Diagnostics (Testnet Only)</h3>
      </div>
      
      <div className={styles.statusGrid}>
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>Pi SDK:</span>
          <span className={`${styles.statusValue} ${sdkReady ? styles.success : styles.pending}`}>
            {sdkReady ? '✅ Initialized' : '⏳ Loading...'}
          </span>
          {sdkInitTime && (
            <span className={styles.statusTime}>
              {new Date(sdkInitTime).toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>Auth Status:</span>
          <span className={`${styles.statusValue} ${isAuthenticated ? styles.success : styles.pending}`}>
            {isAuthenticated ? `✅ ${username || 'Logged In'}` : '❌ Not Authenticated'}
          </span>
        </div>

        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>Environment:</span>
          <span className={`${styles.statusValue} ${styles.info}`}>
            🧪 Testnet Mode
          </span>
        </div>
      </div>

      {events.length > 0 && (
        <div className={styles.eventsSection}>
          <h4 className={styles.eventsTitle}>Payment Flow Events:</h4>
          <div className={styles.eventsList}>
            {events.slice().reverse().map((event, index) => (
              <div key={index} className={styles.event}>
                <span className={styles.eventIcon}>{getEventIcon(event.type)}</span>
                <div className={styles.eventContent}>
                  <div className={styles.eventMessage}>{event.message}</div>
                  <div className={styles.eventTime}>
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </div>
                  {event.data && (
                    <pre className={styles.eventData}>
                      {JSON.stringify(event.data, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
