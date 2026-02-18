'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePiAuth } from '@/hooks/usePiAuth';
import { useTranslation } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import styles from './page.module.css';

export default function HomePage() {
  const { isAuthenticated, isLoading, error, login, isPiBrowserEnv } = usePiAuth();
  const { t } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.push('/dashboard');
  }, [isAuthenticated, router]);

  const handleLogin = async () => {
    try {
      await login();
      router.push('/dashboard');
    } catch (err: unknown) {
      // Error is already handled in usePiAuth hook
      console.error('Login failed:', err);
    }
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
          {isLoading ? (
            <button className={`btn-gold ${styles.loginBtn}`} disabled>
              <span className={styles.spinner} />{t.common.loading}
            </button>
          ) : (
            <>
              <button 
                className={`btn-gold ${styles.loginBtn}`} 
                onClick={handleLogin}
              >
                π {t.common.login}
              </button>
              {error && (
                <p className={styles.error}>{error}</p>
              )}
            </>
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
