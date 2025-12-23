'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            background: 'linear-gradient(180deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Background Glow Effects */}
          <div
            style={{
              position: 'fixed',
              top: '25%',
              left: '-8rem',
              width: '24rem',
              height: '24rem',
              background: 'rgba(239, 68, 68, 0.05)',
              borderRadius: '50%',
              filter: 'blur(64px)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'fixed',
              bottom: '25%',
              right: '-8rem',
              width: '24rem',
              height: '24rem',
              background: 'rgba(168, 85, 247, 0.05)',
              borderRadius: '50%',
              filter: 'blur(64px)',
              pointerEvents: 'none',
            }}
          />

          {/* Error Card */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '28rem',
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '1rem',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            {/* Top Accent Line */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.5), transparent)',
              }}
            />

            {/* Error Icon */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  padding: '1rem',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f87171"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h1
              style={{
                margin: '0 0 0.5rem 0',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#ffffff',
              }}
            >
              Critical Error
            </h1>

            {/* Description */}
            <p
              style={{
                margin: '0 0 1.5rem 0',
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.6)',
                lineHeight: 1.6,
              }}
            >
              Something went seriously wrong. Our team has been notified.
            </p>

            {/* Security Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                marginBottom: '1.5rem',
                borderRadius: '9999px',
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#22c55e"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 500 }}>
                Your data remains secure
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={() => reset()}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#22d3ee',
                  background: 'transparent',
                  border: '1px solid rgba(34, 211, 238, 0.3)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(34, 211, 238, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.6)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.3)';
                }}
              >
                Try Again
              </button>

              <button
                onClick={() => { window.location.href = '/'; }}
                style={{
                  width: '100%',
                  padding: '0.625rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.6)',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                }}
              >
                Back to Home
              </button>
            </div>

            {/* Error ID (Production) */}
            {error.digest && (
              <p
                style={{
                  marginTop: '1rem',
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.4)',
                }}
              >
                Error ID: <code style={{ color: '#a855f7' }}>{error.digest}</code>
              </p>
            )}

            {/* Bottom Accent Line */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.3), transparent)',
              }}
            />
          </div>

          {/* Footer Text */}
          <p
            style={{
              marginTop: '1.5rem',
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.4)',
            }}
          >
            BitLoot • Secure Crypto Commerce
          </p>
        </div>
      </body>
    </html>
  );
}
