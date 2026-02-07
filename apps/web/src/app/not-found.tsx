// Server component — not-found.tsx is prerendered and cannot use hooks or context
// Using only native HTML elements to avoid any React context dependencies

export default function NotFound(): React.ReactElement {
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
          background: 'linear-gradient(180deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#e5e7eb',
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
            background: 'rgba(6, 182, 212, 0.05)',
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

        {/* Main Content Card */}
        <div
          style={{
            position: 'relative',
            maxWidth: '28rem',
            width: '100%',
            margin: '0 1rem',
            padding: '2rem',
            background: 'rgba(18, 18, 26, 0.8)',
            backdropFilter: 'blur(12px)',
            borderRadius: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center',
          }}
        >
          {/* 404 Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '6rem',
              height: '6rem',
              marginBottom: '1.5rem',
              borderRadius: '50%',
              background: 'rgba(168, 85, 247, 0.1)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
            }}
          >
            <span
              style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #06b6d4, #a855f7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              404
            </span>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              color: '#f3f4f6',
            }}
          >
            Page Not Found
          </h1>

          {/* Description */}
          <p
            style={{
              fontSize: '0.875rem',
              color: '#9ca3af',
              marginBottom: '2rem',
              lineHeight: '1.5',
            }}
          >
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>

          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <a
              href="/catalog"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                borderRadius: '0.5rem',
                color: '#06b6d4',
                fontSize: '0.875rem',
                fontWeight: '500',
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
            >
              🔍 Browse Catalog
            </a>
            <a
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid transparent',
                borderRadius: '0.5rem',
                color: '#9ca3af',
                fontSize: '0.875rem',
                fontWeight: '500',
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
            >
              🏠 Back to Home
            </a>
          </div>
        </div>

        {/* BitLoot Logo/Text */}
        <p
          style={{
            marginTop: '2rem',
            fontSize: '0.75rem',
            color: '#6b7280',
          }}
        >
          BitLoot — Crypto Marketplace for Digital Goods
        </p>
      </body>
    </html>
  );
}
