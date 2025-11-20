'use client';

import Link from 'next/link';
import { Button } from '@/design-system/primitives/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { AlertCircle } from 'lucide-react';

export default function NotFound(): React.ReactElement {
  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
      <Card className="w-full max-w-md text-center border-none shadow-none sm:border sm:shadow-sm">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-muted">
              <AlertCircle className="w-10 h-10 text-muted-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Page Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Sorry, we couldn&lsquo;t find the page you&rsquo;re looking for. It might have been moved, deleted, or never existed.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/">Go Home</Link>
          </Button>
          <Button asChild>
            <Link href="/catalog">Browse Catalog</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
