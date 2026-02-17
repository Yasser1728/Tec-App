import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--black)',
      color: 'var(--white)',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        maxWidth: '420px',
        width: '100%',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '48px 32px',
        textAlign: 'center',
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          margin: '0 auto 24px',
          background: 'rgba(201, 168, 76, 0.1)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
        }}>
          🔍
        </div>
        <h1 style={{
          fontSize: '72px',
          fontWeight: 300,
          fontFamily: "'Cormorant Garamond', serif",
          background: 'linear-gradient(135deg, #c9a84c, #e8d5a3, #c9a84c)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: '0 0 8px',
        }}>
          404
        </h1>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 400,
          color: 'var(--white)',
          margin: '0 0 12px',
        }}>
          الصفحة غير موجودة
        </h2>
        <p style={{
          fontSize: '14px',
          color: 'var(--muted)',
          margin: '0 0 32px',
          lineHeight: 1.6,
        }}>
          عذراً، لم نتمكن من العثور على الصفحة المطلوبة.
          <br />
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '14px 32px',
            background: 'linear-gradient(135deg, #c9a84c, #a07830)',
            color: '#050507',
            fontWeight: 600,
            fontSize: '14px',
            borderRadius: '8px',
            textDecoration: 'none',
            transition: 'all 0.3s',
          }}
        >
          ← العودة للرئيسية / Go back home
        </Link>
      </div>
    </div>
  );
}
