'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePiAuth } from '@/hooks/usePiAuth';
import styles from './dashboard.module.css';

const TEC_APPS = [
  { name: 'Nexus',      domain: 'nexus.pi',      emoji: '🌐', desc: 'بوابة المنظومة' },
  { name: 'Commerce',   domain: 'commerce.pi',   emoji: '🛒', desc: 'التجارة الرقمية' },
  { name: 'Assets',     domain: 'assets.pi',     emoji: '💎', desc: 'الأصول الرقمية' },
  { name: 'Fundx',      domain: 'fundx.pi',      emoji: '🏦', desc: 'التمويل والاستثمار' },
  { name: 'Estate',     domain: 'estate.pi',     emoji: '🏠', desc: 'العقارات الرقمية' },
  { name: 'Analytics',  domain: 'analytics.pi',  emoji: '📊', desc: 'تحليل البيانات' },
  { name: 'Connection', domain: 'connection.pi', emoji: '🔗', desc: 'شبكة التواصل' },
  { name: 'Life',       domain: 'life.pi',       emoji: '❤️', desc: 'خدمات يومية' },
  { name: 'Insure',     domain: 'insure.pi',     emoji: '🛡️', desc: 'التأمين الرقمي' },
  { name: 'Vip',        domain: 'vip.pi',        emoji: '👑', desc: 'عضوية مميزة' },
  { name: 'Zone',       domain: 'zone.pi',       emoji: '🌎', desc: 'مجتمعات رقمية' },
  { name: 'Explorer',   domain: 'explorer.pi',   emoji: '🔍', desc: 'تصفح النشاط' },
  { name: 'Alert',      domain: 'alert.pi',      emoji: '🚨', desc: 'مركز الإشعارات' },
  { name: 'System',     domain: 'system.pi',     emoji: '⚙️', desc: 'إدارة النظام' },
  { name: 'Ecommerce',  domain: 'ecommerce.pi',  emoji: '🏬', desc: 'متاجر إلكترونية' },
  { name: 'Dx',         domain: 'dx.pi',         emoji: '🧪', desc: 'أدوات المطورين' },
  { name: 'Nx',         domain: 'nx.pi',         emoji: '🔧', desc: 'تكامل الخدمات' },
  { name: 'Nbf',        domain: 'nbf.pi',        emoji: '💳', desc: 'خدمات مالية' },
  { name: 'Epic',       domain: 'epic.pi',       emoji: '🔥', desc: 'منتجات إبداعية' },
  { name: 'Legend',     domain: 'legend.pi',     emoji: '🌟', desc: 'Gamification' },
  { name: 'Titan',      domain: 'titan.pi',      emoji: '⚔️', desc: 'خدمات مؤسسية' },
  { name: 'Elite',      domain: 'elite.pi',      emoji: '🥇', desc: 'خدمات احترافية' },
  { name: 'Brookfield', domain: 'brookfield.pi', emoji: '🏢', desc: 'استثمارات مؤسسية' },
];

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, logout, isNewUser } = usePiAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/');
  }, [isAuthenticated, isLoading, router]);

  const handleLogout = () => { logout(); router.push('/'); };

  if (isLoading || !user) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <span className={`gold-text ${styles.logoText}`}>TEC</span>
        </div>
        <nav className={styles.nav}>
          {[
            { icon: '⊞', label: 'Dashboard', active: true },
            { icon: '◎', label: 'المحفظة',   active: false },
            { icon: '◈', label: 'الاشتراك',  active: false },
            { icon: '◇', label: 'الأمان',    active: false },
          ].map(item => (
            <button key={item.label} className={`${styles.navItem} ${item.active ? styles.navItemActive : ''}`}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <button className={styles.logoutBtn} onClick={handleLogout}>⟵ خروج</button>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          {isNewUser && <div className={`${styles.welcomeBanner} fade-up`}>🎉 مرحباً بك في TEC — حسابك جاهز</div>}
          <div className={styles.headerRow}>
            <div>
              <p className={styles.greeting}>مرحباً،</p>
              <h1 className={styles.username}>
                @{user.piUsername}
                <span className={styles.roleBadge}>{user.role}</span>
              </h1>
            </div>
            <div className={styles.planBadge}>◈ {user.subscriptionPlan || 'Free'}</div>
          </div>
        </header>

        <div className={`${styles.statsGrid} fade-up-1`}>
          {[
            { label: 'رصيد Pi',            value: '0.00 π',                    sub: 'محفظة TEC' },
            { label: 'التطبيقات المتاحة',  value: '1 / 24',                   sub: 'TEC App نشط' },
            { label: 'الاشتراك',           value: user.subscriptionPlan || 'Free', sub: 'ترقية للـ Pro' },
            { label: 'KYC',               value: 'Pending',                   sub: 'التحقق من الهوية' },
          ].map(s => (
            <div key={s.label} className={styles.statCard}>
              <p className={styles.statLabel}>{s.label}</p>
              <p className={`${styles.statValue} gold-text`}>{s.value}</p>
              <p className={styles.statSub}>{s.sub}</p>
            </div>
          ))}
        </div>

        <section className={`${styles.appsSection} fade-up-2`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>منظومة TEC</h2>
            <span className={styles.sectionMeta}>24 تطبيق</span>
          </div>
          <div className={styles.appsGrid}>
            <div className={`${styles.appCard} ${styles.appCardActive}`}>
              <span style={{fontSize:'20px'}}>🔷</span>
              <div className={styles.appInfo}>
                <span className={styles.appName}>TEC</span>
                <span className={styles.appDomain}>tec.pi</span>
              </div>
              <span className={styles.appLive}>Live</span>
            </div>
            {TEC_APPS.map(app => (
              <div key={app.name} className={styles.appCard}>
                <span style={{fontSize:'20px'}}>{app.emoji}</span>
                <div className={styles.appInfo}>
                  <span className={styles.appName}>{app.name}</span>
                  <span className={styles.appDomain}>{app.domain}</span>
                </div>
                <span className={styles.appSoon}>قريباً</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
