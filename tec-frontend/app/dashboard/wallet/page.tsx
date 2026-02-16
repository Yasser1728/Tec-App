'use client';

import { useState } from 'react';
import styles from './wallet.module.css';

const TRANSACTIONS = [
  { id: '1', type: 'receive', amount: 100, status: 'completed', date: '2026-02-16', txHash: 'abc123...' },
  { id: '2', type: 'send', amount: 25, status: 'completed', date: '2026-02-15', txHash: 'def456...' },
  { id: '3', type: 'payment', amount: 5, status: 'pending', date: '2026-02-14', txHash: 'ghi789...' },
  { id: '4', type: 'receive', amount: 50, status: 'completed', date: '2026-02-13', txHash: 'jkl012...' },
  { id: '5', type: 'send', amount: 10, status: 'failed', date: '2026-02-12', txHash: 'mno345...' },
];

export default function WalletPage() {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredTransactions = TRANSACTIONS.filter(tx => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (filterStatus !== 'all' && tx.status !== filterStatus) return false;
    return true;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'receive': return '↓';
      case 'send': return '↑';
      case 'payment': return '→';
      default: return '•';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: 'Completed', className: styles.statusCompleted },
      pending: { label: 'Pending', className: styles.statusPending },
      failed: { label: 'Failed', className: styles.statusFailed },
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return <span className={`${styles.statusBadge} ${config.className}`}>{config.label}</span>;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Wallet</h1>
          <p className={styles.subtitle}>Manage your Pi balance and transactions</p>
        </div>
      </header>

      <section className={`${styles.balanceCard} fade-up`}>
        <div className={styles.balanceLabel}>Total Balance</div>
        <div className={`${styles.balanceAmount} gold-text`}>175.00 π</div>
        <div className={styles.balanceActions}>
          <button className={styles.actionBtn}>↓ Receive</button>
          <button className={styles.actionBtn}>↑ Send</button>
        </div>
      </section>

      <section className={`${styles.walletsSection} fade-up-1`}>
        <h2 className={styles.sectionTitle}>My Wallets</h2>
        <div className={styles.walletsGrid}>
          <div className={styles.walletCard}>
            <div className={styles.walletHeader}>
              <span className={styles.walletIcon}>π</span>
              <span className={styles.walletBadge}>Primary</span>
            </div>
            <div className={styles.walletName}>Pi Wallet</div>
            <div className={`${styles.walletBalance} gold-text`}>175.00 π</div>
            <div className={styles.walletAddress}>pi:abc123...xyz789</div>
          </div>
          
          <div className={`${styles.walletCard} ${styles.walletCardAdd}`}>
            <div className={styles.addIcon}>+</div>
            <div className={styles.addText}>Link New Wallet</div>
          </div>
        </div>
      </section>

      <section className={`${styles.transactionsSection} fade-up-2`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Transaction History</h2>
          <div className={styles.filters}>
            <select 
              className={styles.filterSelect}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="send">Send</option>
              <option value="receive">Receive</option>
              <option value="payment">Payment</option>
            </select>
            <select 
              className={styles.filterSelect}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        <div className={styles.transactionsTable}>
          <div className={styles.tableHeader}>
            <span>Type</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Date</span>
            <span>TX Hash</span>
          </div>
          <div className={styles.tableBody}>
            {filteredTransactions.map((tx) => (
              <div key={tx.id} className={styles.tableRow}>
                <div className={styles.txType}>
                  <span className={styles.txIcon}>{getTypeIcon(tx.type)}</span>
                  <span className={styles.txLabel}>{tx.type}</span>
                </div>
                <div className={`${styles.txAmount} ${tx.type === 'send' ? styles.negative : styles.positive}`}>
                  {tx.type === 'send' ? '-' : '+'}{tx.amount.toFixed(2)} π
                </div>
                <div className={styles.txStatus}>
                  {getStatusBadge(tx.status)}
                </div>
                <div className={styles.txDate}>{tx.date}</div>
                <div className={styles.txHash}>
                  <a href="#" className={styles.hashLink}>{tx.txHash}</a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.pagination}>
          <button className={styles.paginationBtn} disabled>Previous</button>
          <span className={styles.paginationInfo}>Page 1 of 1</span>
          <button className={styles.paginationBtn} disabled>Next</button>
        </div>
      </section>
    </div>
  );
}
