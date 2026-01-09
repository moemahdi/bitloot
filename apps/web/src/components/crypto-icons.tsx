'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';

interface CryptoIconProps {
  className?: string;
  size?: number;
}

// In-memory cache for successful CDN URLs (persists during session)
const cdnCache = new Map<string, string>();

// Cache for failed icons (to avoid retrying on every render)
const failedIconsCache = new Set<string>();

// CDN URLs for cryptocurrency icons
const CDN_SOURCES = {
  // CryptoIcons - Free SVG icons for 500+ cryptocurrencies
  cryptoicons: (symbol: string) => `https://cryptoicons.org/api/icon/${symbol.toLowerCase()}/200`,
  // Backup CDN with 500+ icons
  backup: (symbol: string) => `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${symbol.toLowerCase()}.png`,
  // CoinCap fallback
  coingecko: (symbol: string) => `https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`,
};

// Real cryptocurrency icon component that fetches from CDN with caching
export function RealCryptoIcon({ 
  code, 
  className = '', 
  size = 24,
  fallbackSymbol 
}: { 
  code: string; 
  className?: string; 
  size?: number;
  fallbackSymbol?: string;
}) {
  // Sanitize currency code (remove network suffixes)
  const cleanCode = useMemo(() => sanitizeCode(code), [code]);
  const symbol = fallbackSymbol ?? cleanCode;
  
  // Check cache first - if we already know this icon failed, skip CDN loading
  const [imageError, setImageError] = useState(() => failedIconsCache.has(cleanCode));
  
  // Get cached CDN URL or start with first CDN
  const [currentUrl, setCurrentUrl] = useState<string>(() => {
    // Check if we have a cached successful URL
    if (cdnCache.has(cleanCode)) {
      return cdnCache.get(cleanCode)!;
    }
    // Try first CDN
    return CDN_SOURCES.cryptoicons(cleanCode);
  });
  
  // CDN sources to try in order
  const cdnList = useMemo(() => [
    CDN_SOURCES.cryptoicons(cleanCode),
    CDN_SOURCES.backup(cleanCode),
    CDN_SOURCES.coingecko(cleanCode),
  ], [cleanCode]);

  const handleError = () => {
    const currentIndex = cdnList.indexOf(currentUrl);
    
    if (currentIndex < cdnList.length - 1) {
      // Try next CDN
      const nextUrl = cdnList[currentIndex + 1];
      if (nextUrl) {
        setCurrentUrl(nextUrl);
      }
    } else {
      // All CDNs failed, mark as failed and show fallback
      failedIconsCache.add(cleanCode);
      setImageError(true);
    }
  };

  const handleLoad = () => {
    // Cache successful URL for future renders
    cdnCache.set(cleanCode, currentUrl);
  };

  // If all CDN sources failed, use dynamic icon
  if (imageError) {
    return (
      <DynamicCryptoIcon 
        className={className} 
        size={size} 
        code={cleanCode}
        symbol={symbol} 
      />
    );
  }

  return (
    <div className={`inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <Image
        src={currentUrl}
        alt={`${symbol} icon`}
        width={size}
        height={size}
        className="rounded-full"
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy" // Lazy load for better performance
        unoptimized // Allow external CDN images (they're already optimized)
      />
    </div>
  );
}

// Bitcoin (BTC)
export function BitcoinIcon({ className = '', size = 24 }: CryptoIconProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className}>
      <defs>
        <linearGradient id="btc-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F7931A" />
          <stop offset="100%" stopColor="#E87A00" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="16" fill="url(#btc-gradient)" />
      <path
        d="M22.5 14.5c.3-2-1.2-3.1-3.3-3.8l.7-2.7-1.6-.4-.7 2.6c-.4-.1-.9-.2-1.3-.3l.7-2.6-1.6-.4-.7 2.7c-.3-.1-.7-.2-1-.3l-2.2-.5-.4 1.7s1.2.3 1.2.3c.7.2.8.6.8 1l-.8 3.2c0 0 .1 0 .2 0l-.2 0-1.1 4.5c-.1.2-.3.6-.8.4 0 0-1.2-.3-1.2-.3l-.8 1.8 2.1.5c.4.1.8.2 1.2.3l-.7 2.7 1.6.4.7-2.7c.5.1.9.2 1.4.3l-.7 2.7 1.6.4.7-2.7c2.8.5 4.9.3 5.8-2.2.7-2-.1-3.2-1.5-3.9 1.1-.3 1.9-1 2.1-2.5zm-3.8 5.3c-.5 2-4 .9-5.1.6l.9-3.7c1.1.3 4.7.8 4.2 3.1zm.5-5.4c-.5 1.8-3.4.9-4.3.7l.8-3.4c.9.2 4 .6 3.5 2.7z"
        fill="#ffffff"
      />
    </svg>
  );
}

// Ethereum (ETH)
export function EthereumIcon({ className = '', size = 24 }: CryptoIconProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className}>
      <defs>
        <linearGradient id="eth-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8A92B2" />
          <stop offset="50%" stopColor="#62688F" />
          <stop offset="100%" stopColor="#454A75" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="16" fill="url(#eth-gradient)" />
      <g fill="#fff">
        <path fillOpacity=".6" d="M16 5l-6 10.5L16 18l6-2.5z" />
        <path fillOpacity=".9" d="M10 15.5L16 27l6-11.5-6 3z" />
        <path fillOpacity=".6" d="M16 5v13l6-2.5z" />
        <path fillOpacity=".9" d="M16 18v9l6-11.5z" />
      </g>
    </svg>
  );
}

// Litecoin (LTC)
export function LitecoinIcon({ className = '', size = 24 }: CryptoIconProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className}>
      <defs>
        <linearGradient id="ltc-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#BFBBBB" />
          <stop offset="100%" stopColor="#A5A5A5" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="16" fill="url(#ltc-gradient)" />
      <path
        d="M12.5 25L13.5 21L10 22L10.5 20L14 19L16 12L12 13L12.5 11L17 10L18.5 5H22L20 12L23 11L22.5 13L19.5 14L17.5 21H25L24.5 23H12.5V25Z"
        fill="#ffffff"
      />
    </svg>
  );
}

// Tether (USDT)
export function TetherIcon({ className = '', size = 24 }: CryptoIconProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className}>
      <defs>
        <linearGradient id="usdt-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#50AF95" />
          <stop offset="100%" stopColor="#26A17B" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="16" fill="url(#usdt-gradient)" />
      <path
        d="M17.5 17.3v-.1c-.1 0-1.2.1-2.8.1s-2.6-.1-2.8-.1v.1c-4.1.2-7.2.9-7.2 1.7 0 1 4.3 1.8 9.7 1.8s9.7-.8 9.7-1.8c0-.8-3.1-1.5-7.2-1.7h.6zM17.5 16.5v-1.6h4.2v-3.5H10.3v3.5h4.2v1.6c-4.7.2-8.2 1.1-8.2 2.1 0 1.2 4.5 2.2 10.1 2.2s10.1-1 10.1-2.2c0-1-3.5-1.9-8.2-2.1h-.8z"
        fill="#fff"
      />
    </svg>
  );
}

// USD Coin (USDC)
export function UsdcIcon({ className = '', size = 24 }: CryptoIconProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className}>
      <defs>
        <linearGradient id="usdc-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2775CA" />
          <stop offset="100%" stopColor="#1A5DAB" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="16" fill="url(#usdc-gradient)" />
      <path
        d="M20.5 18.5c0-2-1.2-2.7-3.5-3-.7-.1-1.3-.2-1.8-.4-.8-.2-1.2-.5-1.2-1s.5-1 1.5-1c.9 0 1.4.3 1.6.9l.1.3h1.8v-.3c-.2-1.3-1.2-2.2-2.5-2.4V10h-2v1.5c-1.6.3-2.7 1.3-2.7 2.7 0 1.9 1.2 2.6 3.3 2.9l1.2.2c1.2.3 1.7.6 1.7 1.2s-.6 1.1-1.7 1.1c-1 0-1.6-.4-1.8-1.1l-.1-.2h-1.9l.1.4c.3 1.4 1.3 2.3 2.9 2.5V22h2v-1.5c1.7-.2 2.8-1.3 2.8-2.8v.8z"
        fill="#fff"
      />
    </svg>
  );
}

// Solana (SOL)
export function SolanaIcon({ className = '', size = 24 }: CryptoIconProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className}>
      <defs>
        <linearGradient id="sol-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9945FF" />
          <stop offset="50%" stopColor="#14F195" />
          <stop offset="100%" stopColor="#00FFA3" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="16" fill="#000" />
      <g transform="translate(6, 8)">
        <path d="M3.5 12.5l2.5-2.5h13l-2.5 2.5h-13z" fill="url(#sol-gradient)" />
        <path d="M3.5 3.5l2.5 2.5h13l-2.5-2.5h-13z" fill="url(#sol-gradient)" />
        <path d="M16.5 8l2.5 2.5h-13l-2.5-2.5h13z" fill="url(#sol-gradient)" />
      </g>
    </svg>
  );
}

// Tron (TRX)
export function TronIcon({ className = '', size = 24 }: CryptoIconProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className}>
      <defs>
        <linearGradient id="trx-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EF0027" />
          <stop offset="100%" stopColor="#C50024" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="16" fill="url(#trx-gradient)" />
      <path
        d="M23.5 10L11 6.5L6.5 23L23.5 10ZM13 10L20 12L12 17L13 10ZM11 18L10 21L12 17L11 18Z"
        fill="#fff"
      />
    </svg>
  );
}

// Binance Coin (BNB)
export function BnbIcon({ className = '', size = 24 }: CryptoIconProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className}>
      <defs>
        <linearGradient id="bnb-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F3BA2F" />
          <stop offset="100%" stopColor="#E6A800" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="16" fill="url(#bnb-gradient)" />
      <g fill="#fff">
        <path d="M12 16l-3-3 3-3 3 3z" transform="rotate(45 12 13)" />
        <path d="M20 16l-3-3 3-3 3 3z" transform="rotate(45 20 13)" />
        <path d="M16 12l-3-3 3-3 3 3z" transform="rotate(45 16 9)" />
        <path d="M16 20l-3-3 3-3 3 3z" transform="rotate(45 16 17)" />
        <path d="M16 24l-3-3 3-3 3 3z" transform="rotate(45 16 21)" />
      </g>
    </svg>
  );
}

// Dogecoin (DOGE)
export function DogeIcon({ className = '', size = 24 }: CryptoIconProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className}>
      <defs>
        <linearGradient id="doge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C2A633" />
          <stop offset="100%" stopColor="#A08420" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="16" fill="url(#doge-gradient)" />
      <path
        d="M13 11h4c3 0 5 2 5 5s-2 5-5 5h-4v-10zm3 8h1c1.6 0 3-1.4 3-3s-1.4-3-3-3h-1v6zm-3-3h3"
        fill="#fff"
        stroke="#fff"
        strokeWidth="1"
      />
    </svg>
  );
}

// XRP (Ripple)
export function XrpIcon({ className = '', size = 24 }: CryptoIconProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className}>
      <circle cx="16" cy="16" r="16" fill="#23292F" />
      <path
        d="M23 9h-2.5l-4.5 5-4.5-5H9l6 6.5-6 6.5h2.5l4.5-5 4.5 5H23l-6-6.5z"
        fill="#fff"
      />
    </svg>
  );
}

// Cardano (ADA)
export function CardanoIcon({ className = '', size = 24 }: CryptoIconProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className}>
      <defs>
        <linearGradient id="ada-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0033AD" />
          <stop offset="100%" stopColor="#001A5D" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="16" fill="url(#ada-gradient)" />
      <g fill="#fff">
        <circle cx="16" cy="8" r="1.5" />
        <circle cx="16" cy="24" r="1.5" />
        <circle cx="9" cy="12" r="1.5" />
        <circle cx="23" cy="12" r="1.5" />
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="23" cy="20" r="1.5" />
        <circle cx="16" cy="16" r="3" />
        <circle cx="12" cy="16" r="1" />
        <circle cx="20" cy="16" r="1" />
      </g>
    </svg>
  );
}

// Polkadot (DOT)
export function PolkadotIcon({ className = '', size = 24 }: CryptoIconProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className}>
      <defs>
        <linearGradient id="dot-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E6007A" />
          <stop offset="100%" stopColor="#C50066" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="16" fill="url(#dot-gradient)" />
      <g fill="#fff">
        <ellipse cx="16" cy="10" rx="5" ry="3" />
        <ellipse cx="16" cy="22" rx="5" ry="3" />
        <circle cx="16" cy="16" r="3" />
      </g>
    </svg>
  );
}

// Monero (XMR)
export function MoneroIcon({ className = '', size = 24 }: CryptoIconProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className}>
      <defs>
        <linearGradient id="xmr-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6600" />
          <stop offset="100%" stopColor="#CC5200" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="16" fill="url(#xmr-gradient)" />
      <path
        d="M16 6L8 18V24H11V15L16 10L21 15V24H24V18L16 6Z"
        fill="#fff"
      />
      <path
        d="M6 22H10V24H6V22ZM22 22H26V24H22V22Z"
        fill="#fff"
      />
    </svg>
  );
}

// TON (Toncoin)
export function TonIcon({ className = '', size = 24 }: CryptoIconProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className}>
      <defs>
        <linearGradient id="ton-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0098EA" />
          <stop offset="100%" stopColor="#0076BC" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="16" fill="url(#ton-gradient)" />
      <path
        d="M16 6L8 14H13V26H19V14H24L16 6Z"
        fill="#fff"
      />
    </svg>
  );
}

// DAI
export function DaiIcon({ className = '', size = 24 }: CryptoIconProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className}>
      <defs>
        <linearGradient id="dai-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5AC37" />
          <stop offset="100%" stopColor="#D99422" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="16" fill="url(#dai-gradient)" />
      <path
        d="M10 11H17C20 11 22 13 22 16C22 19 20 21 17 21H10V19H8V17H10V15H8V13H10V11ZM12 13V15H17C18.1 15 19 14.6 19 14C19 13.4 18.1 13 17 13H12ZM12 17V19H17C18.1 19 19 18.6 19 18C19 17.4 18.1 17 17 17H12Z"
        fill="#fff"
      />
    </svg>
  );
}

// Helper: Sanitize currency code (remove network suffixes for consistent hashing)
function sanitizeCode(code: string): string {
  // Remove common network suffixes for more consistent visual identity
  const suffixes = ['trc20', 'erc20', 'bsc', 'sol', 'matic', 'arb', 'op', 'algo', 'ton', 'base', 'mainnet'];
  let cleaned = code.toLowerCase();
  for (const suffix of suffixes) {
    if (cleaned.endsWith(suffix) && cleaned.length > suffix.length) {
      cleaned = cleaned.slice(0, -suffix.length);
      break;
    }
  }
  return cleaned;
}

// Helper: Generate deterministic HSL palette from currency code
function generatePalette(seed: string) {
  // Create a hash from the seed string
  const hash = seed.split('').reduce((acc, char, i) => {
    return acc + char.charCodeAt(0) * (i + 1);
  }, 0);
  
  // Generate hue from hash (0-360 degrees)
  const hue = hash % 360;
  
  // Create a vibrant, consistent palette
  return {
    primary: `hsl(${hue}, 75%, 45%)`,
    secondary: `hsl(${(hue + 40) % 360}, 70%, 55%)`,
    accent: `hsl(${(hue + 80) % 360}, 80%, 50%)`,
  };
}

// Dynamic crypto icon with unique colors per currency
export function DynamicCryptoIcon({ 
  className = '', 
  size = 24, 
  code = '?',
  symbol 
}: CryptoIconProps & { code?: string; symbol?: string }) {
  const cleanCode = sanitizeCode(code);
  const palette = generatePalette(cleanCode);
  const displaySymbol = (symbol ?? code).substring(0, 3).toUpperCase();
  const gradientId = `dynamic-gradient-${cleanCode}`;
  
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={palette.primary} />
          <stop offset="50%" stopColor={palette.secondary} />
          <stop offset="100%" stopColor={palette.accent} />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="16" fill={`url(#${gradientId})`} />
      <text
        x="16"
        y="16"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fff"
        fontSize={displaySymbol.length > 2 ? '9' : '11'}
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
      >
        {displaySymbol}
      </text>
    </svg>
  );
}

// Legacy alias for backwards compatibility
export const GenericCryptoIcon = DynamicCryptoIcon;

// Icon registry for easy lookup
const CRYPTO_ICONS: Record<string, React.ComponentType<CryptoIconProps>> = {
  btc: BitcoinIcon,
  eth: EthereumIcon,
  ltc: LitecoinIcon,
  usdt: TetherIcon,
  usdttrc20: TetherIcon,
  usdterc20: TetherIcon,
  usdtbsc: TetherIcon,
  usdtsol: TetherIcon,
  usdtmatic: TetherIcon,
  usdtarb: TetherIcon,
  usdtop: TetherIcon,
  usdtalgo: TetherIcon,
  usdtton: TetherIcon,
  usdc: UsdcIcon,
  usdcmatic: UsdcIcon,
  usdcsol: UsdcIcon,
  usdcbsc: UsdcIcon,
  usdcarb: UsdcIcon,
  usdcbase: UsdcIcon,
  sol: SolanaIcon,
  trx: TronIcon,
  bnbbsc: BnbIcon,
  bnbmainnet: BnbIcon,
  doge: DogeIcon,
  xrp: XrpIcon,
  ada: CardanoIcon,
  dot: PolkadotIcon,
  xmr: MoneroIcon,
  ton: TonIcon,
  dai: DaiIcon,
  daiarb: DaiIcon,
};

// Main component to get crypto icon by code
export function CryptoIcon({ 
  code, 
  className = '', 
  size = 24,
  fallbackSymbol 
}: { 
  code: string; 
  className?: string; 
  size?: number;
  fallbackSymbol?: string;
}) {
  const normalizedCode = code.toLowerCase();
  const IconComponent = CRYPTO_ICONS[normalizedCode];
  
  // For major cryptocurrencies, use handcrafted SVG icons for better quality
  if (IconComponent) {
    return <IconComponent className={className} size={size} />;
  }
  
  // For all other currencies, fetch real icons from CDN
  return (
    <RealCryptoIcon 
      code={normalizedCode}
      className={className} 
      size={size} 
      fallbackSymbol={fallbackSymbol ?? code} 
    />
  );
}

// Export individual icons for direct use
export { CRYPTO_ICONS };
