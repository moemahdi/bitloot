import { Card, CardContent, CardFooter, CardHeader } from '@/design-system/primitives/card';
import { Skeleton } from '@/design-system/primitives/skeleton';

export function ProductCardSkeleton(): React.ReactElement {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <Skeleton className="h-48 w-full" />
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-10 w-28" />
      </CardFooter>
    </Card>
  );
}
