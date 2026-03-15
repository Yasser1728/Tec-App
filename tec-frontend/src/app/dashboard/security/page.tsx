'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import styles from './security.module.css';

const BACKUP_CODES = ['ABC123', 'DEF456', 'GHI789', 'JKL012', 'MNO345', 'PQR678', 'STU901', 'VWX234'];

const SESSIONS = [
  { id: '1', device: 'Chrome on Android', location: 'Cairo, EG', lastActive: '2 minutes ago', current: true },
  { id: '2', device: 'Safari on iPhone',  location: 'Cairo, EG', lastActive: '1 hour ago',    current: false },
];

const DEVICES = [
  { id: '1', name: 'Android Phone', type: 'mobile',  trusted: true, lastLogin: '2026-03-15' },
  { id: '2', name: 'iPhone',        type: 'mobile',  trusted: true, lastLogin: '2026-03-14' },
];

type Step = 'idle' | 'qr' | 'pin' | 'done';

export default function SecurityPage() {
  const { locale, dir } = useTranslation();
  const ar = locale === 'ar';

  // 2FA
  const [twoFaEnabled, setTwoFaEnabled]   = useState(false);
  const [step, setStep]                   = useState<Step>('idle');
  const [otpCode, setOtpCode]             = useState('');
  const [otpError, setOtpError]           = useState('');

  // PIN
  const [pinEnabled, setPinEnabled]       = useState(false);
  const [pin, setPin]                     = useState('');
  const [confirmPin, setConfirmPin]       = useState('');
  const [pinError, setPinError]           = useState('');
  const [pinDone, setPinDone]             = useState(false);

  // ── 2FA Handlers ──
  const handleToggle2FA = () => {
    if (twoFaEnabled) {
      if (confirm(ar ? 'هل تريد تعطيل المصادقة الثنائية؟' : 'Disable 2FA?')) {
        setTwoFaEnabled(false);
        setStep('idle');
      }
    } else {
      setStep('qr');
    }
  };

  const handleVerifyOTP = () => {
    if (otpCode.length !== 6) {
      setOtpError(ar ? 'أدخل 6 أرقام' : 'Enter 6 digits');
      return;
    }
    setOtpError('');
    setStep('pin');
  };

  const handleSetPin = () => {
    if (pin.length < 4) {
      setPinError(ar ? 'الـ PIN لازم 4 أرقام على الأقل' : 'PIN must be at least 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      setPinError(ar ? 'الـ PIN مش متطابق' : 'PINs do not match');
      return;
    }
    setPinError('');
    setPinDone(true);
    setPinEnabled(true);
    setTwoFaEnabled(true);
    setStep('done');
  };

  return (
    <div className={styles.container} dir={dir}>

      <header className={styles.header}>
        <h1 className={styles.title}>
          {ar ? 'مركز الأمان' : 'Security Center'}
        </h1>
        <p className={styles.subtitle}>
          {ar ? 'إدارة إعدادات أمان حسابك' : 'Manage your account security settings'}
        </p>
      </header>

      {/* ── 2FA Banner (if not enabled) ── */}
      {!twoFaEnabled && (
        <div className={styles.securityBanner}>
          <span className={styles.bannerIcon}>🔐</span>
          <div className={styles.bannerText}>
            <p className={styles.bannerTitle}>
              {ar ? 'فعّل المصادقة الثنائية لحماية حسابك' : 'Enable 2FA to protect your account'}
            </p>
            <p className={styles.bannerSub}>
              {ar ? 'Google Authenticator + PIN يحميان حسابك من الاختراق' : 'Google Authenticator + PIN keeps your account safe'}
            </p>
          </div>
          <button className={styles.bannerBtn} onClick={() => setStep('qr')}>
            {ar ? 'فعّل الآن' : 'Enable Now'}
          </button>
        </div>
      )}

      {/* ── 2FA Section ── */}
      <section className={`${styles.section} fade-up`}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>
              {ar ? 'المصادقة الثنائية (2FA)' : 'Two-Factor Authentication'}
            </h2>
            <p className={styles.sectionDescription}>
              {ar ? 'Google Authenticator + PIN Code' : 'Google Authenticator + PIN Code'}
            </p>
          </div>
          <div className={styles.toggle}>
            <input
              type="checkbox"
              id="2fa-toggle"
              checked={twoFaEnabled}
              onChange={handleToggle2FA}
              className={styles.toggleInput}
            />
            <label htmlFor="2fa-toggle" className={styles.toggleLabel}>
              <span className={styles.toggleSlider} />
            </label>
          </div>
        </div>

        {/* Step 1: QR Code */}
        {step === 'qr' && (
          <div className={styles.qrSection}>
            <div className={styles.qrBox}>
              <div className={styles.qrPlaceholder}>
                <p className={styles.qrText}>📱</p>
                <p className={styles.qrText}>
                  {ar ? 'امسح بـ Google Authenticator' : 'Scan with Google Authenticator'}
                </p>
                <p className={styles.qrHint}>
                  {ar ? 'أو أضف: TECAPP2FA2026' : 'Or enter: TECAPP2FA2026'}
                </p>
              </div>
            </div>
            <div className={styles.verifyBox}>
              <div className={styles.steps}>
                <p className={styles.stepItem}>1. {ar ? 'حمّل Google Authenticator' : 'Download Google Authenticator'}</p>
                <p className={styles.stepItem}>2. {ar ? 'امسح الـ QR Code' : 'Scan the QR Code'}</p>
                <p className={styles.stepItem}>3. {ar ? 'أدخل الكود المكوّن من 6 أرقام' : 'Enter the 6-digit code'}</p>
              </div>
              <label className={styles.label}>
                {ar ? 'أدخل الكود' : 'Enter 6-digit code'}
              </label>
              <input
                type="text"
                inputMode="numeric"
                className={styles.input}
                placeholder="000000"
                maxLength={6}
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
              />
              {otpError && <p className={styles.error}>{otpError}</p>}
              <button className={styles.verifyBtn} onClick={handleVerifyOTP}>
                {ar ? 'تحقق وتابع' : 'Verify & Continue'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: PIN Setup */}
        {step === 'pin' && (
          <div className={styles.pinSection}>
            <h3 className={styles.pinTitle}>
              🔑 {ar ? 'إعداد PIN Code' : 'Set PIN Code'}
            </h3>
            <p className={styles.pinDesc}>
              {ar ? 'سيُطلب منك هذا الـ PIN عند كل تسجيل دخول' : 'You\'ll need this PIN every time you log in'}
            </p>
            <div className={styles.pinFields}>
              <div>
                <label className={styles.label}>
                  {ar ? 'أدخل PIN (4-6 أرقام)' : 'Enter PIN (4-6 digits)'}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  className={styles.input}
                  placeholder="••••"
                  maxLength={6}
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <div>
                <label className={styles.label}>
                  {ar ? 'تأكيد PIN' : 'Confirm PIN'}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  className={styles.input}
                  placeholder="••••"
                  maxLength={6}
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>
            {pinError && <p className={styles.error}>{pinError}</p>}
            <button className={styles.verifyBtn} onClick={handleSetPin}>
              {ar ? 'حفظ وتفعيل 2FA' : 'Save & Enable 2FA'}
            </button>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 'done' && (
          <div className={styles.doneSection}>
            <p className={styles.doneIcon}>✅</p>
            <p className={styles.doneTitle}>
              {ar ? 'تم تفعيل المصادقة الثنائية بنجاح!' : '2FA Enabled Successfully!'}
            </p>
            <p className={styles.doneSub}>
              {ar ? 'حسابك محمي بـ Google Authenticator + PIN' : 'Your account is protected by Google Authenticator + PIN'}
            </p>
            <div className={styles.backupCodes}>
              <h3 className={styles.codesTitle}>
                {ar ? 'أكواد الاسترداد' : 'Backup Codes'}
              </h3>
              <p className={styles.codesDescription}>
                {ar ? 'احفظ هذه الأكواد في مكان آمن - كل كود يُستخدم مرة واحدة' : 'Save these codes safely - each can be used once'}
              </p>
              <div className={styles.codesGrid}>
                {BACKUP_CODES.map((code, idx) => (
                  <div key={idx} className={styles.code}>{code}</div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Active Sessions ── */}
      <section className={`${styles.section} fade-up-1`}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>
              {ar ? 'الجلسات النشطة' : 'Active Sessions'}
            </h2>
            <p className={styles.sectionDescription}>
              {ar ? 'إدارة الأجهزة المتصلة حالياً' : 'Manage devices currently logged in'}
            </p>
          </div>
        </div>
        <div className={styles.list}>
          {SESSIONS.map(session => (
            <div key={session.id} className={styles.listItem}>
              <div className={styles.itemIcon}>🖥️</div>
              <div className={styles.itemContent}>
                <div className={styles.itemTitle}>
                  {session.device}
                  {session.current && (
                    <span className={styles.currentBadge}>
                      {ar ? 'الجهاز الحالي' : 'Current'}
                    </span>
                  )}
                </div>
                <div className={styles.itemMeta}>
                  {session.location} · {session.lastActive}
                </div>
              </div>
              {!session.current && (
                <button className={styles.revokeBtn}>
                  {ar ? 'إلغاء' : 'Revoke'}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Trusted Devices ── */}
      <section className={`${styles.section} fade-up-2`}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>
              {ar ? 'الأجهزة الموثوقة' : 'Trusted Devices'}
            </h2>
            <p className={styles.sectionDescription}>
              {ar ? 'الأجهزة التي وثّقتها مسبقاً' : 'Devices you\'ve marked as trusted'}
            </p>
          </div>
        </div>
        <div className={styles.list}>
          {DEVICES.map(device => (
            <div key={device.id} className={styles.listItem}>
              <div className={styles.itemIcon}>
                {device.type === 'desktop' ? '💻' : '📱'}
              </div>
              <div className={styles.itemContent}>
                <div className={styles.itemTitle}>{device.name}</div>
                <div className={styles.itemMeta}>
                  {ar ? 'آخر دخول:' : 'Last login:'} {device.lastLogin}
                </div>
              </div>
              <button className={styles.removeBtn}>
                {ar ? 'إزالة' : 'Remove'}
              </button>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
