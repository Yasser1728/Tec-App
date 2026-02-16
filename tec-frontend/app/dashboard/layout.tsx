'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { usePiAuth } from '@/hooks/usePiAuth';
import { useTranslation } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import styles from './dashboard.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading, logout } = usePiAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/');
  }, [isAuthenticated, isLoading, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (isLoading || !user) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner} />
      </div>
    );
  }

  const navItems = [
    { icon: '⊞', label: t.dashboard.nav.dashboard, href: '/dashboard' },
    { icon: '◎', label: t.dashboard.nav.wallet, href: '/dashboard/wallet' },
    { icon: '◈', label: t.dashboard.nav.subscription, href: '/dashboard/subscription' },
    { icon: '◇', label: t.dashboard.nav.security, href: '/dashboard/security' },
    { icon: '◉', label: 'Profile', href: '/dashboard/profile' },
    { icon: '◐', label: 'KYC', href: '/dashboard/kyc' },
  ];

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <span className={`gold-text ${styles.logoText}`}>{t.common.appName}</span>
        </div>
        <nav className={styles.nav}>
          {navItems.map(item => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: '0 16px', marginTop: 'auto', marginBottom: '16px' }}>
          <LanguageSwitcher />
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          ⟵ {t.common.logout}
        </button>
      </aside>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
