/**
 * Supported Cryptocurrencies for BitLoot Payments
 * 
 * All currencies supported by NOWPayments, organized by category and popularity.
 * Last updated: January 2026
 * 
 * @see https://nowpayments.io/currencies
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
  { code: 'trx', name: 'Tron', symbol: 'TRX', category: 'popular' },
  { code: 'ton', name: 'Toncoin', symbol: 'TON', category: 'popular' },
  { code: 'bnbbsc', name: 'Binance Coin (BSC)', symbol: 'BNB', network: 'BSC', category: 'popular' },
  { code: 'sol', name: 'Solana', symbol: 'SOL', category: 'popular' },
  { code: 'xrp', name: 'Ripple', symbol: 'XRP', category: 'popular' },
  { code: 'ada', name: 'Cardano', symbol: 'ADA', category: 'popular' },
  { code: 'doge', name: 'Dogecoin', symbol: 'DOGE', category: 'popular' },
  { code: 'dot', name: 'Polkadot', symbol: 'DOT', category: 'popular' },
  { code: 'xmr', name: 'Monero', symbol: 'XMR', category: 'popular' },
];

/**
 * Stablecoins - USD-pegged and other stable assets
 * Popular for avoiding volatility
 */
export const STABLECOINS: CryptoCurrency[] = [
  // USDT variants
  { code: 'usdttrc20', name: 'Tether USD (Tron)', symbol: 'USDT', network: 'TRX', category: 'stablecoin' },
  { code: 'usdterc20', name: 'Tether USD (Ethereum)', symbol: 'USDT', network: 'ETH', category: 'stablecoin' },
  { code: 'usdtbsc', name: 'Tether USD (BSC)', symbol: 'USDT', network: 'BSC', category: 'stablecoin' },
  { code: 'usdtsol', name: 'Tether USD (Solana)', symbol: 'USDT', network: 'SOLANA', category: 'stablecoin' },
  { code: 'usdtmatic', name: 'Tether USD (Polygon)', symbol: 'USDT', network: 'POLYGON', category: 'stablecoin' },
  { code: 'usdtarb', name: 'Tether (Arbitrum One)', symbol: 'USDT', network: 'Arbitrum', category: 'stablecoin' },
  { code: 'usdtop', name: 'Tether (Optimism)', symbol: 'USDT', network: 'OP', category: 'stablecoin' },
  { code: 'usdtalgo', name: 'Tether USD (Algorand)', symbol: 'USDT', network: 'ALGO', category: 'stablecoin' },
  { code: 'usdtton', name: 'Tether USD (TON)', symbol: 'USDT', network: 'TON', category: 'stablecoin' },
  { code: 'usdtxtz', name: 'Tether USD (Tezos)', symbol: 'USDT', network: 'XTZ', category: 'stablecoin' },
  { code: 'usdteos', name: 'Tether USD (EOS)', symbol: 'USDT', network: 'EOS', category: 'stablecoin' },
  { code: 'usdtdot', name: 'Tether (Polkadot)', symbol: 'USDT', network: 'Polkadot', category: 'stablecoin' },
  { code: 'usdtkava', name: 'Tether USD (KAVA)', symbol: 'USDT', network: 'KAVAEVM', category: 'stablecoin' },
  { code: 'usdtnear', name: 'Tether USD (Near)', symbol: 'USDT', network: 'NEAR', category: 'stablecoin' },
  { code: 'usdtarc20', name: 'Tether (AVAX C-CHAIN)', symbol: 'USDT', network: 'AVAX C', category: 'stablecoin' },
  { code: 'usdtcelo', name: 'Tether USD (CELO)', symbol: 'USDT', network: 'celo', category: 'stablecoin' },
  
  // USDC variants
  { code: 'usdc', name: 'USD Coin (Ethereum)', symbol: 'USDC', network: 'ETH', category: 'stablecoin' },
  { code: 'usdcmatic', name: 'USD Coin (Polygon)', symbol: 'USDC', network: 'POLYGON', category: 'stablecoin' },
  { code: 'usdcsol', name: 'USD Coin (Solana)', symbol: 'USDC', network: 'SOLANA', category: 'stablecoin' },
  { code: 'usdcbsc', name: 'USD Coin (Binance Smart Chain)', symbol: 'USDC', network: 'BSC', category: 'stablecoin' },
  { code: 'usdcarb', name: 'USD Coin Bridged (Arbitrum One)', symbol: 'USDC', network: 'Arbitrum', category: 'stablecoin' },
  { code: 'usdcop', name: 'USD Coin (Optimism)', symbol: 'USDC', network: 'OP', category: 'stablecoin' },
  { code: 'usdcalgo', name: 'USD Coin (Algorand)', symbol: 'USDC', network: 'ALGO', category: 'stablecoin' },
  { code: 'usdcxlm', name: 'USDC (Stellar)', symbol: 'USDC', network: 'XLM', category: 'stablecoin' },
  { code: 'usdckcc', name: 'USD Coin (KuCoin)', symbol: 'USDC', network: 'KCC', category: 'stablecoin' },
  { code: 'usdcarc20', name: 'USD Coin (AVAX C-CHAIN)', symbol: 'USDC', network: 'AVAX C', category: 'stablecoin' },
  { code: 'usdcbase', name: 'USD Coin (Base)', symbol: 'USDC', network: 'Base', category: 'stablecoin' },
  
  // BUSD variants
  { code: 'busdbsc', name: 'Binance USD', symbol: 'BUSD', network: 'BSC', category: 'stablecoin' },
  { code: 'busd', name: 'Binance USD', symbol: 'BUSD', network: 'ETH', category: 'stablecoin' },
  { code: 'busdmatic', name: 'Binance USD (Polygon)', symbol: 'BUSD', network: 'POLYGON', category: 'stablecoin' },
  
  // USDD variants
  { code: 'usddtrc20', name: 'USDD (TRC20)', symbol: 'USDD', network: 'TRX', category: 'stablecoin' },
  { code: 'usddbsc', name: 'USDD (Binance Smart Chain)', symbol: 'USDD', network: 'BSC', category: 'stablecoin' },
  
  // DAI variants
  { code: 'dai', name: 'DAI', symbol: 'DAI', network: 'ETH', category: 'stablecoin' },
  { code: 'daiarb', name: 'DAI (Arbitrum)', symbol: 'DAI', network: 'Arbitrum', category: 'stablecoin' },
  
  // Other stablecoins
  { code: 'tusd', name: 'TrueUSD', symbol: 'TUSD', network: 'ETH', category: 'stablecoin' },
  { code: 'tusdtrc20', name: 'TrueUSD (Tron)', symbol: 'TUSD', network: 'TRX', category: 'stablecoin' },
  { code: 'usdp', name: 'Pax Dollar', symbol: 'USDP', network: 'ETH', category: 'stablecoin' },
  { code: 'pyusd', name: 'PayPal USD', symbol: 'PYUSD', network: 'ETH', category: 'stablecoin' },
  { code: 'gusd', name: 'Gemini Dollar', symbol: 'GUSD', network: 'ETH', category: 'stablecoin' },
  { code: 'cusd', name: 'Celo Dollar', symbol: 'CUSD', network: 'celo', category: 'stablecoin' },
  { code: 'fdusderc20', name: 'First Digital USD', symbol: 'FDUSD', network: 'ETH', category: 'stablecoin' },
  { code: 'fdusdbsc', name: 'First Digital USD (Binance Smart Chain)', symbol: 'FDUSD', network: 'BSC', category: 'stablecoin' },
  { code: 'usde', name: 'Ethena USDe', symbol: 'USDe', network: 'ETH', category: 'stablecoin' },
  { code: 'usdssol', name: 'USDS (Solana)', symbol: 'USDS', network: 'SOLANA', category: 'stablecoin' },
  { code: 'usdr', name: 'StablR USD', symbol: 'USDR', network: 'ETH', category: 'stablecoin' },
  { code: 'eurr', name: 'StablR Euro', symbol: 'EURR', network: 'ETH', category: 'stablecoin' },
  { code: 'eurt', name: 'EURO Tether', symbol: 'EURT', network: 'ETH', category: 'stablecoin' },
  { code: 'xaut', name: 'Tether Gold', symbol: 'XAUT', network: 'ETH', category: 'stablecoin' },
];

/**
 * Other Cryptocurrencies - Full list organized alphabetically
 */
export const OTHER_CURRENCIES: CryptoCurrency[] = [
  // A
  { code: '1inch', name: '1inch Network', symbol: '1INCH', network: 'ETH', category: 'other' },
  { code: '1inchbsc', name: '1Inch Network (BSC)', symbol: '1INCH', network: 'BSC', category: 'other' },
  { code: 'aave', name: 'Aave', symbol: 'AAVE', network: 'ETH', category: 'other' },
  { code: 'ae', name: 'Aeternity', symbol: 'AE', category: 'other' },
  { code: 'algo', name: 'Algorand', symbol: 'ALGO', category: 'other' },
  { code: 'ape', name: 'ApeCoin', symbol: 'APE', network: 'ETH', category: 'other' },
  { code: 'apt', name: 'Aptos', symbol: 'APT', category: 'other' },
  { code: 'arb', name: 'Arbitrum', symbol: 'ARB', network: 'Arbitrum', category: 'other' },
  { code: 'ark', name: 'Ark', symbol: 'ARK', category: 'other' },
  { code: 'arpa', name: 'ARPA Chain', symbol: 'ARPA', network: 'ETH', category: 'other' },
  { code: 'arpabsc', name: 'ARPA (Binance Smart Chain)', symbol: 'ARPA', network: 'BSC', category: 'other' },
  { code: 'arv', name: 'Ariva', symbol: 'ARV', network: 'BSC', category: 'other' },
  { code: 'atlas', name: 'Star Atlas', symbol: 'ATLAS', network: 'SOLANA', category: 'other' },
  { code: 'atom', name: 'Cosmos', symbol: 'ATOM', category: 'other' },
  { code: 'avax', name: 'Avalanche X-Chain', symbol: 'AVAX', network: 'AVAX X', category: 'other' },
  { code: 'avaxc', name: 'Avalanche (C-Chain)', symbol: 'AVAX', network: 'AVAX C', category: 'other' },
  { code: 'avn', name: 'AVNRich', symbol: 'AVN', network: 'BSC', category: 'other' },
  { code: 'axs', name: 'Axie Infinity', symbol: 'AXS', network: 'ETH', category: 'other' },
  
  // B
  { code: 'babydoge', name: 'Baby Doge Coin', symbol: 'BABYDOGE', network: 'BSC', category: 'other' },
  { code: 'bad', name: 'Bad Idea AI', symbol: 'BAD', network: 'ETH', category: 'other' },
  { code: 'banana', name: 'Banana Gun', symbol: 'BANANA', network: 'ETH', category: 'other' },
  { code: 'bat', name: 'Basic Attention Token', symbol: 'BAT', network: 'ETH', category: 'other' },
  { code: 'bch', name: 'Bitcoin Cash', symbol: 'BCH', category: 'other' },
  { code: 'bcd', name: 'Bitcoin Diamond', symbol: 'BCD', category: 'other' },
  { code: 'befi', name: 'BeFi Labs', symbol: 'BEFI', network: 'ETH', category: 'other' },
  { code: 'bel', name: 'Bella Protocol', symbol: 'BEL', network: 'ETH', category: 'other' },
  { code: 'belbsc', name: 'Bella Protocol (Binance Smart Chain)', symbol: 'BEL', network: 'BSC', category: 'other' },
  { code: 'bera', name: 'Berachain', symbol: 'BERA', category: 'other' },
  { code: 'bifierc20', name: 'Beefy (Ethereum)', symbol: 'BIFI', network: 'ETH', category: 'other' },
  { code: 'blocks', name: 'BLOCKS', symbol: 'BLOCKS', network: 'ETH', category: 'other' },
  { code: 'bnbmainnet', name: 'Binance Coin Mainnet', symbol: 'BNB', network: 'BEP2', category: 'other' },
  { code: 'boba', name: 'Boba Network', symbol: 'BOBA', network: 'ETH', category: 'other' },
  { code: 'bone', name: 'Bone ShibaSwap', symbol: 'BONE', network: 'ETH', category: 'other' },
  { code: 'brettbase', name: 'Brett (Based)', symbol: 'BRETT', network: 'Base', category: 'other' },
  { code: 'brgbsc', name: 'Bridge Oracle', symbol: 'BRG', network: 'BSC', category: 'other' },
  { code: 'brise', name: 'Bitgert', symbol: 'BRISE', network: 'BSC', category: 'other' },
  { code: 'brisemainnet', name: 'Bitgert Mainnet', symbol: 'BRISE', category: 'other' },
  { code: 'bsv', name: 'Bitcoin SV', symbol: 'BSV', category: 'other' },
  { code: 'btfa', name: 'Banana Task Force Ape', symbol: 'BTFA', network: 'ETH', category: 'other' },
  { code: 'btg', name: 'Bitcoin Gold', symbol: 'BTG', category: 'other' },
  { code: 'bttc', name: 'BitTorrent-New (TRC 20)', symbol: 'BTTC', network: 'TRX', category: 'other' },
  { code: 'bttcbsc', name: 'BitTorrent-NEW (Binance Smart Chain)', symbol: 'BTTC', network: 'BSC', category: 'other' },
  
  // C
  { code: 'c98', name: 'Coin98', symbol: 'C98', network: 'BSC', category: 'other' },
  { code: 'cake', name: 'PancakeSwap', symbol: 'CAKE', network: 'BSC', category: 'other' },
  { code: 'cati', name: 'Catizen', symbol: 'CATI', network: 'TON', category: 'other' },
  { code: 'catston', name: 'Cats', symbol: 'CATS', network: 'TON', category: 'other' },
  { code: 'cfx', name: 'Conflux (BSC)', symbol: 'CFX', network: 'BSC', category: 'other' },
  { code: 'cfxmainnet', name: 'Conflux', symbol: 'CFX', category: 'other' },
  { code: 'cgpt', name: 'ChainGPT (Ethereum)', symbol: 'CGPT', network: 'ETH', category: 'other' },
  { code: 'cgptbsc', name: 'ChainGPT (Binance Smart Chain)', symbol: 'CGPT', network: 'BSC', category: 'other' },
  { code: 'chr', name: 'Chromia', symbol: 'CHR', network: 'ETH', category: 'other' },
  { code: 'chz', name: 'Chiliz', symbol: 'CHZ', network: 'ETH', category: 'other' },
  { code: 'cns', name: 'CentricSwap', symbol: 'CNS', network: 'BSC', category: 'other' },
  { code: 'coti', name: 'COTI', symbol: 'COTI', network: 'ETH', category: 'other' },
  { code: 'cro', name: 'Cronos', symbol: 'CRO', network: 'ETH', category: 'other' },
  { code: 'cromainnet', name: 'Cronos (Mainnet)', symbol: 'CRO', network: 'Cosmos CRO', category: 'other' },
  { code: 'cspr', name: 'Casper (Mainnet)', symbol: 'CSPR', category: 'other' },
  { code: 'cswap', name: 'ChainSwap', symbol: 'CSWAP', network: 'ETH', category: 'other' },
  { code: 'ctsi', name: 'Cartesi', symbol: 'CTSI', network: 'ETH', category: 'other' },
  { code: 'cudos', name: 'Cudos', symbol: 'CUDOS', network: 'ETH', category: 'other' },
  { code: 'cult', name: 'Cult DAO', symbol: 'CULT', network: 'ETH', category: 'other' },
  { code: 'cvc', name: 'Civic', symbol: 'CVC', network: 'ETH', category: 'other' },
  
  // D
  { code: 'daddy', name: 'Daddy Tate', symbol: 'DADDY', network: 'SOLANA', category: 'other' },
  { code: 'dao', name: 'DAO Maker', symbol: 'DAO', network: 'ETH', category: 'other' },
  { code: 'dash', name: 'Dash', symbol: 'DASH', category: 'other' },
  { code: 'dcr', name: 'Decred', symbol: 'DCR', category: 'other' },
  { code: 'dgb', name: 'DigiByte', symbol: 'DGB', category: 'other' },
  { code: 'dgd', name: 'DigixDAO', symbol: 'DGD', network: 'ETH', category: 'other' },
  { code: 'dgmoon', name: 'DogeMoon', symbol: 'DGMOON', network: 'BSC', category: 'other' },
  { code: 'dgi', name: 'DGI Game', symbol: 'DGI', network: 'ETH', category: 'other' },
  { code: 'dino', name: 'DinoLFG', symbol: 'DINO', network: 'ETH', category: 'other' },
  { code: 'divi', name: 'Divi', symbol: 'DIVI', category: 'other' },
  { code: 'dogecoin', name: 'Buff Doge Coin', symbol: 'DOGECOIN', network: 'BSC', category: 'other' },
  { code: 'dogs', name: 'Dogs', symbol: 'DOGS', network: 'TON', category: 'other' },
  
  // E
  { code: 'egld', name: 'MultiversX', symbol: 'EGLD', category: 'other' },
  { code: 'egldbsc', name: 'MultiversX (Binance Smart Chain)', symbol: 'EGLD', network: 'BSC', category: 'other' },
  { code: 'enj', name: 'Enjin Coin', symbol: 'ENJ', network: 'ETH', category: 'other' },
  { code: 'eos', name: 'EOS', symbol: 'EOS', category: 'other' },
  { code: 'epic', name: 'EpicCash', symbol: 'EPIC', category: 'other' },
  { code: 'etc', name: 'Ethereum Classic', symbol: 'ETC', category: 'other' },
  { code: 'etharb', name: 'Ethereum (Arbitrum)', symbol: 'ETH', network: 'Arbitrum', category: 'other' },
  { code: 'ethbase', name: 'Ethereum (Base)', symbol: 'ETH', network: 'Base', category: 'other' },
  { code: 'ethbsc', name: 'Ethereum (Binance Smart Chain)', symbol: 'ETH', network: 'BSC', category: 'other' },
  { code: 'ethlna', name: 'Ethereum (Linea)', symbol: 'ETH', network: 'lna', category: 'other' },
  { code: 'ethw', name: 'EthereumPoW', symbol: 'ETHW', category: 'other' },
  
  // F
  { code: 'feg', name: 'FEG Token', symbol: 'FEG', network: 'ETH', category: 'other' },
  { code: 'fil', name: 'Filecoin', symbol: 'FIL', category: 'other' },
  { code: 'fitfi', name: 'Step App (AVAXC)', symbol: 'FITFI', network: 'AVAX C', category: 'other' },
  { code: 'floki', name: 'Floki (ERC20)', symbol: 'FLOKI', network: 'ETH', category: 'other' },
  { code: 'flokibsc', name: 'Floki (BSC)', symbol: 'FLOKI', network: 'BSC', category: 'other' },
  { code: 'fluf', name: 'Fluffy Coin', symbol: 'FLUF', network: 'BSC', category: 'other' },
  { code: 'front', name: 'Frontier', symbol: 'FRONT', network: 'ETH', category: 'other' },
  { code: 'ftm', name: 'Fantom (ERC20)', symbol: 'FTM', network: 'ETH', category: 'other' },
  { code: 'ftmmainnet', name: 'Fantom (Mainnet)', symbol: 'FTM', category: 'other' },
  { code: 'ftn', name: 'Fasttoken (Bahamut)', symbol: 'FTN', category: 'other' },
  { code: 'ftt', name: 'FTX Token', symbol: 'FTT', network: 'ETH', category: 'other' },
  { code: 'fun', name: 'FUNToken', symbol: 'FUN', network: 'ETH', category: 'other' },
  
  // G
  { code: 'gafa', name: 'Gafa', symbol: 'GAFA', network: 'BSC', category: 'other' },
  { code: 'gal', name: 'Project Galaxy', symbol: 'GAL', network: 'BSC', category: 'other' },
  { code: 'galaerc20', name: 'Gala Games', symbol: 'GALA', network: 'ETH', category: 'other' },
  { code: 'gari', name: 'Gari', symbol: 'GARI', network: 'SOLANA', category: 'other' },
  { code: 'gas', name: 'NeoGas', symbol: 'GAS', network: 'neo', category: 'other' },
  { code: 'gbsc', name: 'Gravity (Binance Smart Chain)', symbol: 'G', network: 'BSC', category: 'other' },
  { code: 'gerc20', name: 'Gravity', symbol: 'G', network: 'ETH', category: 'other' },
  { code: 'geth', name: 'Guarded Ether (ERC20)', symbol: 'GETH', network: 'ETH', category: 'other' },
  { code: 'ggtkn', name: 'GG TOKEN', symbol: 'GGTKN', network: 'BSC', category: 'other' },
  { code: 'ghc', name: 'Galaxy Heroes Coin', symbol: 'GHC', network: 'BSC', category: 'other' },
  { code: 'gmx', name: 'GMX (AVAX C-CHAIN)', symbol: 'GMX', network: 'AVAX C', category: 'other' },
  { code: 'gmxarb', name: 'GMX (Arbitrum One)', symbol: 'GMX', network: 'Arbitrum', category: 'other' },
  { code: 'grape', name: 'GrapeCoin', symbol: 'GRAPE', network: 'BSC', category: 'other' },
  { code: 'grs', name: 'Groestlcoin', symbol: 'GRS', category: 'other' },
  { code: 'grt', name: 'The Graph', symbol: 'GRT', network: 'ETH', category: 'other' },
  { code: 'gspi', name: 'Shopping.io Governance', symbol: 'GSPI', network: 'BSC', category: 'other' },
  { code: 'gt', name: 'Gatechain Token', symbol: 'GT', network: 'ETH', category: 'other' },
  { code: 'guard', name: 'Guardian', symbol: 'GUARD', network: 'BSC', category: 'other' },
  
  // H
  { code: 'hbar', name: 'Hedera Hashgraph', symbol: 'HBAR', category: 'other' },
  { code: 'hex', name: 'Hex', symbol: 'HEX', network: 'ETH', category: 'other' },
  { code: 'hmstr', name: 'Hamster Combat', symbol: 'HMSTR', network: 'TON', category: 'other' },
  { code: 'hoge', name: 'HOGE', symbol: 'HOGE', network: 'ETH', category: 'other' },
  { code: 'hot', name: 'Holo', symbol: 'HOT', network: 'ETH', category: 'other' },
  { code: 'hotcross', name: 'Hot Cross', symbol: 'HOTCROSS', network: 'BSC', category: 'other' },
  { code: 'ht', name: 'Huobi Token', symbol: 'HT', network: 'ETH', category: 'other' },
  { code: 'hype', name: 'Hyperliquid', symbol: 'HYPE', category: 'other' },
  
  // I
  { code: 'icx', name: 'ICON', symbol: 'ICX', category: 'other' },
  { code: 'id', name: 'Space ID', symbol: 'SPACE-ID', network: 'ETH', category: 'other' },
  { code: 'idbsc', name: 'Space ID', symbol: 'SPACE-ID', network: 'BSC', category: 'other' },
  { code: 'ilv', name: 'Illuvium', symbol: 'ILV', network: 'ETH', category: 'other' },
  { code: 'inj', name: 'Injective Protocol (Binance Smart Chain)', symbol: 'INJ', network: 'BSC', category: 'other' },
  { code: 'injerc20', name: 'Injective (ERC20)', symbol: 'INJ', network: 'ETH', category: 'other' },
  { code: 'injmainnet', name: 'Injective Protocol', symbol: 'INJ', category: 'other' },
  { code: 'iota', name: 'IOTA', symbol: 'IOTA', category: 'other' },
  { code: 'iotx', name: 'IoTeX', symbol: 'IOTX', category: 'other' },
  { code: 'ipmb', name: 'IPMB Token (Polygon)', symbol: 'IPMB', network: 'POLYGON', category: 'other' },
  
  // J
  { code: 'jasmy', name: 'JasmyCoin', symbol: 'JASMY', network: 'ETH', category: 'other' },
  { code: 'jetton', name: 'JetTon Games', symbol: 'JETTON', network: 'TON', category: 'other' },
  { code: 'jst', name: 'Just', symbol: 'JST', network: 'TRX', category: 'other' },
  
  // K
  { code: 'kaia', name: 'Kaia', symbol: 'KAIA', category: 'other' },
  { code: 'kas', name: 'Kaspa', symbol: 'KAS', category: 'other' },
  { code: 'keanu', name: 'KEANU', symbol: 'KEANU', network: 'ETH', category: 'other' },
  { code: 'kiba', name: 'Kiba Inu (ERC20)', symbol: 'KIBA', network: 'ETH', category: 'other' },
  { code: 'kibabsc', name: 'Kiba Inu (BSC)', symbol: 'KIBA', network: 'BSC', category: 'other' },
  { code: 'kishu', name: 'KISHU', symbol: 'KISHU', network: 'ETH', category: 'other' },
  { code: 'klay', name: 'Klaytn', symbol: 'KLAY', category: 'other' },
  { code: 'klv', name: 'Klever', symbol: 'KLV', network: 'TRX', category: 'other' },
  { code: 'klvmainnet', name: 'Klever', symbol: 'KLV', category: 'other' },
  { code: 'kmd', name: 'Komodo', symbol: 'KMD', category: 'other' },
  { code: 'knc', name: 'Kyber Network Crystal', symbol: 'KNC', network: 'ETH', category: 'other' },
  
  // L
  { code: 'lbperc20', name: 'Launchblock.com', symbol: 'LBP', network: 'ETH', category: 'other' },
  { code: 'leash', name: 'Doge Killer', symbol: 'LEASH', network: 'ETH', category: 'other' },
  { code: 'lgcy', name: 'LGCY Network', symbol: 'LGCY', network: 'ETH', category: 'other' },
  { code: 'lingo', name: 'Lingo', symbol: 'LINGO', network: 'Base', category: 'other' },
  { code: 'link', name: 'Chainlink', symbol: 'LINK', network: 'ETH', category: 'other' },
  { code: 'lnq', name: 'LinqAI', symbol: 'LNQ', network: 'ETH', category: 'other' },
  { code: 'lsk', name: 'Lisk', symbol: 'LSK', category: 'other' },
  { code: 'luna', name: 'Terra', symbol: 'LUNA', category: 'other' },
  { code: 'lunc', name: 'Terra Classic', symbol: 'LUNC', category: 'other' },
  
  // M
  { code: 'major', name: 'Major', symbol: 'MAJOR', network: 'TON', category: 'other' },
  { code: 'mana', name: 'Decentraland', symbol: 'MANA', network: 'ETH', category: 'other' },
  { code: 'marsh', name: 'Unmarshal', symbol: 'MARSH', network: 'BSC', category: 'other' },
  { code: 'matic', name: 'Matic (ERC20)', symbol: 'MATIC', network: 'ETH', category: 'other' },
  { code: 'maticmainnet', name: 'Polygon', symbol: 'MATIC', network: 'POLYGON', category: 'other' },
  { code: 'maticusdce', name: 'USD Coin Bridged (Polygon)', symbol: 'MATICUSDCE', network: 'POLYGON', category: 'other' },
  { code: 'mco', name: 'MCO', symbol: 'MCO', network: 'ETH', category: 'other' },
  { code: 'memhash', name: 'Memhash', symbol: 'MEMHASH', network: 'TON', category: 'other' },
  { code: 'mew', name: 'cat in a dogs world', symbol: 'MEW', network: 'SOLANA', category: 'other' },
  { code: 'mog', name: 'Mog Coin', symbol: 'MOG', network: 'ETH', category: 'other' },
  { code: 'mogbase', name: 'Mog Coin (Base)', symbol: 'MOG', network: 'Base', category: 'other' },
  { code: 'mx', name: 'MX Token', symbol: 'MX', network: 'ETH', category: 'other' },
  { code: 'myro', name: 'Myro', symbol: 'MYRO', network: 'SOLANA', category: 'other' },
  
  // N
  { code: 'nano', name: 'Nano', symbol: 'XNO', category: 'other' },
  { code: 'near', name: 'NEAR', symbol: 'NEAR', category: 'other' },
  { code: 'neiroerc20', name: 'Neiro Ethereum', symbol: 'NEIROETH', network: 'ETH', category: 'other' },
  { code: 'neo', name: 'NEO', symbol: 'NEO', category: 'other' },
  { code: 'netvr', name: 'Netvrk (Ethereum)', symbol: 'NETVR', network: 'ETH', category: 'other' },
  { code: 'never', name: 'NEVER', symbol: 'NEVER', network: 'SOLANA', category: 'other' },
  { code: 'newterc20', name: 'Newton Network (Ethereum)', symbol: 'NEWT', network: 'ETH', category: 'other' },
  { code: 'nfaierc20', name: 'Not Financial Advice', symbol: 'NFAI', network: 'ETH', category: 'other' },
  { code: 'nftb', name: 'NFTb', symbol: 'NFTB', network: 'BSC', category: 'other' },
  { code: 'niko', name: 'NikolAI', symbol: 'NIKO', network: 'TON', category: 'other' },
  { code: 'not', name: 'Notcoin', symbol: 'NOT', network: 'TON', category: 'other' },
  { code: 'now', name: 'ChangeNOW', symbol: 'NOW', network: 'ETH', category: 'other' },
  { code: 'npxs', name: 'Pundi-x', symbol: 'NPXS', network: 'ETH', category: 'other' },
  { code: 'ntvrk', name: 'Netvrk', symbol: 'NTVRK', network: 'ETH', category: 'other' },
  { code: 'nwc', name: 'NWC', symbol: 'NWC', network: 'ETH', category: 'other' },
  
  // O
  { code: 'ocean', name: 'Ocean Protocol', symbol: 'OCEAN', network: 'ETH', category: 'other' },
  { code: 'okb', name: 'OKB', symbol: 'OKB', network: 'ETH', category: 'other' },
  { code: 'om', name: 'OM', symbol: 'OM', network: 'ETH', category: 'other' },
  { code: 'omg', name: 'OMG Network', symbol: 'OMG', network: 'ETH', category: 'other' },
  { code: 'one', name: 'Harmony', symbol: 'ONE', category: 'other' },
  { code: 'onigi', name: 'Onigiri Neko', symbol: 'ONIGI', network: 'ETH', category: 'other' },
  { code: 'ont', name: 'Ontology', symbol: 'ONT', category: 'other' },
  { code: 'opusdce', name: 'USD Coin Bridged (Optimism)', symbol: 'OPUSDCE', network: 'OP', category: 'other' },
  
  // P
  { code: 'pax', name: 'Paxos', symbol: 'PAX', network: 'ETH', category: 'other' },
  { code: 'peipei', name: 'PeiPei (Ethereum)', symbol: 'PEIPEI', network: 'ETH', category: 'other' },
  { code: 'peng', name: 'Peng', symbol: 'PENG', network: 'SOLANA', category: 'other' },
  { code: 'pepe', name: 'Pepe', symbol: 'PEPE', network: 'ETH', category: 'other' },
  { code: 'pew', name: 'pepe in a memes world', symbol: 'PEW', network: 'ETH', category: 'other' },
  { code: 'pika', name: 'Pika', symbol: 'PIKA', network: 'ETH', category: 'other' },
  { code: 'pit', name: 'PITBULL', symbol: 'PIT', network: 'BSC', category: 'other' },
  { code: 'pivx', name: 'Pivx', symbol: 'PIVX', category: 'other' },
  { code: 'pls', name: 'Pulsechain', symbol: 'PLS', network: 'pulse', category: 'other' },
  { code: 'plx', name: 'Pullix', symbol: 'PLX', network: 'ETH', category: 'other' },
  { code: 'ponke', name: 'Ponke', symbol: 'PONKE', network: 'SOLANA', category: 'other' },
  { code: 'poodl', name: 'Poodl Token', symbol: 'POODL', network: 'BSC', category: 'other' },
  { code: 'poolx', name: 'Poolz Finance', symbol: 'POOLX', network: 'BSC', category: 'other' },
  { code: 'poolz', name: 'Poolz Finance', symbol: 'POOLZ', network: 'BSC', category: 'other' },
  
  // Q
  { code: 'qtum', name: 'Qtum', symbol: 'QTUM', category: 'other' },
  { code: 'quack', name: 'RichQuack', symbol: 'QUACK', network: 'BSC', category: 'other' },
  
  // R
  { code: 'raca', name: 'Radio Caca', symbol: 'RACA', network: 'BSC', category: 'other' },
  { code: 'raincoin', name: 'Rain Coin', symbol: 'RAINCOIN', network: 'POLYGON', category: 'other' },
  { code: 'rbif', name: 'Robo Inu Finance', symbol: 'RBIF', network: 'ETH', category: 'other' },
  { code: 'rep', name: 'Augur', symbol: 'REP', network: 'ETH', category: 'other' },
  { code: 'rjvbsc', name: 'Rejuve.AI (Binance Smart Chain)', symbol: 'RJV', network: 'BSC', category: 'other' },
  { code: 'rjverc20', name: 'Rejuve.AI (Ethereum)', symbol: 'RJV', network: 'ETH', category: 'other' },
  { code: 'rune', name: 'THORChain', symbol: 'RUNE', category: 'other' },
  { code: 'rvn', name: 'Ravencoin', symbol: 'RVN', category: 'other' },
  { code: 'rxcg', name: 'RXCGames', symbol: 'RXCG', network: 'BSC', category: 'other' },
  
  // S
  { code: 's', name: 'Sonic (ex. FTM)', symbol: 'S', network: 'sonic', category: 'other' },
  { code: 'sand', name: 'The Sandbox', symbol: 'SAND', network: 'ETH', category: 'other' },
  { code: 'scrat', name: 'Scrat', symbol: 'SCRAT', network: 'SOLANA', category: 'other' },
  { code: 'sei', name: 'Sei', symbol: 'SEI', category: 'other' },
  { code: 'sfund', name: 'Seedify.fund', symbol: 'SFUND', network: 'BSC', category: 'other' },
  { code: 'shib', name: 'Shiba Inu', symbol: 'SHIB', network: 'ETH', category: 'other' },
  { code: 'shibbsc', name: 'Shiba Inu (BSC)', symbol: 'SHIB', network: 'BSC', category: 'other' },
  { code: 'siduserc20', name: 'Sidus (Ethereum)', symbol: 'SIDUS', network: 'ETH', category: 'other' },
  { code: 'snek', name: 'Snek', symbol: 'SNEK', network: 'ADA', category: 'other' },
  { code: 'snsy', name: 'Sensay', symbol: 'SNSY', network: 'ETH', category: 'other' },
  { code: 'soon', name: 'TON Station', symbol: 'SOON', network: 'TON', category: 'other' },
  { code: 'spi', name: 'Shopping.io', symbol: 'SPI', network: 'ETH', category: 'other' },
  { code: 'srk', name: 'SRK', symbol: 'SRK', network: 'ETH', category: 'other' },
  { code: 'stkk', name: 'Streakk', symbol: 'STKK', network: 'BSC', category: 'other' },
  { code: 'stpt', name: 'STP Network', symbol: 'STPT', network: 'ETH', category: 'other' },
  { code: 'strax', name: 'Stratis', symbol: 'STRAX', category: 'other' },
  { code: 'strkmainnet', name: 'Starknet', symbol: 'STRK', category: 'other' },
  { code: 'stx', name: 'Stacks', symbol: 'STX', category: 'other' },
  { code: 'sui', name: 'Sui', symbol: 'SUI', category: 'other' },
  { code: 'sun', name: 'Sun', symbol: 'SUN', network: 'TRX', category: 'other' },
  { code: 'sundog', name: 'SUNDOG', symbol: 'SUNDOG', network: 'TRX', category: 'other' },
  { code: 'super', name: 'SUPER', symbol: 'SUPER', network: 'ETH', category: 'other' },
  { code: 'sxpmainnet', name: 'Solar Network', symbol: 'SXP', category: 'other' },
  { code: 'sysevm', name: 'Syscoin EVM', symbol: 'SYS', category: 'other' },
  { code: 'stzent', name: 'stZENT', symbol: 'STZENT', network: 'ETH', category: 'other' },
  
  // T
  { code: 'tenshi', name: 'Tenshi', symbol: 'TENSHI', network: 'ETH', category: 'other' },
  { code: 'tet', name: 'Tectum', symbol: 'TET', network: 'ETH', category: 'other' },
  { code: 'tfuel', name: 'Theta Fuel', symbol: 'TFUEL', network: 'THETA', category: 'other' },
  { code: 'theta', name: 'Theta', symbol: 'THETA', category: 'other' },
  { code: 'tko', name: 'Tokocrypto', symbol: 'TKO', network: 'BSC', category: 'other' },
  { code: 'tlos', name: 'Telos (BSC)', symbol: 'TLOS', network: 'BSC', category: 'other' },
  { code: 'tloserc20', name: 'Telos (ETH)', symbol: 'TLOS', network: 'ETH', category: 'other' },
  { code: 'tomo', name: 'TomoChain', symbol: 'TOMO', network: 'ETH', category: 'other' },
  { code: 'trump', name: 'OFFICIAL TRUMP', symbol: 'TRUMP', network: 'SOLANA', category: 'other' },
  { code: 'trvl', name: 'DTravel', symbol: 'TRVL', network: 'ETH', category: 'other' },
  { code: 'ttc', name: 'TechTrees', symbol: 'TTC', network: 'BSC', category: 'other' },
  { code: 'tup', name: 'TenUp', symbol: 'TUP', network: 'ETH', category: 'other' },
  
  // U
  { code: 'uni', name: 'Uniswap', symbol: 'UNI', network: 'ETH', category: 'other' },
  { code: 'usdj', name: 'USDJ', symbol: 'USDJ', network: 'TRX', category: 'other' },
  { code: 'ust', name: 'TerraUSD', symbol: 'UST', network: 'LUNA', category: 'other' },
  
  // V
  { code: 'velo', name: 'Velo', symbol: 'VELO', network: 'BSC', category: 'other' },
  { code: 'verse', name: 'Verse', symbol: 'VERSE', network: 'ETH', category: 'other' },
  { code: 'vet', name: 'VeChain', symbol: 'VET', category: 'other' },
  { code: 'vib', name: 'VIB', symbol: 'VIB', network: 'ETH', category: 'other' },
  { code: 'vlx', name: 'Velas (mainnet)', symbol: 'VLX', category: 'other' },
  { code: 'vlxbsc', name: 'Velas (Binance Smart Chain)', symbol: 'VLX', network: 'BSC', category: 'other' },
  { code: 'volt', name: 'Volt Inu V3', symbol: 'VOLT', network: 'BSC', category: 'other' },
  { code: 'vps', name: 'VPS AI', symbol: 'VPS', network: 'ETH', category: 'other' },
  
  // W
  { code: 'wabi', name: 'Tael', symbol: 'WABI', network: 'ETH', category: 'other' },
  { code: 'waves', name: 'Waves', symbol: 'WAVES', category: 'other' },
  { code: 'wbtcmatic', name: 'Wrapped Bitcoin (Polygon)', symbol: 'WBTC', network: 'POLYGON', category: 'other' },
  { code: 'wemixmainnet', name: 'WEMIX', symbol: 'WEMIX', category: 'other' },
  { code: 'wintrc20', name: 'WinLink (Tron)', symbol: 'WIN', network: 'TRX', category: 'other' },
  { code: 'wolferc20', name: 'Landwolf (Ethereum)', symbol: 'WOLF', network: 'ETH', category: 'other' },
  
  // X
  { code: 'x', name: 'X Empire', symbol: 'X', network: 'TON', category: 'other' },
  { code: 'xcad', name: 'XCAD Network', symbol: 'XCAD', network: 'ETH', category: 'other' },
  { code: 'xcur', name: 'XCUR', symbol: 'XCUR', network: 'ETH', category: 'other' },
  { code: 'xdc', name: 'XDC Network', symbol: 'XDC', category: 'other' },
  { code: 'xec', name: 'eCash', symbol: 'XEC', category: 'other' },
  { code: 'xem', name: 'NEM', symbol: 'XEM', category: 'other' },
  { code: 'xlm', name: 'Stellar', symbol: 'XLM', category: 'other' },
  { code: 'xtz', name: 'Tezos', symbol: 'XTZ', category: 'other' },
  { code: 'xvg', name: 'Verge', symbol: 'XVG', category: 'other' },
  { code: 'xym', name: 'Symbol', symbol: 'XYM', category: 'other' },
  { code: 'xyo', name: 'XYO Network', symbol: 'XYO', network: 'ETH', category: 'other' },
  { code: 'xzc', name: 'Zcoin', symbol: 'XZC', category: 'other' },
  
  // Y
  { code: 'yfi', name: 'yearn.finance', symbol: 'YFI', network: 'ETH', category: 'other' },
  
  // Z
  { code: 'zbc', name: 'Zebec Protocol', symbol: 'ZBC', network: 'SOLANA', category: 'other' },
  { code: 'zec', name: 'Zcash', symbol: 'ZEC', category: 'other' },
  { code: 'zen', name: 'Horizen', symbol: 'ZEN', category: 'other' },
  { code: 'zent', name: 'Zentry', symbol: 'ZENT', network: 'ETH', category: 'other' },
  { code: 'zil', name: 'Zilliqa', symbol: 'ZIL', category: 'other' },
  { code: 'zk', name: 'zkSync', symbol: 'ZK', network: 'zkSync Era', category: 'other' },
  { code: 'zksync', name: 'Ethereum (ZkSync Era)', symbol: 'ETH', network: 'zkSync Era', category: 'other' },
  { code: 'zroerc20', name: 'LayerZero (Ethereum)', symbol: 'ZRO', network: 'ETH', category: 'other' },
  { code: 'zroarb', name: 'LayerZero (Arbitrum One)', symbol: 'ZRO', network: 'Arbitrum', category: 'other' },
  
  // Special tokens
  { code: 'awebase', name: 'AWE Network', symbol: 'AWE', network: 'Base', category: 'other' },
  { code: 'asterbsc', name: 'Aster', symbol: 'ASTER', network: 'BSC', category: 'other' },
  { code: 'somibsc', name: 'Somnia', symbol: 'SOMI', network: 'BSC', category: 'other' },
  { code: 'ava2erc20', name: 'AVA (ERC20)', symbol: 'AVA2', network: 'ETH', category: 'other' },
  { code: 'ava2bsc', name: 'AVA (Binance Smart Chain)', symbol: 'AVA2', network: 'BSC', category: 'other' },
  { code: 'bazed', name: 'Bazed Games', symbol: 'BAZED', network: 'ETH', category: 'other' },
  { code: 'aitech', name: 'Solidus Ai Tech', symbol: 'AITECH', network: 'BSC', category: 'other' },
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
