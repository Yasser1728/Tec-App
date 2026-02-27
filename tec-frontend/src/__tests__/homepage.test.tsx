/**
 * Smoke test for HomePage component.
 * Verifies it renders key UI elements without crashing.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// ---- mock Next.js navigation ----
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// ---- mock hooks so we can control their output ----
vi.mock('@/lib-client/hooks/usePiAuth', () => ({
  usePiAuth: () => ({
    isAuthenticated: false,
    isLoading: false,
    error: null,
    errorType: null,
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock('@/lib-client/hooks/usePiPayment', () => ({
  usePiPayment: () => ({
    isProcessing: false,
    lastPayment: null,
    error: null,
    errorType: null,
    sdkAvailable: false,
    payDemoPi: vi.fn(),
    testSDK: vi.fn(),
    resetPayment: vi.fn(),
  }),
}));

vi.mock('@/lib-client/hooks/useDiagnostics', () => ({
  useDiagnostics: () => ({
    events: [],
    addEvent: vi.fn(),
    clearEvents: vi.fn(),
  }),
}));

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: {
      common: {
        piEcosystem: 'Pi Ecosystem',
        appName: 'TEC App',
        tagline: 'The Elite Consortium',
        loading: 'Loading...',
        login: 'Login',
      },
      home: {
        description: 'Description',
        subDescription: 'Sub description',
        ecosystem: 'Ecosystem',
        ecosystemTitle: 'Explore — the Apps',
        moreApps: 'More apps',
        stats: { apps: 'Apps', piUsers: 'Pi Users', identity: 'Identity' },
      },
      dashboard: {
        piIntegration: { connectBtn: 'Connect with Pi' },
      },
      apps: {
        Nexus: 'Nexus',
        Commerce: 'Commerce',
        Assets: 'Assets',
        Fundx: 'Fundx',
        Estate: 'Estate',
        Analytics: 'Analytics',
      },
    },
    language: 'en',
    setLanguage: vi.fn(),
  }),
}));

vi.mock('@/components/LanguageSwitcher', () => ({
  default: () => null,
}));

import HomePage from '@/app/page';

describe('HomePage', () => {
  it('renders without crashing', () => {
    render(<HomePage />);
  });

  it('shows the Connect with Pi button', () => {
    render(<HomePage />);
    expect(screen.getByRole('button', { name: /connect with pi/i })).toBeInTheDocument();
  });

  it('shows the app name in the hero heading', () => {
    render(<HomePage />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('TEC App');
  });

  it('shows the demo payment button', () => {
    render(<HomePage />);
    expect(screen.getByRole('button', { name: /pay 1 pi/i })).toBeInTheDocument();
  });
});
