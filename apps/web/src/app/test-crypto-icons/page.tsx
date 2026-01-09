'use client';

import { CryptoIcon } from '@/components/crypto-icons';

const TEST_CURRENCIES = [
  'btc', 'eth', 'usdt', 'bnb', 'sol', 'xrp', 'ada', 'doge', 'dot', 'ltc',
  'trx', 'dai', 'matic', 'avax', 'shib', 'link', 'uni', 'atom', 'etc',
  'xlm', 'bch', 'algo', 'vet', 'fil', 'icp', 'apt', 'arb', 'op', 'near',
  'cake', 'grt', 'sand', 'mana', 'axs', 'ftm', 'kcs', 'rune', 'cro',
  // Network-specific versions
  'usdttrc20', 'usdterc20', 'usdcbsc', 'daiarb',
  // Less common currencies that will use CDN
  'zec', 'dash', 'neo', 'qtum', 'icx', 'zil', 'ont', 'bat', 'enj',
];

export default function TestCryptoIcons() {
  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-8">
          Real Cryptocurrency Icons Test
        </h1>

        <div className="mb-8 p-6 bg-bg-secondary rounded-2xl border border-border-subtle">
          <h2 className="text-xl font-semibold text-text-primary mb-4">How it works:</h2>
          <ul className="space-y-2 text-text-secondary">
            <li>✅ <strong>Major currencies (30+)</strong>: Handcrafted SVG icons (BTC, ETH, USDT, etc.)</li>
            <li>✅ <strong>All other currencies (500+)</strong>: Real logos from CryptoIcons CDN</li>
            <li>✅ <strong>Fallback #1</strong>: GitHub cryptocurrency-icons repository</li>
            <li>✅ <strong>Fallback #2</strong>: CoinCap assets</li>
            <li>✅ <strong>Final fallback</strong>: Dynamic gradient icon with unique colors</li>
          </ul>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {TEST_CURRENCIES.map((currency) => (
            <div
              key={currency}
              className="flex flex-col items-center gap-3 p-3 bg-bg-secondary rounded-xl border border-border-subtle hover:border-cyan-glow/30 transition-all"
            >
              <div className="w-full aspect-square flex items-center justify-center p-2">
                <CryptoIcon code={currency} className="w-full h-full" size={64} />
              </div>
              <span className="text-xs text-text-secondary uppercase font-mono text-center">
                {currency}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 bg-bg-tertiary rounded-2xl border border-border-subtle">
          <h3 className="text-lg font-semibold text-text-primary mb-3">Testing Instructions:</h3>
          <ol className="space-y-2 text-text-secondary list-decimal list-inside">
            <li>Check that BTC, ETH, USDT show high-quality SVG icons</li>
            <li>Verify other currencies load real brand logos from CDN</li>
            <li>If a CDN fails, the icon should automatically try the next CDN</li>
            <li>If all CDNs fail, a colorful gradient icon appears</li>
            <li>Network suffixes (trc20, erc20, bsc) use the same base currency icon</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
