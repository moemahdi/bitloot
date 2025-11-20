'use client';

import { useEffect } from 'react';
import { Button } from '@/design-system/primitives/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { AlertTriangle } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
      <Card className="w-full max-w-md text-center border-destructive/20 shadow-none sm:border sm:shadow-sm">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-destructive/10">
              <AlertTriangle className="w-10 h-10 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-destructive">Something went wrong!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            We apologize for the inconvenience. An unexpected error has occurred.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-4 bg-muted rounded-md text-left overflow-auto max-h-40 text-xs font-mono">
              {error.message}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Go Home
          </Button>
          <Button onClick={() => reset()}>
            Try Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
