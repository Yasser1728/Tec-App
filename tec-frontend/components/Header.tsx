'use client';

import { usePiAuth } from '@/hooks/usePiAuth';
import { useTranslation } from '@/lib/i18n';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  const { user, isAuthenticated, logout } = usePiAuth();
  const { t } = useTranslation();

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 24px',
      background: 'var(--dark)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '24px' }}>🔷</span>
        <span style={{
          fontSize: '20px',
          fontWeight: 600,
          background: 'linear-gradient(135deg, #c9a84c, #e8d5a3)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          {t.common.appName}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <LanguageSwitcher />
        {isAuthenticated && (
          <>
            <span style={{ fontSize: '14px', color: 'var(--muted)' }}>
              @{user?.piUsername}
            </span>
            <button
              onClick={logout}
              style={{
                padding: '8px 16px',
                background: 'rgba(231, 76, 60, 0.1)',
                border: '1px solid rgba(231, 76, 60, 0.3)',
                borderRadius: '8px',
                color: 'var(--error)',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
            >
              {t.common.logout}
            </button>
          </>
        )}
      </div>
    </header>
  );
}
