'use client';

import { useState } from 'react';
import styles from './security.module.css';

export default function SecurityPage() {
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [backupCodes] = useState(['ABC123', 'DEF456', 'GHI789', 'JKL012', 'MNO345', 'PQR678', 'STU901', 'VWX234']);

  const sessions = [
    { id: '1', device: 'Chrome on Windows', location: 'San Francisco, US', lastActive: '2 minutes ago', current: true },
    { id: '2', device: 'Safari on iPhone', location: 'San Francisco, US', lastActive: '1 hour ago', current: false },
  ];

  const devices = [
    { id: '1', name: 'MacBook Pro', type: 'desktop', trusted: true, lastLogin: '2024-02-15' },
    { id: '2', name: 'iPhone 15', type: 'mobile', trusted: true, lastLogin: '2024-02-16' },
  ];

  const handleEnable2FA = () => {
    setShowQrCode(true);
  };

  const handleDisable2FA = () => {
    if (confirm('Are you sure you want to disable 2FA?')) {
      setTwoFaEnabled(false);
      setShowQrCode(false);
    }
  };

  const handleVerify2FA = () => {
    setTwoFaEnabled(true);
    setShowQrCode(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Security Center</h1>
        <p className={styles.subtitle}>Manage your account security settings</p>
      </header>

      <section className={`${styles.section} fade-up`}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Two-Factor Authentication</h2>
            <p className={styles.sectionDescription}>
              Add an extra layer of security to your account
            </p>
          </div>
          <div className={styles.toggle}>
            <input
              type="checkbox"
              id="2fa-toggle"
              checked={twoFaEnabled}
              onChange={() => twoFaEnabled ? handleDisable2FA() : handleEnable2FA()}
              className={styles.toggleInput}
            />
            <label htmlFor="2fa-toggle" className={styles.toggleLabel}>
              <span className={styles.toggleSlider}></span>
            </label>
          </div>
        </div>

        {showQrCode && !twoFaEnabled && (
          <div className={styles.qrSection}>
            <div className={styles.qrBox}>
              <div className={styles.qrPlaceholder}>
                <p className={styles.qrText}>QR Code Placeholder</p>
                <p className={styles.qrHint}>Scan with Google Authenticator or Authy</p>
              </div>
            </div>
            <div className={styles.verifyBox}>
              <label className={styles.label}>Enter 6-digit code</label>
              <input
                type="text"
                className={styles.input}
                placeholder="000000"
                maxLength={6}
              />
              <button className={styles.verifyBtn} onClick={handleVerify2FA}>
                Verify & Enable
              </button>
            </div>
          </div>
        )}

        {twoFaEnabled && (
          <div className={styles.backupCodes}>
            <h3 className={styles.codesTitle}>Backup Codes</h3>
            <p className={styles.codesDescription}>
              Save these codes in a safe place. Each can be used once if you lose access to your authenticator.
            </p>
            <div className={styles.codesGrid}>
              {backupCodes.map((code, idx) => (
                <div key={idx} className={styles.code}>{code}</div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className={`${styles.section} fade-up-1`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Active Sessions</h2>
          <p className={styles.sectionDescription}>
            Manage devices where you&apos;re currently logged in
          </p>
        </div>
        <div className={styles.list}>
          {sessions.map((session) => (
            <div key={session.id} className={styles.listItem}>
              <div className={styles.itemIcon}>🖥️</div>
              <div className={styles.itemContent}>
                <div className={styles.itemTitle}>
                  {session.device}
                  {session.current && <span className={styles.currentBadge}>Current</span>}
                </div>
                <div className={styles.itemMeta}>
                  {session.location} • {session.lastActive}
                </div>
              </div>
              {!session.current && (
                <button className={styles.revokeBtn}>Revoke</button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className={`${styles.section} fade-up-2`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Trusted Devices</h2>
          <p className={styles.sectionDescription}>
            Devices that you&apos;ve marked as trusted
          </p>
        </div>
        <div className={styles.list}>
          {devices.map((device) => (
            <div key={device.id} className={styles.listItem}>
              <div className={styles.itemIcon}>
                {device.type === 'desktop' ? '💻' : '📱'}
              </div>
              <div className={styles.itemContent}>
                <div className={styles.itemTitle}>{device.name}</div>
                <div className={styles.itemMeta}>
                  Last login: {device.lastLogin}
                </div>
              </div>
              <button className={styles.removeBtn}>Remove</button>
            </div>
          ))}
        </div>
      </section>

      <section className={`${styles.section} fade-up-3`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Password</h2>
          <p className={styles.sectionDescription}>
            Change your password regularly to keep your account secure
          </p>
        </div>
        <button className={styles.changePasswordBtn}>Change Password</button>
      </section>
    </div>
  );
}
