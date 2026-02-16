'use client';

import { usePiAuth } from '@/hooks/usePiAuth';
import { useTranslation } from '@/lib/i18n';
import PiIntegration from '@/components/PiIntegration';
import styles from './dashboard.module.css';

const TEC_APPS = [
  { name: 'Nexus',      domain: 'nexus.pi',      emoji: '🌐' },
  { name: 'Commerce',   domain: 'commerce.pi',   emoji: '🛒' },
  { name: 'Assets',     domain: 'assets.pi',     emoji: '💎' },
  { name: 'Fundx',      domain: 'fundx.pi',      emoji: '🏦' },
  { name: 'Estate',     domain: 'estate.pi',     emoji: '🏠' },
  { name: 'Analytics',  domain: 'analytics.pi',  emoji: '📊' },
  { name: 'Connection', domain: 'connection.pi', emoji: '🔗' },
  { name: 'Life',       domain: 'life.pi',       emoji: '❤️' },
  { name: 'Insure',     domain: 'insure.pi',     emoji: '🛡️' },
  { name: 'Vip',        domain: 'vip.pi',        emoji: '👑' },
  { name: 'Zone',       domain: 'zone.pi',       emoji: '🌎' },
  { name: 'Explorer',   domain: 'explorer.pi',   emoji: '🔍' },
  { name: 'Alert',      domain: 'alert.pi',      emoji: '🚨' },
  { name: 'System',     domain: 'system.pi',     emoji: '⚙️' },
  { name: 'Ecommerce',  domain: 'ecommerce.pi',  emoji: '🏬' },
  { name: 'Dx',         domain: 'dx.pi',         emoji: '🧪' },
  { name: 'Nx',         domain: 'nx.pi',         emoji: '🔧' },
  { name: 'Nbf',        domain: 'nbf.pi',        emoji: '💳' },
  { name: 'Epic',       domain: 'epic.pi',       emoji: '🔥' },
  { name: 'Legend',     domain: 'legend.pi',     emoji: '🌟' },
  { name: 'Titan',      domain: 'titan.pi',      emoji: '⚔️' },
  { name: 'Elite',      domain: 'elite.pi',      emoji: '🥇' },
  { name: 'Brookfield', domain: 'brookfield.pi', emoji: '🏢' },
];

export default function DashboardPage() {
  const { user, isNewUser } = usePiAuth();
  const { t } = useTranslation();

  return (
    <>
      <header className={styles.header}>
        {isNewUser && <div className={`${styles.welcomeBanner} fade-up`}>{t.dashboard.welcomeNew}</div>}
        <div className={styles.headerRow}>
          <div>
            <p className={styles.greeting}>{t.dashboard.greeting}</p>
            <h1 className={styles.username}>
              @{user?.piUsername}
              <span className={styles.roleBadge}>{user?.role}</span>
            </h1>
          </div>
          <div className={styles.planBadge}>◈ {user?.subscriptionPlan || 'Free'}</div>
        </div>
      </header>

      <div className={`${styles.statsGrid} fade-up-1`}>
        {[
          { label: t.dashboard.stats.piBalance,            value: '0.00 π',                    sub: t.dashboard.stats.tecWallet },
          { label: t.dashboard.stats.availableApps,  value: '1 / 24',                   sub: t.dashboard.stats.activeApp },
          { label: t.dashboard.stats.subscription,           value: user?.subscriptionPlan || 'Free', sub: t.dashboard.stats.upgradePro },
          { label: t.dashboard.stats.kyc,               value: 'Pending',                   sub: t.dashboard.stats.identityVerification },
        ].map(s => (
          <div key={s.label} className={styles.statCard}>
            <p className={styles.statLabel}>{s.label}</p>
            <p className={`${styles.statValue} gold-text`}>{s.value}</p>
            <p className={styles.statSub}>{s.sub}</p>
          </div>
        ))}
      </div>

      <PiIntegration />

      <section className={`${styles.appsSection} fade-up-2`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t.dashboard.appsTitle}</h2>
          <span className={styles.sectionMeta}>{t.dashboard.appsCount}</span>
        </div>
        <div className={styles.appsGrid}>
          <div className={`${styles.appCard} ${styles.appCardActive}`}>
            <span style={{fontSize:'20px'}}>🔷</span>
            <div className={styles.appInfo}>
              <span className={styles.appName}>{t.common.appName}</span>
              <span className={styles.appDomain}>tec.pi</span>
            </div>
            <span className={styles.appLive}>{t.common.live}</span>
          </div>
          {TEC_APPS.map(app => (
            <div key={app.name} className={styles.appCard}>
              <span style={{fontSize:'20px'}}>{app.emoji}</span>
              <div className={styles.appInfo}>
                <span className={styles.appName}>{app.name}</span>
                <span className={styles.appDomain}>{app.domain}</span>
              </div>
              <span className={styles.appSoon}>{t.common.comingSoon}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
