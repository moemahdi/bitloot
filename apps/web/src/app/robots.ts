import type { MetadataRoute } from 'next';

/**
 * Robots.txt configuration for BitLoot
 * 
 * This generates a robots.txt at /robots.txt
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitloot.io';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',          // Admin dashboard
          '/api/',            // API routes
          '/auth/',           // Auth pages (login/register/OTP)
          '/pay/',            // Payment pages (contain order data)
          '/profile/',        // User profile
          '/checkout/',       // Checkout flow
          '/orders/',         // Order history
          '/maintenance/',    // Maintenance page
          '/cancel-deletion/',// Account deletion
          '/_next/',          // Next.js internal
          '/test-*',          // Test pages
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/pay/',
          '/profile/',
          '/checkout/',
          '/orders/',
          '/maintenance/',
          '/cancel-deletion/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
