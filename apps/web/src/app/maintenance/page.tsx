import MaintenancePage from '@/components/MaintenanceMode';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Maintenance Mode | BitLoot',
  description: 'BitLoot is currently under maintenance. We\'ll be back soon!',
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Maintenance Page Route
 * 
 * This route is accessible at /maintenance and displays the maintenance page.
 * It's useful for:
 * - Direct linking during maintenance periods
 * - SEO purposes (noindex, nofollow)
 * - Testing the maintenance page design
 */
export default function MaintenanceRoutePage(): React.ReactElement {
  return <MaintenancePage />;
}
