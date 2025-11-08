'use client';

import { useEffect, useState } from 'react';

export default function Home(): React.ReactNode {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 'bold' }}>🎮 BitLoot</h1>
      <p style={{ fontSize: '1rem', marginBottom: '2rem' }}>
        Crypto-only e-commerce for instant delivery of digital goods
      </p>
      <div
        style={{ background: '#1a1a1a', padding: '1rem', borderRadius: '8px', maxWidth: '400px' }}
      >
        <p>✅ It works!</p>
        <p style={{ fontSize: '0.875rem', color: '#999', marginTop: '1rem' }}>
          Health Check:{' '}
          <a href="http://localhost:4000/healthz" style={{ color: '#4CAF50' }}>
            /healthz
          </a>
        </p>
        <p style={{ fontSize: '0.875rem', color: '#999', marginTop: '0.5rem' }}>
          Swagger Docs:{' '}
          <a href="http://localhost:4000/api/docs" style={{ color: '#4CAF50' }}>
            /api/docs
          </a>
        </p>
        <p style={{ fontSize: '0.875rem', color: '#999', marginTop: '0.5rem' }}>
          Demo Product:{' '}
          <a href="http://localhost:3000/product/demo-product" style={{ color: '#4CAF50' }}>
            /product/demo-product
          </a>
        </p>
      </div>
    </main>
  );
}
