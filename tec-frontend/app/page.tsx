'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePiAuth } from '@/hooks/usePiAuth';
import styles from './page.module.css';

export default function HomePage() {
  const { isAuthenticated, isLoading, error, login, isPiBrowserEnv } = usePiAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.push('/dashboard');
  }, [isAuthenticated, router]);

  const handleLogin = async () => {
    try {
      await login();
      router.push('/dashboard');
    } catch {}
  };

  const apps = [
    { name: 'Nexus',    desc: 'بوابة الـ 24 App' },
    { name: 'Commerce', desc: 'التجارة الرقمية' },
    { name: 'Assets',   desc: 'الأصول الرقمية' },
    { name: 'Fundx',    desc: 'التمويل والاستثمار' },
    { name: 'Estate',   desc: 'العقارات الرقمية' },
    { name: 'Analytics',desc: 'تحليل البيانات' },
  ];

  return (
    <main className={styles.main}>
      <div className={styles.bg}>
        <div className={styles.bgOrb1} />
        <div className={styles.bgOrb2} />
        <div className={styles.bgGrid} />
      </div>

      <section className={styles.hero}>
        <div className={`${styles.badge} fade-up`}>
          <span className={styles.badgeDot} />
          Pi Network Ecosystem
        </div>

        <h1 className={`${styles.title} fade-up-1`}>
          <span className="gold-text">TEC</span>
          <br />
          <span className={styles.titleSub}>The Elite Consortium</span>
        </h1>

        <p className={`${styles.desc} fade-up-2`}>
          منظومة متكاملة من 24 تطبيق مبنية على Pi Network
          <br />
          هوية واحدة — محفظة واحدة — عالم كامل
        </p>

        <div className={`${styles.ctaWrap} fade-up-3`}>
          {!isPiBrowserEnv ? (
            <div className={styles.warningBox}>
              <span>⚠️</span>
              <div>
                <p className={styles.warningTitle}>يجب فتح التطبيق داخل Pi Browser</p>
                <p className={styles.warningText}>افتح tec.pi من داخل تطبيق Pi Network</p>
              </div>
            </div>
          ) : (
            <button className={`btn-gold ${styles.loginBtn}`} onClick={handleLogin} disabled={isLoading}>
              {isLoading ? (
                <><span className={styles.spinner} />جاري التحقق...</>
              ) : (
                <>π تسجيل الدخول بـ Pi</>
              )}
            </button>
          )}
          {error && <p className={styles.error}>{error}</p>}
        </div>

        <div className={`${styles.stats} fade-up-4`}>
          {[
            { num: '24',   label: 'تطبيق' },
            { num: '47M+', label: 'مستخدم Pi' },
            { num: '1',    label: 'هوية موحدة' },
          ].map(s => (
            <div key={s.label} className={styles.stat}>
              <span className={`${styles.statNum} gold-text`}>{s.num}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.appsSection}>
        <p className={styles.sectionLabel}>المنظومة</p>
        <h2 className={styles.sectionTitle}>24 تطبيق — <span className="gold-text">عالم واحد</span></h2>
        <div className={styles.appsGrid}>
          {apps.map((app, i) => (
            <div key={app.name} className={styles.appCard} style={{ animationDelay: `${i * 0.07}s` }}>
              <span className={styles.appName}>{app.name}</span>
              <span className={styles.appDesc}>{app.desc}</span>
              <span className={styles.appDomain}>{app.name.toLowerCase()}.pi</span>
            </div>
          ))}
          <div className={`${styles.appCard} ${styles.appCardMore}`}>
            <span className={styles.moreNum}>+18</span>
            <span className={styles.appDesc}>تطبيق آخر</span>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <span className="gold-text" style={{ fontFamily: 'Cormorant Garamond', fontSize: '18px' }}>TEC</span>
        <span className={styles.footerText}>© 2025 The Elite Consortium</span>
      </footer>
    </main>
  );
}
