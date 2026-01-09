/**
 * Supported Cryptocurrencies for BitLoot Payments
 * 
 * All currencies supported by NOWPayments Sandbox API (124 currencies)
 * Last updated: January 9, 2026
 * 
 * @see https://api-sandbox.nowpayments.io/v1/currencies
 */

export interface CryptoCurrency {
  code: string;
  name: string;
  symbol: string;
  network?: string;
  category: 'popular' | 'stablecoin' | 'other';
  icon?: string;
}

/**
 * Popular Coins - Most commonly used cryptocurrencies
 * Shown first in the payment selector
 */
export const POPULAR_COINS: CryptoCurrency[] = [
  { code: 'btc', name: 'Bitcoin', symbol: 'BTC', category: 'popular' },
  { code: 'eth', name: 'Ethereum', symbol: 'ETH', category: 'popular' },
  { code: 'ltc', name: 'Litecoin', symbol: 'LTC', category: 'popular' },
  { code: 'sol', name: 'Solana', symbol: 'SOL', category: 'popular' },
  { code: 'xrp', name: 'Ripple', symbol: 'XRP', category: 'popular' },
  { code: 'ada', name: 'Cardano', symbol: 'ADA', category: 'popular' },
  { code: 'doge', name: 'Dogecoin', symbol: 'DOGE', category: 'popular' },
  { code: 'matic', name: 'Polygon', symbol: 'MATIC', category: 'popular' },
  { code: 'avax', name: 'Avalanche', symbol: 'AVAX', category: 'popular' },
  { code: 'bch', name: 'Bitcoin Cash', symbol: 'BCH', category: 'popular' },
  { code: 'trx', name: 'Tron', symbol: 'TRX', category: 'popular' },
  { code: 'xmr', name: 'Monero', symbol: 'XMR', category: 'popular' },
  { code: 'ton', name: 'Toncoin', symbol: 'TON', category: 'popular' },
  { code: 'bnbbsc', name: 'BNB (BSC)', symbol: 'BNB', network: 'BSC', category: 'popular' },
];

/**
 * Stablecoins - USD-pegged and other stable assets
 * Popular for avoiding volatility
 */
export const STABLECOINS: CryptoCurrency[] = [
  // USDT variants (NOWPayments supported)
  { code: 'usdttrc20', name: 'Tether (TRC20)', symbol: 'USDT', network: 'TRX', category: 'stablecoin' },
  { code: 'usdterc20', name: 'Tether (ERC20)', symbol: 'USDT', network: 'ETH', category: 'stablecoin' },
  { code: 'usdtbsc', name: 'Tether (BSC)', symbol: 'USDT', network: 'BSC', category: 'stablecoin' },
  { code: 'usdtsol', name: 'Tether (Solana)', symbol: 'USDT', network: 'SOL', category: 'stablecoin' },
  
  // USDC variants
  { code: 'usdc', name: 'USD Coin', symbol: 'USDC', network: 'ETH', category: 'stablecoin' },
  { code: 'usdcmatic', name: 'USD Coin (Polygon)', symbol: 'USDC', network: 'MATIC', category: 'stablecoin' },
  
  // BUSD variants
  { code: 'busdbsc', name: 'Binance USD (BSC)', symbol: 'BUSD', network: 'BSC', category: 'stablecoin' },
  
  // USDD
  { code: 'usddtrc20', name: 'USDD (TRC20)', symbol: 'USDD', network: 'TRX', category: 'stablecoin' },
  
  // DAI
  { code: 'dai', name: 'Dai', symbol: 'DAI', network: 'ETH', category: 'stablecoin' },
  
  // Others
  { code: 'tusd', name: 'TrueUSD', symbol: 'TUSD', network: 'ETH', category: 'stablecoin' },
  { code: 'usdp', name: 'Pax Dollar', symbol: 'USDP', network: 'ETH', category: 'stablecoin' },
];

/**
 * Other Cryptocurrencies (NOWPayments Sandbox API - Remaining 99 currencies)
 * Note: Popular coins and stablecoins are in separate arrays above
 */
export const OTHER_CURRENCIES: CryptoCurrency[] = [
  // A (9 currencies)
  { code: '1inch', name: '1inch', symbol: '1INCH', network: 'ETH', category: 'other' },
  { code: 'aave', name: 'Aave', symbol: 'AAVE', network: 'ETH', category: 'other' },
  { code: 'algo', name: 'Algorand', symbol: 'ALGO', category: 'other' },
  { code: 'ape', name: 'ApeCoin', symbol: 'APE', network: 'ETH', category: 'other' },
  { code: 'arpa', name: 'ARPA Chain', symbol: 'ARPA', network: 'ETH', category: 'other' },
  { code: 'atom', name: 'Cosmos', symbol: 'ATOM', category: 'other' },
  { code: 'avabsc', name: 'Travala (BSC)', symbol: 'AVA', network: 'BSC', category: 'other' },
  { code: 'avaxc', name: 'Avalanche (C-Chain)', symbol: 'AVAX', network: 'AVAX C', category: 'other' },
  { code: 'axs', name: 'Axie Infinity', symbol: 'AXS', network: 'ETH', category: 'other' },
  
  // B (6 currencies)
  { code: 'babydoge', name: 'Baby Doge Coin', symbol: 'BABYDOGE', network: 'BSC', category: 'other' },
  { code: 'bat', name: 'Basic Attention Token', symbol: 'BAT', network: 'ETH', category: 'other' },
  { code: 'bel', name: 'Bella Protocol', symbol: 'BEL', network: 'ETH', category: 'other' },
  { code: 'bone', name: 'Bone ShibaSwap', symbol: 'BONE', network: 'ETH', category: 'other' },
  { code: 'bttc', name: 'BitTorrent-New (TRC 20)', symbol: 'BTTC', network: 'TRX', category: 'other' },
  { code: 'bttcbsc', name: 'BitTorrent-NEW (BSC)', symbol: 'BTTC', network: 'BSC', category: 'other' },
  
  // C (10 currencies)
  { code: 'c98', name: 'Coin98', symbol: 'C98', network: 'BSC', category: 'other' },
  { code: 'cake', name: 'PancakeSwap', symbol: 'CAKE', network: 'BSC', category: 'other' },
  { code: 'chr', name: 'Chromia', symbol: 'CHR', network: 'ETH', category: 'other' },
  { code: 'chz', name: 'Chiliz', symbol: 'CHZ', network: 'ETH', category: 'other' },
  { code: 'coti', name: 'COTI', symbol: 'COTI', network: 'ETH', category: 'other' },
  { code: 'cro', name: 'Cronos', symbol: 'CRO', network: 'ETH', category: 'other' },
  { code: 'ctsi', name: 'Cartesi', symbol: 'CTSI', network: 'ETH', category: 'other' },
  { code: 'cult', name: 'Cult DAO', symbol: 'CULT', network: 'ETH', category: 'other' },
  { code: 'cvc', name: 'Civic', symbol: 'CVC', network: 'ETH', category: 'other' },
  
  // D (5 currencies)
  { code: 'dao', name: 'DAO Maker', symbol: 'DAO', network: 'ETH', category: 'other' },
  { code: 'dash', name: 'Dash', symbol: 'DASH', category: 'other' },
  { code: 'dcr', name: 'Decred', symbol: 'DCR', category: 'other' },
  { code: 'dgb', name: 'DigiByte', symbol: 'DGB', category: 'other' },
  { code: 'dgmoon', name: 'DogeMoon', symbol: 'DGMOON', network: 'BSC', category: 'other' },
  
  // E (4 currencies)
  { code: 'egld', name: 'MultiversX', symbol: 'EGLD', category: 'other' },
  { code: 'etc', name: 'Ethereum Classic', symbol: 'ETC', category: 'other' },
  { code: 'ethbsc', name: 'Ethereum (BSC)', symbol: 'ETH', network: 'BSC', category: 'other' },
  { code: 'ethw', name: 'EthereumPoW', symbol: 'ETHW', category: 'other' },
  
  // F (6 currencies)
  { code: 'fil', name: 'Filecoin', symbol: 'FIL', category: 'other' },
  { code: 'floki', name: 'Floki (ERC20)', symbol: 'FLOKI', network: 'ETH', category: 'other' },
  { code: 'flokibsc', name: 'Floki (BSC)', symbol: 'FLOKI', network: 'BSC', category: 'other' },
  { code: 'fluf', name: 'Fluffy Coin', symbol: 'FLUF', network: 'BSC', category: 'other' },
  { code: 'ftt', name: 'FTX Token', symbol: 'FTT', network: 'ETH', category: 'other' },
  { code: 'fun', name: 'FUNToken', symbol: 'FUN', network: 'ETH', category: 'other' },
  
  // G (5 currencies)
  { code: 'gafa', name: 'Gafa', symbol: 'GAFA', network: 'BSC', category: 'other' },
  { code: 'galaerc20', name: 'Gala Games', symbol: 'GALA', network: 'ETH', category: 'other' },
  { code: 'grt', name: 'The Graph', symbol: 'GRT', network: 'ETH', category: 'other' },
  { code: 'gt', name: 'Gatechain Token', symbol: 'GT', network: 'ETH', category: 'other' },
  { code: 'guard', name: 'Guardian', symbol: 'GUARD', network: 'BSC', category: 'other' },
  
  // H (3 currencies)
  { code: 'hbar', name: 'Hedera Hashgraph', symbol: 'HBAR', category: 'other' },
  { code: 'hoge', name: 'HOGE', symbol: 'HOGE', network: 'ETH', category: 'other' },
  { code: 'hot', name: 'Holo', symbol: 'HOT', network: 'ETH', category: 'other' },
  
  // I (3 currencies)
  { code: 'icx', name: 'ICON', symbol: 'ICX', category: 'other' },
  { code: 'ilv', name: 'Illuvium', symbol: 'ILV', network: 'ETH', category: 'other' },
  { code: 'iotx', name: 'IoTeX', symbol: 'IOTX', category: 'other' },
  
  // K (4 currencies)
  { code: 'keanu', name: 'KEANU', symbol: 'KEANU', network: 'ETH', category: 'other' },
  { code: 'kibabsc', name: 'Kiba Inu (BSC)', symbol: 'KIBA', network: 'BSC', category: 'other' },
  { code: 'kishu', name: 'KISHU', symbol: 'KISHU', network: 'ETH', category: 'other' },
  { code: 'knc', name: 'Kyber Network Crystal', symbol: 'KNC', network: 'ETH', category: 'other' },
  
  // L (4 currencies)
  { code: 'leash', name: 'Doge Killer', symbol: 'LEASH', network: 'ETH', category: 'other' },
  { code: 'link', name: 'Chainlink', symbol: 'LINK', network: 'ETH', category: 'other' },
  { code: 'luna', name: 'Terra', symbol: 'LUNA', category: 'other' },
  { code: 'lunc', name: 'Terra Classic', symbol: 'LUNC', category: 'other' },
  
  // M (3 currencies)
  { code: 'mana', name: 'Decentraland', symbol: 'MANA', network: 'ETH', category: 'other' },
  { code: 'maticmainnet', name: 'Polygon', symbol: 'MATIC', network: 'POLYGON', category: 'other' },
  { code: 'mx', name: 'MX Token', symbol: 'MX', network: 'ETH', category: 'other' },
  
  // N (5 currencies)
  { code: 'nano', name: 'Nano', symbol: 'XNO', category: 'other' },
  { code: 'near', name: 'NEAR', symbol: 'NEAR', category: 'other' },
  { code: 'nftb', name: 'NFTb', symbol: 'NFTB', network: 'BSC', category: 'other' },
  { code: 'now', name: 'ChangeNOW', symbol: 'NOW', network: 'ETH', category: 'other' },
  { code: 'nwc', name: 'NWC', symbol: 'NWC', network: 'ETH', category: 'other' },
  
  // O (4 currencies)
  { code: 'okb', name: 'OKB', symbol: 'OKB', network: 'ETH', category: 'other' },
  { code: 'om', name: 'OM', symbol: 'OM', network: 'ETH', category: 'other' },
  { code: 'omg', name: 'OMG Network', symbol: 'OMG', network: 'ETH', category: 'other' },
  { code: 'ont', name: 'Ontology', symbol: 'ONT', category: 'other' },
  
  // P (2 currencies)
  { code: 'pika', name: 'Pika', symbol: 'PIKA', network: 'ETH', category: 'other' },
  { code: 'pit', name: 'PITBULL', symbol: 'PIT', network: 'BSC', category: 'other' },
  
  // Q (2 currencies)
  { code: 'qtum', name: 'Qtum', symbol: 'QTUM', category: 'other' },
  { code: 'quack', name: 'RichQuack', symbol: 'QUACK', network: 'BSC', category: 'other' },
  
  // R (2 currencies)
  { code: 'raca', name: 'Radio Caca', symbol: 'RACA', network: 'BSC', category: 'other' },
  { code: 'rvn', name: 'Ravencoin', symbol: 'RVN', category: 'other' },
  
  // S (8 currencies)
  { code: 'sand', name: 'The Sandbox', symbol: 'SAND', network: 'ETH', category: 'other' },
  { code: 'sfund', name: 'Seedify.fund', symbol: 'SFUND', network: 'BSC', category: 'other' },
  { code: 'shib', name: 'Shiba Inu', symbol: 'SHIB', network: 'ETH', category: 'other' },
  { code: 'shibbsc', name: 'Shiba Inu (BSC)', symbol: 'SHIB', network: 'BSC', category: 'other' },
  { code: 'super', name: 'SUPER', symbol: 'SUPER', network: 'ETH', category: 'other' },
  { code: 'sxpmainnet', name: 'Solar Network', symbol: 'SXP', category: 'other' },
  
  // T (5 currencies)
  { code: 'tenshi', name: 'Tenshi', symbol: 'TENSHI', network: 'ETH', category: 'other' },
  { code: 'tfuel', name: 'Theta Fuel', symbol: 'TFUEL', network: 'THETA', category: 'other' },
  { code: 'theta', name: 'Theta', symbol: 'THETA', category: 'other' },
  { code: 'tko', name: 'Tokocrypto', symbol: 'TKO', network: 'BSC', category: 'other' },
  { code: 'trvl', name: 'DTravel', symbol: 'TRVL', network: 'ETH', category: 'other' },
  
  // U (1 currency)
  { code: 'uni', name: 'Uniswap', symbol: 'UNI', network: 'ETH', category: 'other' },
  
  // V (2 currencies)
  { code: 'vet', name: 'VeChain', symbol: 'VET', category: 'other' },
  { code: 'vib', name: 'VIB', symbol: 'VIB', network: 'ETH', category: 'other' },
  
  // W (1 currency)
  { code: 'waves', name: 'Waves', symbol: 'WAVES', category: 'other' },
  
  // X (5 currencies)
  { code: 'xdc', name: 'XDC Network', symbol: 'XDC', category: 'other' },
  { code: 'xlm', name: 'Stellar', symbol: 'XLM', category: 'other' },
  { code: 'xtz', name: 'Tezos', symbol: 'XTZ', category: 'other' },
  { code: 'xvg', name: 'Verge', symbol: 'XVG', category: 'other' },
  { code: 'xyo', name: 'XYO Network', symbol: 'XYO', network: 'ETH', category: 'other' },
  
  // Y (1 currency)
  { code: 'yfi', name: 'yearn.finance', symbol: 'YFI', network: 'ETH', category: 'other' },
  
  // Z (2 currencies)
  { code: 'zec', name: 'Zcash', symbol: 'ZEC', category: 'other' },
  { code: 'zil', name: 'Zilliqa', symbol: 'ZIL', category: 'other' },
];

/**
 * All supported currencies combined
 */
export const ALL_CURRENCIES: CryptoCurrency[] = [
  ...POPULAR_COINS,
  ...STABLECOINS,
  ...OTHER_CURRENCIES,
];

/**
 * Get currency by code
 */
export function getCurrencyByCode(code: string): CryptoCurrency | undefined {
  return ALL_CURRENCIES.find(c => c.code.toLowerCase() === code.toLowerCase());
}

/**
 * Get all currency codes as array (for Zod enum validation)
 */
export function getAllCurrencyCodes(): string[] {
  return ALL_CURRENCIES.map(c => c.code);
}

/**
 * Popular currencies for quick selection (top 20)
 */
export const QUICK_SELECT_CURRENCIES = [
  ...POPULAR_COINS.slice(0, 12),
  // Top stablecoins
  { code: 'usdttrc20', name: 'USDT (Tron)', symbol: 'USDT', network: 'TRX', category: 'stablecoin' as const },
  { code: 'usdterc20', name: 'USDT (Ethereum)', symbol: 'USDT', network: 'ETH', category: 'stablecoin' as const },
  { code: 'usdc', name: 'USDC (Ethereum)', symbol: 'USDC', network: 'ETH', category: 'stablecoin' as const },
  { code: 'usdtbsc', name: 'USDT (BSC)', symbol: 'USDT', network: 'BSC', category: 'stablecoin' as const },
];
