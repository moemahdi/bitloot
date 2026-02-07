'use client';

// Minimal global error boundary - no hooks, no imports with context
// This file MUST be prerenderable by Next.js

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0f',
          fontFamily: 'system-ui, sans-serif',
          color: '#e5e7eb',
        }}
      >
        <div
          style={{
            maxWidth: '400px',
            padding: '2rem',
            textAlign: 'center',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '1rem',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <div
            style={{
              width: '4rem',
              height: '4rem',
              margin: '0 auto 1rem',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
            }}
          >
            ⚠️
          </div>
          <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem' }}>
            Something went wrong
          </h1>
          <p style={{ margin: '0 0 1.5rem', color: '#9ca3af', fontSize: '0.875rem' }}>
            A critical error occurred. Please refresh or go back home.
          </p>
          <a
            href="/"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: 'transparent',
              border: '1px solid #06b6d4',
              borderRadius: '0.5rem',
              color: '#06b6d4',
              fontSize: '0.875rem',
              textDecoration: 'none',
            }}
          >
            Back to Home
          </a>
          {error.digest && (
            <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#6b7280' }}>
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
