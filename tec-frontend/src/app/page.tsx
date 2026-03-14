'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import PiPaymentButton from '@/components/payment/PiPaymentButton';
import styles from './page.module.css';

const APPS = [
  { name: 'Life',       emoji: '🌱', desc: 'Lifestyle & Wellness',      domain: 'life.pi',        category: 'Personal'      },
  { name: 'Insure',     emoji: '🛡️', desc: 'Insurance & Protection',    domain: 'insure.pi',      category: 'Finance'       },
  { name: 'Commerce',   emoji: '🛒', desc: 'Digital Commerce',          domain: 'commerce.pi',    category: 'Business'      },
  { name: 'Ecommerce',  emoji: '📦', desc: 'E-Commerce Platform',       domain: 'ecommerce.pi',   category: 'Business'      },
  { name: 'Assets',     emoji: '💼', desc: 'Portfolio Management',       domain: 'assets.pi',      category: 'Finance'       },
  { name: 'Fundx',      emoji: '📊', desc: 'Finance & Investment',       domain: 'fundx.pi',       category: 'Finance'       },
  { name: 'Dx',         emoji: '🏥', desc: 'Digital Healthcare',         domain: 'dx.pi',          category: 'Health'        },
  { name: 'Analytics',  emoji: '📈', desc: 'Data Analytics',             domain: 'analytics.pi',   category: 'Business'      },
  { name: 'Nbf',        emoji: '🏦', desc: 'Sovereign Banking',          domain: 'nbf.pi',         category: 'Finance'       },
  { name: 'Epic',       emoji: '🎮', desc: 'Gaming & Entertainment',     domain: 'epic.pi',        category: 'Entertainment' },
  { name: 'Legend',     emoji: '⭐', desc: 'Premium Experiences',        domain: 'legend.pi',      category: 'Premium'       },
  { name: 'Connection', emoji: '🔗', desc: 'Social & Networking',        domain: 'connection.pi',  category: 'Social'        },
  { name: 'System',     emoji: '⚙️', desc: 'Infrastructure & Tools',    domain: 'system.pi',      category: 'Tech'          },
  { name: 'Alert',      emoji: '🔔', desc: 'Notifications & Security',   domain: 'alert.pi',       category: 'Tech'          },
  { name: 'Tec',        emoji: '👑', desc: 'The Elite Consortium Hub',   domain: 'tec.pi',         category: 'Premium'       },
  { name: 'Estate',     emoji: '🏠', desc: 'Luxury Real Estate',         domain: 'estate.pi',      category: 'Premium'       },
  { name: 'Nx',         emoji: '🚀', desc: 'Next-Gen Technology',        domain: 'nx.pi',          category: 'Tech'          },
  { name: 'Explorer',   emoji: '✈️', desc: 'Luxury Travel',              domain: 'explorer.pi',    category: 'Premium'       },
  { name: 'Nexus',      emoji: '🌐', desc: 'Gateway to 24 Apps',         domain: 'nexus.pi',       category: 'Hub'           },
  { name: 'Brookfield', emoji: '🏙️', desc: 'Urban Development',          domain: 'brookfield.pi',  category: 'Premium'       },
  { name: 'Vip',        emoji: '💎', desc: 'Exclusive Access',            domain: 'vip.pi',         category: 'Premium'       },
  { name: 'Titan',      emoji: '🦾', desc: 'Enterprise Solutions',       domain: 'titan.pi',       category: 'Business'      },
  { name: 'Zone',       emoji: '🎯', desc: 'Focused Productivity',        domain: 'zone.pi',        category: 'Personal'      },
  { name: 'Elite',      emoji: '🏆', desc: 'Premium Consulting',         domain: 'elite.pi',       category: 'Premium'       },
];

const CATEGORIES = [
  'All', 'Finance', 'Premium', 'Business', 'Tech',
  'Personal', 'Health', 'Entertainment', 'Social', 'Hub',
];

const CATEGORY_COLORS: Record<string, string> = {
  Finance:       '#f0c040',
  Premium:       '#d4af37',
  Business:      '#7eb8f7',
  Tech:          '#7ee7c0',
  Personal:      '#f09898',
  Health:        '#98e0a8',
  Entertainment: '#c898f0',
  Social:        '#f0b878',
  Hub:           '#ffffff',
};

export default function HomePage() {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredApps = useMemo(() => {
    if (activeCategory === 'All') return APPS;
    return APPS.filter(app => app.category === activeCategory);
  }, [activeCategory]);

  const openApp = (domain: string) =>
    window.open(`https://${domain}`, '_blank', 'noopener,noreferrer');

  const handleKey = (e: React.KeyboardEvent, domain: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openApp(domain);
    }
  };

  const createRipple = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const rect = card.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    card.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  };

  return (
    <main className={styles.main}>

      {/* Background */}
      <div className={styles.bg} aria-hidden>
        <div className={styles.bgOrb1} />
        <div className={styles.bgOrb2} />
        <div className={styles.bgOrb3} />
        <div className={styles.bgGrid} />
        <div className={styles.bgNoise} />
      </div>

      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navLogo}>
          <span className={styles.navLogoMark}>T</span>
          <span className={styles.navLogoText}>EC</span>
        </div>
        <div className={styles.navLinks}>
          <a href="#ecosystem" className={styles.navLink}>Ecosystem</a>
          <a href="#payment" className={styles.navLink}>Join</a>
        </div>
        <div className={styles.navRight}>
          <LanguageSwitcher />
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          <span className={styles.heroBadgeDot} />
          Pi Network Ecosystem
        </div>
        <h1 className={styles.heroTitle}>
          <span className={styles.heroTitleMain}>The Elite</span>
          <span className={styles.heroTitleAccent}>Consortium</span>
        </h1>
        <p className={styles.heroSub}>
          24 sovereign apps. One identity. One wallet. One world.
        </p>
        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <span className={styles.heroStatNum}>24</span>
            <span className={styles.heroStatLabel}>Apps</span>
          </div>
          <div className={styles.heroStatDivider} />
          <div className={styles.heroStat}>
            <span className={styles.heroStatNum}>47M+</span>
            <span className={styles.heroStatLabel}>Pi Users</span>
          </div>
          <div className={styles.heroStatDivider} />
          <div className={styles.heroStat}>
            <span className={styles.heroStatNum}>1</span>
            <span className={styles.heroStatLabel}>Identity</span>
          </div>
        </div>
      </section>

      {/* Payment */}
      <section id="payment" className={styles.paymentSection}>
        <div className={styles.paymentCard}>
          <div className={styles.paymentCardInner}>
            <p className={styles.paymentLabel}>Connect & Trade</p>
            <PiPaymentButton />
          </div>
        </div>
      </section>

      {/* Featured Nexus */}
      <section className={styles.featuredSection}>
        <div className={styles.featuredCard}>
          <span className={styles.featuredEmoji}>🌐</span>
          <h2 className={styles.featuredTitle}>TEC Nexus</h2>
          <p className={styles.featuredDesc}>
            The sovereign gateway connecting the entire TEC ecosystem.
          </p>
          <button className={styles.featuredBtn} onClick={() => openApp('nexus.pi')}>
            Explore Nexus →
          </button>
        </div>
      </section>

      {/* Ecosystem */}
      <section id="ecosystem" className={styles.ecosystemSection}>
        <div className={styles.ecosystemHeader}>
          <p className={styles.sectionEyebrow}>The Ecosystem</p>
          <h2 className={styles.sectionTitle}>
            24 Apps — <span className={styles.goldText}>One World</span>
          </h2>
          <p className={styles.sectionDesc}>
            Each domain is an independent sovereign app powered by Pi Network.
          </p>
        </div>

        {/* Category Filter */}
        <div className={styles.filterBar}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`${styles.filterBtn} ${activeCategory === cat ? styles.filterBtnActive : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Apps Grid */}
        <div className={styles.appsGrid}>
          {filteredApps.map((app, i) => (
            <div
              key={app.name}
              className={styles.appCard}
              style={{
                animationDelay: `${i * 0.05}s`,
                '--cat-color': CATEGORY_COLORS[app.category] ?? '#d4af37',
              } as React.CSSProperties}
              onClick={(e) => { createRipple(e); openApp(app.domain); }}
              onKeyDown={(e) => handleKey(e, app.domain)}
              role="button"
              tabIndex={0}
            >
              <div className={styles.appCardGlow} />
              <div className={styles.appCardTop}>
                <span className={styles.appEmoji}>{app.emoji}</span>
                <span
                  className={styles.appCategory}
                  style={{ color: CATEGORY_COLORS[app.category] ?? '#d4af37' }}
                >
                  {app.category}
                </span>
              </div>
              <span className={styles.appName}>{app.name}</span>
              <span className={styles.appDesc}>{app.desc}</span>
              <div className={styles.appFooter}>
                <span className={styles.appDomain}>{app.domain}</span>
                <span className={styles.appArrow}>→</span>
              </div>
            </div>
          ))}
        </div>

        <p className={styles.appCount}>{filteredApps.length} of 24 apps</p>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerLogo}>
          <span className={styles.navLogoMark}>T</span>
          <span className={styles.navLogoText}>EC</span>
        </div>
        <p className={styles.footerText}>© 2026 The Elite Consortium · Built on Pi Network</p>
        <div className={styles.footerLinks}>
          <a href="#" className={styles.footerLink}>Privacy</a>
          <a href="#" className={styles.footerLink}>Terms</a>
        </div>
      </footer>

    </main>
  );
}
