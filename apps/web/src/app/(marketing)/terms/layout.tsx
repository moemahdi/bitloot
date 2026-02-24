import type { Metadata } from 'next';

/**
 * Terms of Service Layout — SEO Metadata
 *
 * Legal pages build E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)
 * signals that Google uses to rank e-commerce sites higher.
 */

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitloot.io';

export const metadata: Metadata = {
  title: 'Terms of Service — BitLoot Crypto Gaming Marketplace',
  description:
    'Read the BitLoot Terms of Service. Understand your rights and responsibilities when buying digital game keys and software with cryptocurrency.',
  keywords: [
    'BitLoot terms of service',
    'crypto marketplace terms',
    'game key purchase terms',
    'digital goods terms',
    'BitLoot legal',
  ],
  alternates: {
    canonical: `${siteUrl}/terms`,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: `${siteUrl}/terms`,
    siteName: 'BitLoot',
    title: 'Terms of Service | BitLoot',
    description: 'BitLoot Terms of Service for buying digital game keys and software with cryptocurrency.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
