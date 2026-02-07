/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable React Compiler for now - causes prerender issues on Railway
  // reactCompiler: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      // ============================================
      // Kinguin CDN domains (primary product images)
      // ============================================
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
        hostname: 'images.kinguin.net',
        pathname: '/**',
      },
      // ============================================
      // YouTube thumbnails (video previews)
      // ============================================
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/**',
      },
      // ============================================
      // Steam CDN domains (game screenshots/covers)
      // ============================================
      {
        protocol: 'https',
        hostname: 'shared.akamai.steamstatic.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.cloudflare.steamstatic.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.akamai.steamstatic.com',
        pathname: '/**',
      },
      // ============================================
      // Microsoft Store images
      // ============================================
      {
        protocol: 'https',
        hostname: 'store-images.s-microsoft.com',
        pathname: '/**',
      },
      // ============================================
      // Gaming/Tech media sites
      // ============================================
      {
        protocol: 'https',
        hostname: 'cdn.mos.cms.futurecdn.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.gg.deals',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets1.ignimgs.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pcmag.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.techadvisor.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.pcinvasion.com',
        pathname: '/**',
      },
      // ============================================
      // Software product images
      // ============================================
      {
        protocol: 'https',
        hostname: 'windows-cdn.softpedia.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdnl.tblsft.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.izotope.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.fabfilter.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.sweetwater.com',
        pathname: '/**',
      },
      // ============================================
      // CloudFront CDNs
      // ============================================
      {
        protocol: 'https',
        hostname: 'dt7v1i9vyp3mf.cloudfront.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'd22blwhp6neszm.cloudfront.net',
        pathname: '/**',
      },
      // ============================================
      // European retailers/vendors
      // ============================================
      {
        protocol: 'https',
        hostname: 'www.tim.pl',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.djshop.pl',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'astrafox.pl',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.cloudity.pl',
        pathname: '/**',
      },
      // ============================================
      // Storyblok CMS
      // ============================================
      {
        protocol: 'https',
        hostname: 'img2.storyblok.com',
        pathname: '/**',
      },
      // ============================================
      // Cryptocurrency icon CDNs
      // ============================================
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
      // ============================================
      // Utility/Placeholder domains
      // ============================================
      {
        protocol: 'https',
        hostname: 'wallpapers.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
        pathname: '/**',
      },
    ],
    // Cache optimization for external images
    minimumCacheTTL: 2592000, // 30 days cache for external images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 24, 32, 48, 64, 96, 128, 256, 384],
  },
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
};

export default nextConfig;
