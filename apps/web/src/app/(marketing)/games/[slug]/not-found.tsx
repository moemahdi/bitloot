/**
 * 404 page for game spotlight routes
 */

import Link from 'next/link';
import { Gamepad2, ArrowLeft } from 'lucide-react';
import { Button } from '@/design-system/primitives/button';

export default function GameNotFound(): React.JSX.Element {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16">
      <div className="text-center">
        <Gamepad2 className="mx-auto mb-6 h-16 w-16 text-text-muted" />
        <h1 className="mb-4 text-3xl font-bold text-text-primary">Game Not Found</h1>
        <p className="mb-8 max-w-md text-text-secondary">
          Sorry, we couldn&#39;t find the game you&#39;re looking for. It might have been removed or
          the URL might be incorrect.
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/catalog">
              <ArrowLeft className="h-4 w-4" />
              Browse Catalog
            </Link>
          </Button>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
