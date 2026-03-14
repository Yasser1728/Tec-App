'use client';

import { useTranslation } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import PiPaymentButton from '@/components/payment/PiPaymentButton';
import styles from './page.module.css';

const ALL_APPS = [
  { name: 'Life',       emoji: '🌱', desc: 'Lifestyle & Wellness',      domain: 'life.pi' },
  { name: 'Insure',     emoji: '🛡️', desc: 'Insurance & Protection',    domain: 'insure.pi' },
  { name: 'Commerce',   emoji: '🛒', desc: 'Digital Commerce',          domain: 'commerce.pi' },
  { name: 'Ecommerce',  emoji: '📦', desc: 'E-Commerce Platform',       domain: 'ecommerce.pi' },
  { name: 'Assets',     emoji: '💼', desc: 'Portfolio Management',       domain: 'assets.pi' },
  { name: 'Fundx',      emoji: '📊', desc: 'Finance & Investment',       domain: 'fundx.pi' },
  { name: 'Dx',         emoji: '🏥', desc: 'Digital Healthcare',         domain: 'dx.pi' },
  { name: 'Analytics',  emoji: '📈', desc: 'Data Analytics',             domain: 'analytics.pi' },
  { name: 'Nbf',        emoji: '🏦', desc: 'Sovereign Banking',          domain: 'nbf.pi' },
  { name: 'Epic',       emoji: '🎮', desc: 'Gaming & Entertainment',     domain: 'epic.pi' },
  { name: 'Legend',     emoji: '⭐', desc: 'Premium Experiences',        domain: 'legend.pi' },
  { name: 'Connection', emoji: '🔗', desc: 'Social & Networking',        domain: 'connection.pi' },
  { name: 'System',     emoji: '⚙️', desc: 'Infrastructure & Tools',    domain: 'system.pi' },
  { name: 'Alert',      emoji: '🔔', desc: 'Notifications & Security',   domain: 'alert.pi' },
  { name: 'Tec',        emoji: '👑', desc: 'The Elite Consortium Hub',   domain: 'tec.pi' },
  { name: 'Estate',     emoji: '🏠', desc: 'Luxury Real Estate',         domain: 'estate.pi' },
  { name: 'Nx',         emoji: '🚀', desc: 'Next-Gen Technology',        domain: 'nx.pi' },
  { name: 'Explorer',   emoji: '✈️', desc: 'Luxury Travel',              domain: 'explorer.pi' },
  { name: 'Nexus',      emoji: '🌐', desc: 'Gateway to 24 Apps',         domain: 'nexus.pi' },
  { name: 'Brookfield', emoji: '🏙️', desc: 'Urban Development',          domain: 'brookfield.pi' },
  { name: 'Vip',        emoji: '💎', desc: 'Exclusive Access',            domain: 'vip.pi' },
  { name: 'Titan',      emoji: '🦾', desc: 'Enterprise Solutions',       domain: 'titan.pi' },
  { name: 'Zone',       emoji: '🎯', desc: 'Focused Productivity',        domain: 'zone.pi' },
  { name: 'Elite',      emoji: '🏆', desc: 'Premium Consulting',         domain: 'elite.pi' },
];

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <main className={styles.main}>
      <div className={styles.bg}>
        <div className={styles.bgOrb1} />
        <div className={styles.bgOrb2} />
        <div className={styles.bgGrid} />
      </div>

      {/* Navbar */}
      <nav className={styles.navbar}>
        <span
          className="gold-text"
          style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontSize: '22px',
            fontWeight: '600',
          }}
        >
          TEC
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <LanguageSwitcher />
        </div>
      </nav>

      {/* Hero */}
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
          <PiPaymentButton />
        </div>

        <div className={`${styles.stats} fade-up-4`}>
          {[
            { num: '24', label: t.home.stats.apps },
            { num: '47M+', label: t.home.stats.piUsers },
            { num: '1', label: t.home.stats.identity },
          ].map((s) => (
            <div key={s.label} className={styles.stat}>
              <span className={`${styles.statNum} gold-text`}>{s.num}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 24 Apps */}
      <section className={styles.appsSection}>
        <p className={styles.sectionLabel}>{t.home.ecosystem}</p>
        <h2 className={styles.sectionTitle}>
          24 Apps —{' '}
          <span className="gold-text">One World</span>
        </h2>
        <div className={styles.appsGrid}>
          {ALL_APPS.map((app, i) => (
            <div
              key={app.name}
              className={styles.appCard}
              style={{ animationDelay: `${i * 0.05}s`, cursor: 'pointer' }}
              onClick={() => window.open(`https://${app.domain}`, '_blank')}
            >
              <span style={{ fontSize: '28px', marginBottom: '8px' }}>{app.emoji}</span>
              <span className={styles.appName}>{app.name}</span>
              <span className={styles.appDesc}>{app.desc}</span>
              <span className={styles.appDomain}>{app.domain}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <span
          className="gold-text"
          style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontSize: '18px',
          }}
        >
          {t.common.appName}
        </span>
        <span className={styles.footerText}>© 2026 {t.common.tagline}</span>
      </footer>
    </main>
  );
}
