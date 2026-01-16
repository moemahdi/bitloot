/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static.kinguin.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdns.kinguin.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/**',
      },
      // Cryptocurrency icon CDNs
      {
        protocol: 'https',
        hostname: 'cryptoicons.org',
        pathname: '/api/icon/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.coincap.io',
        pathname: '/assets/icons/**',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/spothq/cryptocurrency-icons/**',
      },
      // External image sources
      {
        protocol: 'https',
        hostname: 'wallpapers.com',
        pathname: '/**',
      },
    ],
    // Cache optimization for crypto icons
    minimumCacheTTL: 2592000, // 30 days cache for external images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 24, 32, 48, 64, 96, 128, 256, 384],
  },
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
};

export default nextConfig;
