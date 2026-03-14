'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getStoredUser, getAccessToken, fetchWithAuth, logout } from '@/lib-client/pi/pi-auth';
import styles from './dashboard.module.css';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: 'created' | 'approved' | 'completed' | 'cancelled' | 'failed';
  payment_method: string;
  created_at: string;
  completed_at?: string;
}

interface User {
  id: string;
  piId: string;
  piUsername: string;
  role: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  completed: '#7ee7c0',
  approved:  '#7eb8f7',
  created:   '#f0c040',
  cancelled: '#6b6b7a',
  failed:    '#e74c3c',
};

const STATUS_LABELS: Record<string, string> = {
  completed: 'Completed',
  approved:  'Approved',
  created:   'Pending',
  cancelled: 'Cancelled',
  failed:    'Failed',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const gatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL;

  const fetchDashboard = useCallback(async (u: User) => {
    try {
      // Fetch balance
      const balRes = await fetch(`/api/wallet/balance?userId=${u.id}`);
      if (balRes.ok) {
        const balData = await balRes.json();
        setBalance(balData.balance ?? 0);
      }

      // Fetch payment history
      const histRes = await fetchWithAuth(
        `${gatewayUrl}/api/payments/history?limit=10&sort=desc`
      );
      if (histRes.ok) {
        const histData = await histRes.json();
        setPayments(histData?.data?.payments ?? []);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [gatewayUrl]);

  useEffect(() => {
    const stored = getStoredUser();
    const token = getAccessToken();

    if (!stored || !token) {
      setError('not_authenticated');
      setLoading(false);
      return;
    }

    setUser(stored);
    fetchDashboard(stored);
  }, [fetchDashboard]);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  // ── Not authenticated ──
  if (error === 'not_authenticated') {
    return (
      <main className={styles.main}>
        <div className={styles.bg} aria-hidden>
          <div className={styles.bgOrb} />
          <div className={styles.bgGrid} />
        </div>
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>🔐</span>
          <h2 className={styles.emptyTitle}>Authentication Required</h2>
          <p className={styles.emptyDesc}>Please sign in with Pi Network to access your dashboard.</p>
          <Link href="/" className={styles.emptyBtn}>Sign In with Pi →</Link>
        </div>
      </main>
    );
  }

  // ── Loading ──
  if (loading) {
    return (
      <main className={styles.main}>
        <div className={styles.bg} aria-hidden>
          <div className={styles.bgOrb} />
          <div className={styles.bgGrid} />
        </div>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <p className={styles.loadingText}>Loading dashboard...</p>
        </div>
      </main>
    );
  }

  const completedPayments = payments.filter(p => p.status === 'completed');
  const totalPiSpent = completedPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <main className={styles.main}>
      <div className={styles.bg} aria-hidden>
        <div className={styles.bgOrb} />
        <div className={styles.bgGrid} />
      </div>

      {/* ── Header ── */}
      <header className={styles.header}>
        <Link href="/" className={styles.backLink}>← TEC</Link>
        <div className={styles.headerRight}>
          <span className={styles.headerUser}>@{user?.piUsername}</span>
          <button className={styles.logoutBtn} onClick={handleLogout}>Sign Out</button>
        </div>
      </header>

      <div className={styles.content}>

        {/* ── Welcome ── */}
        <section className={styles.welcome}>
          <div className={styles.welcomeText}>
            <p className={styles.welcomeEyebrow}>Welcome back</p>
            <h1 className={styles.welcomeTitle}>@{user?.piUsername}</h1>
            <p className={styles.welcomeRole}>{user?.role?.toUpperCase()}</p>
          </div>
          <div className={styles.welcomeMeta}>
            <p className={styles.welcomeJoined}>
              Member since {user?.createdAt ? formatDate(user.createdAt) : '—'}
            </p>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className={styles.stats}>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>TEC Balance</p>
            <p className={styles.statValue}>
              {balance !== null ? balance.toFixed(2) : '—'}
              <span className={styles.statUnit}>TEC</span>
            </p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Pi Spent</p>
            <p className={styles.statValue}>
              {totalPiSpent.toFixed(3)}
              <span className={styles.statUnit}>π</span>
            </p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Transactions</p>
            <p className={styles.statValue}>
              {completedPayments.length}
              <span className={styles.statUnit}>total</span>
            </p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Conversion Rate</p>
            <p className={styles.statValue}>
              0.1
              <span className={styles.statUnit}>TEC/π</span>
            </p>
          </div>
        </section>

        {/* ── Payment History ── */}
        <section className={styles.historySection}>
          <div className={styles.historyHeader}>
            <h2 className={styles.historyTitle}>Transaction History</h2>
            <span className={styles.historyCount}>{payments.length} records</span>
          </div>

          {payments.length === 0 ? (
            <div className={styles.emptyHistory}>
              <span className={styles.emptyHistoryIcon}>📭</span>
              <p className={styles.emptyHistoryText}>No transactions yet.</p>
              <Link href="/" className={styles.emptyHistoryLink}>Make your first payment →</Link>
            </div>
          ) : (
            <div className={styles.historyList}>
              {payments.map(p => (
                <div key={p.id} className={styles.historyItem}>
                  <div className={styles.historyItemLeft}>
                    <div
                      className={styles.historyStatus}
                      style={{ backgroundColor: `${STATUS_COLORS[p.status]}20`, color: STATUS_COLORS[p.status] }}
                    >
                      {STATUS_LABELS[p.status]}
                    </div>
                    <div className={styles.historyDetails}>
                      <p className={styles.historyMethod}>{p.payment_method.toUpperCase()} Payment</p>
                      <p className={styles.historyId}>{p.id.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <div className={styles.historyItemRight}>
                    <p className={styles.historyAmount}>
                      {p.status === 'completed' ? '+' : ''}{(p.amount * 0.1).toFixed(2)} TEC
                    </p>
                    <p className={styles.historyAmountPi}>{p.amount} π</p>
                    <p className={styles.historyDate}>
                      {formatDate(p.created_at)}
                      <span className={styles.historyTime}>{formatTime(p.created_at)}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Quick Links ── */}
        <section className={styles.quickLinks}>
          <h2 className={styles.quickTitle}>Quick Access</h2>
          <div className={styles.quickGrid}>
            {[
              { emoji: '🌐', name: 'Nexus', domain: 'nexus.pi', desc: 'Gateway Hub' },
              { emoji: '📊', name: 'Fundx', domain: 'fundx.pi', desc: 'Finance' },
              { emoji: '💎', name: 'Vip', domain: 'vip.pi', desc: 'Exclusive Access' },
              { emoji: '📈', name: 'Analytics', domain: 'analytics.pi', desc: 'Data & Insights' },
            ].map(app => (
              <button
                key={app.name}
                className={styles.quickCard}
                onClick={() => window.open(`https://${app.domain}`, '_blank', 'noopener,noreferrer')}
              >
                <span className={styles.quickEmoji}>{app.emoji}</span>
                <span className={styles.quickName}>{app.name}</span>
                <span className={styles.quickDesc}>{app.desc}</span>
              </button>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
