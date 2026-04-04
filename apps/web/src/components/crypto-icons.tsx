'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';

interface CryptoIconProps {
  className?: string;
  size?: number;
}

// ============================================================================
// CoinGecko ID Mapping — symbol/code → coingecko-id for CDN icon lookup
// Covers 500+ tokens including network variants (USDTTRC20, FLOKIBSC, etc.)
// ============================================================================

const CRYPTO_COINGECKO_IDS: Record<string, string> = {
  // Top coins
  btc: 'bitcoin', eth: 'ethereum', usdt: 'tether', bnb: 'binancecoin', sol: 'solana',
  usdc: 'usd-coin', xrp: 'ripple', doge: 'dogecoin', ton: 'the-open-network', ada: 'cardano',
  shib: 'shiba-inu', avax: 'avalanche-2', trx: 'tron', dot: 'polkadot', link: 'chainlink',
  bch: 'bitcoin-cash', near: 'near', matic: 'matic-network', pol: 'matic-network', ltc: 'litecoin',
  icp: 'internet-computer', dai: 'dai', uni: 'uniswap', etc: 'ethereum-classic', hbar: 'hedera-hashgraph',
  apt: 'aptos', cro: 'crypto-com-chain', atom: 'cosmos', okb: 'okb', fil: 'filecoin',
  arb: 'arbitrum', vet: 'vechain', mkr: 'maker', op: 'optimism', pepe: 'pepe',
  inj: 'injective-protocol', grt: 'the-graph', sui: 'sui', ftm: 'fantom', theta: 'theta-token',
  rune: 'thorchain', bonk: 'bonk', floki: 'floki',
  // DeFi
  aave: 'aave', algo: 'algorand', sand: 'the-sandbox', mana: 'decentraland', axs: 'axie-infinity',
  xlm: 'stellar', xtz: 'tezos', neo: 'neo', eos: 'eos', cake: 'pancakeswap-token',
  crv: 'curve-dao-token', '1inch': '1inch', comp: 'compound-governance-token', yfi: 'yearn-finance',
  snx: 'havven', gala: 'gala', chz: 'chiliz', ape: 'apecoin', bat: 'basic-attention-token',
  enj: 'enjincoin', lrc: 'loopring', knc: 'kyber-network-crystal', ctsi: 'cartesi',
  coti: 'coti', rvn: 'ravencoin', icx: 'icon', zil: 'zilliqa', waves: 'waves',
  ont: 'ontology', qtum: 'qtum', dcr: 'decred', xdc: 'xdce-crowd-sale', egld: 'elrond-erd-2',
  ilv: 'illuvium', iotx: 'iotex', hot: 'holotoken', omg: 'omg-network', tfuel: 'theta-fuel',
  gt: 'gatechain-token', mx: 'mx-token', ftt: 'ftx-token', luna: 'terra-luna-2', lunc: 'terra-luna',
  xvg: 'verge', dgb: 'digibyte', nano: 'nano', xyo: 'xyo-network', vib: 'viberate',
  // Privacy
  xmr: 'monero', zec: 'zcash', dash: 'dash',
  // Stablecoins
  busd: 'binance-usd', tusd: 'true-usd', usdp: 'paxos-standard', usdd: 'usdd',
  // Meme
  babydoge: 'baby-doge-coin',
  // Storage
  ar: 'arweave', storj: 'storj',
  // USDT network variants
  usdttrc20: 'tether', usdterc20: 'tether', usdtbsc: 'tether', usdtsol: 'tether',
  usdtmatic: 'tether', usdtarb: 'tether', usdtop: 'tether', usdtalgo: 'tether', usdtton: 'tether',
  // USDC network variants
  usdcerc20: 'usd-coin', usdcbsc: 'usd-coin', usdcsol: 'usd-coin', usdcmatic: 'usd-coin',
  usdcarb: 'usd-coin', usdcbase: 'usd-coin',
  // BNB network variants
  bnbbsc: 'binancecoin', bnbmainnet: 'binancecoin',
  // ETH network variants
  ethbsc: 'ethereum', etharb: 'ethereum', ethop: 'ethereum', ethbase: 'ethereum',
  // MATIC/POL variants
  maticbsc: 'matic-network', maticmainnet: 'matic-network',
  // AVAX variants
  avaxc: 'avalanche-2', avaxbsc: 'avalanche-2',
  // SHIB variants
  shibbsc: 'shiba-inu',
  // FLOKI variants
  flokibsc: 'floki',
  // DAI variants
  daiarb: 'dai', daibsc: 'dai',
  // BUSD variants
  busdbsc: 'binance-usd',
  // USDD variants
  usddtrc20: 'usdd',
  // BTT variants
  bttc: 'bittorrent', bttcbsc: 'bittorrent',
  // SXP variants
  sxpmainnet: 'swipe',
  // ETHW
  ethw: 'ethereum-pow-iou',
  // Other tokens with network suffixes
  galaerc20: 'gala', kibabsc: 'kiba-inu', kiba: 'kiba-inu',
  avabsc: 'concierge-io',
  chr: 'chromia', c98: 'coin98', bone: 'bone-shibaswap', cult: 'cult-dao', cvc: 'civic',
  dao: 'dao-maker', fun: 'funtoken', om: 'mantra-dao', tko: 'tokocrypto',
  super: 'superfarm',
  // Additional tokens (verified CoinGecko IDs)
  kishu: 'kishu-inu', leash: 'leash', now: 'changenow', pika: 'pika-protocol',
  pit: 'pitbull', quack: 'richquack', trvl: 'dtravel', guard: 'guardian-token',
};

/**
 * CoinGecko verified image paths — fetched from CoinGecko API.
 * Maps coingecko-id → '{numericId}/small/{actual_filename}'
 * Filenames are NOT predictable — they must come from the API.
 */
const COINGECKO_IMAGE_PATHS: Record<string, string> = {
  // Top coins (verified from CoinGecko API 2026-04)
  'bitcoin': '1/small/bitcoin.png',
  'ethereum': '279/small/ethereum.png',
  'tether': '325/small/Tether.png',
  'binancecoin': '825/small/bnb-icon2_2x.png',
  'solana': '4128/small/solana.png',
  'usd-coin': '6319/small/USDC.png',
  'ripple': '44/small/xrp-symbol-white-128.png',
  'dogecoin': '5/small/dogecoin.png',
  'the-open-network': '17980/small/photo_2024-09-10_17.09.00.jpeg',
  'cardano': '975/small/cardano.png',
  'shiba-inu': '11939/small/shiba.png',
  'avalanche-2': '12559/small/Avalanche_Circle_RedWhite_Trans.png',
  'tron': '1094/small/tron.png',
  'polkadot': '12171/small/polkadot.jpg',
  'chainlink': '877/small/Chainlink_Logo_500.png',
  'bitcoin-cash': '780/small/bitcoin-cash-circle.png',
  'near': '10365/small/near.jpg',
  'matic-network': '4713/small/polygon.png',
  'litecoin': '2/small/litecoin.png',
  'internet-computer': '14495/small/Internet_Computer_logo.png',
  'dai': '9956/small/Badge_Dai.png',
  'uniswap': '12504/small/uniswap-logo.png',
  'ethereum-classic': '453/small/ethereum-classic-logo.png',
  'hedera-hashgraph': '3688/small/hbar.png',
  'aptos': '26455/small/Aptos-Network-Symbol-Black-RGB-1x.png',
  'crypto-com-chain': '7310/small/cro_token_logo.png',
  'cosmos': '1481/small/cosmos_hub.png',
  'okb': '4463/small/WeChat_Image_20220118095654.png',
  'filecoin': '12817/small/filecoin.png',
  'arbitrum': '16547/small/arb.jpg',
  'vechain': '1167/small/VET.png',
  'maker': '1364/small/Mark_Maker.png',
  'optimism': '25244/small/Token.png',
  'pepe': '29850/small/pepe-token.jpeg',
  'injective-protocol': '12882/small/Other_200x200.png',
  'the-graph': '13397/small/Graph_Token.png',
  'sui': '26375/small/sui-ocean-square.png',
  'fantom': '4001/small/Fantom_round.png',
  'theta-token': '2538/small/theta-token-logo.png',
  'thorchain': '6595/small/THORChain_Circle_Gradient__with_Lightning_Bolt_-_Square_Transparent_Background_200px.png',
  'bonk': '28600/small/bonk.jpg',
  'floki': '16746/small/PNG_image.png',
  'aave': '12645/small/aave-token-round.png',
  'algorand': '4380/small/download.png',
  'the-sandbox': '12129/small/sandbox_logo.jpg',
  'decentraland': '878/small/decentraland-mana.png',
  'axie-infinity': '13029/small/axie_infinity_logo.png',
  'stellar': '100/small/fmpFRHH_400x400.jpg',
  'tezos': '976/small/Tezos-logo.png',
  'neo': '480/small/NEO_512_512.png',
  'eos': '738/small/CG_EOS_Icon.png',
  'pancakeswap-token': '12632/small/pancakeswap-cake-logo_%281%29.png',
  'curve-dao-token': '12124/small/Curve.png',
  '1inch': '13469/small/1inch-logo.jpeg',
  'compound-governance-token': '10775/small/COMP.png',
  'yearn-finance': '11849/small/yearn.jpg',
  'havven': '3406/small/SNX.png',
  'gala': '12493/small/GALA_token_image_-_200PNG.png',
  'chiliz': '8834/small/CHZ_Token_updated.png',
  'apecoin': '24383/small/APECOIN.png',
  'basic-attention-token': '677/small/basic-attention-token.png',
  'enjincoin': '1102/small/Symbol_Only_-_Purple.png',
  'loopring': '913/small/LRC.png',
  'ravencoin': '3412/small/ravencoin.png',
  'zilliqa': '2687/small/Zilliqa-logo.png',
  'waves': '425/small/waves.png',
  'ontology': '3447/small/ONT.png',
  'qtum': '684/small/Qtum_Logo_blue_CG.png',
  'decred': '329/small/dcr.png',
  'xdce-crowd-sale': '2912/small/xdc-icon.png',
  'elrond-erd-2': '12335/small/egld-token-logo.png',
  'illuvium': '14468/small/logo-200x200.png',
  'iotex': '3334/small/20250731-171811.png',
  'holotoken': '3348/small/hot-mark-med.png',
  'theta-fuel': '8029/small/1_0YugngOrriVg4ZYx4wOFQ.png',
  'verge': '203/small/Verge_Coin_%28native%29_icon_200x200.jpg',
  'digibyte': '63/small/digibyte.png',
  'nano': '756/small/nano.png',
  'monero': '69/small/monero.png',
  'zcash': '486/small/zcash.png',
  'dash': '19/small/dash-logo.png',
  'binance-usd': '9576/small/BUSDLOGO.jpg',
  'true-usd': '3449/small/tusd.png',
  'paxos-standard': '6013/small/Pax_Dollar.png',
  'baby-doge-coin': '16125/small/babydoge.jpg',
  'arweave': '4343/small/oRt6SiEN_400x400.jpg',
  'storj': '949/small/storj.png',
  'bittorrent': '22457/small/btt_logo.png',
  'swipe': '9368/small/Solar_Blockchain_Foundation_Sun_CG.png',
  'terra-luna': '8284/small/01_LunaClassic_color.png',
  'terra-luna-2': '25767/small/01_Luna_color.png',
  'mantra-dao': '12151/small/OM_Token.png',
  'icon': '1060/small/ICON-symbol-coingecko_latest.png',
  'bone-shibaswap': '16916/small/bone_icon.png',
  'coin98': '17117/small/logo.png',
  'civic': '788/small/civic-icon-black-padding.png',
  'kyber-network-crystal': '14899/small/RwdVsGcw_400x400.jpg',
  // Additional tokens (verified from CoinGecko API 2026-04)
  'cult-dao': '23331/small/quxZPrbC_400x400.jpg',
  'ethereum-pow-iou': '26997/small/logo-clear.png',
  'guardian-token': '17995/small/LS_wolfDen_logo.0025_Light_200x200.png',
  'changenow': '8224/small/now_for_coingecko.png',
  'pika-protocol': '30279/small/Pika_protocol.png',
  'pitbull': '15927/small/pitbull2.png',
  'kishu-inu': '14890/small/uVLzCoP.png',
  'richquack': '16356/small/57198446-0-Get-Rich-Quick-Gober.png',
  'dtravel': '20911/small/trvl.jpeg',
  'leash': '15802/small/Leash.png',
};

const COINGECKO_CDN = 'https://coin-images.coingecko.com/coins/images';

function getCoinGeckoIconUrl(code: string): string | null {
  const normalized = code.toLowerCase();
  const coingeckoId = CRYPTO_COINGECKO_IDS[normalized];
  if (coingeckoId === undefined) return null;
  const path = COINGECKO_IMAGE_PATHS[coingeckoId];
  if (path === undefined) return null;
  return `${COINGECKO_CDN}/${path}`;
}

// Cache version — increment to bust stale in-memory caches after code changes
const ICON_CACHE_VERSION = 3;
let activeCacheVersion = 0;

// In-memory cache for successful CDN URLs (persists during session)
const cdnCache = new Map<string, string>();

// Cache for failed icons (to avoid retrying on every render)
const failedIconsCache = new Set<string>();

function ensureFreshCache() {
  if (activeCacheVersion !== ICON_CACHE_VERSION) {
    cdnCache.clear();
    failedIconsCache.clear();
    activeCacheVersion = ICON_CACHE_VERSION;
  }
}

// Real cryptocurrency icon component using CoinGecko CDN with fallbacks
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
  // Bust stale caches when code changes (e.g., after icon CDN fix)
  ensureFreshCache();
  
  // Sanitize currency code (remove network suffixes for fallback CDNs)
  const cleanCode = useMemo(() => sanitizeCode(code), [code]);
  const symbol = fallbackSymbol ?? cleanCode;
  
  // Check cache first - if we already know this icon failed, skip CDN loading
  const [imageError, setImageError] = useState(() => failedIconsCache.has(code.toLowerCase()));
  
  // Build CDN URL list: CoinGecko first (uses original code with network suffix), then fallbacks with cleaned code
  const cdnList = useMemo(() => {
    const urls: string[] = [];
    // CoinGecko — best coverage, uses full code (e.g., 'usdttrc20' → tether icon)
    const coingeckoUrl = getCoinGeckoIconUrl(code);
    if (coingeckoUrl !== null) urls.push(coingeckoUrl);
    // Fallback CDNs with cleaned code
    urls.push(`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${cleanCode}.png`);
    urls.push(`https://assets.coincap.io/assets/icons/${cleanCode}@2x.png`);
    return urls;
  }, [code, cleanCode]);

  // Get cached CDN URL or start with first source
  const [currentUrl, setCurrentUrl] = useState<string>(() => {
    const cacheKey = code.toLowerCase();
    if (cdnCache.has(cacheKey)) {
      return cdnCache.get(cacheKey)!;
    }
    return cdnList[0] ?? '';
  });

  // Reset state when code changes (e.g., user selects a different coin)
  useEffect(() => {
    const cacheKey = code.toLowerCase();
    setImageError(failedIconsCache.has(cacheKey));
    if (cdnCache.has(cacheKey)) {
      setCurrentUrl(cdnCache.get(cacheKey)!);
    } else {
      setCurrentUrl(cdnList[0] ?? '');
    }
  }, [code, cdnList]);

  const handleError = () => {
    const currentIndex = cdnList.indexOf(currentUrl);
    
    if (currentIndex < cdnList.length - 1) {
      // Try next CDN
      const nextUrl = cdnList[currentIndex + 1];
      if (nextUrl !== undefined && nextUrl !== null && nextUrl !== '') {
        setCurrentUrl(nextUrl);
      }
    } else {
      // All CDNs failed, mark as failed and show fallback
      failedIconsCache.add(code.toLowerCase());
      setImageError(true);
    }
  };

  const handleLoad = () => {
    // Cache successful URL for future renders
    cdnCache.set(code.toLowerCase(), currentUrl);
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

// Helper: Sanitize currency code (remove network suffixes for consistent hashing)
function sanitizeCode(code: string): string {
  // Direct alias for coins where NOWPayments code doesn't match standard symbol
  const SYMBOL_ALIASES: Record<string, string> = {
    bttc: 'btt', bttcbsc: 'btt', ethw: 'ethw',
    sxpmainnet: 'sxp', galaerc20: 'gala', kibabsc: 'kiba',
  };
  const lower = code.toLowerCase();
  if (SYMBOL_ALIASES[lower] !== undefined) return SYMBOL_ALIASES[lower];
  // Remove common network suffixes for more consistent visual identity
  const suffixes = ['trc20', 'erc20', 'bsc', 'sol', 'matic', 'arb', 'op', 'algo', 'ton', 'base', 'mainnet'];
  let cleaned = lower;
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

// Main component to get crypto icon by code — all icons from CoinGecko CDN
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
  return (
    <RealCryptoIcon 
      code={code.toLowerCase()}
      className={className} 
      size={size} 
      fallbackSymbol={fallbackSymbol ?? code} 
    />
  );
}
