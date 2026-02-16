'use client';

import { useTranslation } from '@/lib/i18n';
import styles from './LanguageSwitcher.module.css';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  return (
    <button 
      className={styles.switcher}
      onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
      aria-label="Switch language"
    >
      {locale === 'en' ? 'العربية' : 'English'}
    </button>
  );
}
