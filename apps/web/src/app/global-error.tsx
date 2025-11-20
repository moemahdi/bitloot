'use client';

import { useEffect } from 'react';
import { Button } from '@/design-system/primitives/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center dark:bg-gray-900">
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
            Something went wrong!
          </h2>
          <p className="mb-8 text-gray-600 dark:text-gray-400">
            A critical error occurred. We apologize for the inconvenience.
          </p>
          <Button onClick={() => reset()}>Try again</Button>
        </div>
      </body>
    </html>
  );
}
