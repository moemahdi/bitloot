import type { Metadata } from 'next';

// Page Metadata for SEO
export const metadata: Metadata = {
  title: 'Customer Reviews | BitLoot - Real Feedback from Verified Buyers',
  description: 'Read authentic reviews from BitLoot customers. See what real buyers say about their digital game keys and software purchases. Trusted crypto-only marketplace.',
  keywords: ['BitLoot reviews', 'game key reviews', 'crypto gaming reviews', 'digital product reviews', 'customer feedback'],
  openGraph: {
    title: 'Customer Reviews | BitLoot',
    description: 'Real reviews from verified BitLoot customers. See authentic feedback on digital game keys and software.',
    type: 'website',
  },
};

export default function ReviewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
