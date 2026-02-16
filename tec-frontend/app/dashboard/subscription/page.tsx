'use client';

import { useState, useEffect } from 'react';
import { usePiAuth } from '@/hooks/usePiAuth';
import styles from './subscription.module.css';

const PLANS = [
  {
    name: 'Free',
    price: 0,
    description: 'Essential access for individual users',
    features: [
      '1 app access',
      'Basic features',
      'Community support',
      'Standard security',
    ],
  },
  {
    name: 'Pro',
    price: 5,
    description: 'Advanced features for power users',
    features: [
      '10 app access',
      'Priority support',
      'Advanced analytics',
      'Custom integrations',
      'Enhanced security',
    ],
  },
  {
    name: 'Enterprise',
    price: 25,
    description: 'Full platform access for organizations',
    features: [
      'All 24 apps access',
      'Dedicated support',
      'Custom API access',
      'White-label options',
      'Advanced security + 2FA',
      'Priority feature requests',
    ],
  },
];

export default function SubscriptionPage() {
  const { user } = usePiAuth();
  const [currentPlan, setCurrentPlan] = useState('Free');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (planName: string) => {
    setLoading(true);
    // TODO: Integrate with backend API
    setTimeout(() => {
      setCurrentPlan(planName);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Subscription Plans</h1>
          <p className={styles.subtitle}>Choose the perfect plan for your needs</p>
        </div>
        <div className={styles.currentBadge}>
          <span className={styles.badgeLabel}>Current Plan:</span>
          <span className={`${styles.badgeValue} gold-text`}>{currentPlan}</span>
        </div>
      </header>

      <div className={`${styles.plansGrid} fade-up`}>
        {PLANS.map((plan) => {
          const isCurrentPlan = plan.name === currentPlan;
          const isUpgrade = PLANS.findIndex(p => p.name === currentPlan) < PLANS.findIndex(p => p.name === plan.name);
          
          return (
            <div 
              key={plan.name} 
              className={`${styles.planCard} ${isCurrentPlan ? styles.planCardActive : ''}`}
            >
              <div className={styles.planHeader}>
                <h3 className={styles.planName}>{plan.name}</h3>
                <div className={styles.planPrice}>
                  <span className={`${styles.priceAmount} gold-text`}>{plan.price}</span>
                  <span className={styles.priceCurrency}>π/month</span>
                </div>
                <p className={styles.planDescription}>{plan.description}</p>
              </div>

              <ul className={styles.featureList}>
                {plan.features.map((feature) => (
                  <li key={feature} className={styles.featureItem}>
                    <span className={styles.featureIcon}>✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className={styles.planActions}>
                {isCurrentPlan ? (
                  <div className={styles.currentPlanLabel}>Active Plan</div>
                ) : (
                  <button
                    className={`${styles.subscribeBtn} ${isUpgrade ? styles.upgradebtn : ''}`}
                    onClick={() => handleSubscribe(plan.name)}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : isUpgrade ? 'Upgrade' : 'Downgrade'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <section className={`${styles.paymentHistory} fade-up-1`}>
        <h2 className={styles.sectionTitle}>Payment History</h2>
        <div className={styles.historyTable}>
          <div className={styles.tableHeader}>
            <span>Date</span>
            <span>Plan</span>
            <span>Amount</span>
            <span>Status</span>
          </div>
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>No payment history yet</p>
          </div>
        </div>
      </section>

      <section className={`${styles.billingInfo} fade-up-2`}>
        <div className={styles.infoCard}>
          <h3 className={styles.infoTitle}>Next Billing Date</h3>
          <p className={`${styles.infoValue} gold-text`}>
            {currentPlan === 'Free' ? 'N/A' : 'March 16, 2026'}
          </p>
        </div>
        <div className={styles.infoCard}>
          <h3 className={styles.infoTitle}>Auto Renewal</h3>
          <p className={`${styles.infoValue} ${currentPlan === 'Free' ? styles.inactive : styles.active}`}>
            {currentPlan === 'Free' ? 'Disabled' : 'Enabled'}
          </p>
        </div>
      </section>
    </div>
  );
}
