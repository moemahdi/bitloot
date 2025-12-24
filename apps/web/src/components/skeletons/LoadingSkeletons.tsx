import { Card, CardContent } from '@/design-system/primitives/card';
import { Skeleton } from '@/design-system/primitives/skeleton';

interface ProductCardSkeletonProps {
    count?: number;
}

export function ProductCardSkeleton({ count = 1 }: ProductCardSkeletonProps): React.ReactElement {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <Card key={i} className="overflow-hidden bg-bg-secondary border-border-subtle">
                    {/* Image skeleton */}
                    <div className="aspect-[3/4] bg-bg-tertiary animate-pulse" />

                    {/* Content skeleton */}
                    <CardContent className="p-4 space-y-3">
                        {/* Title skeleton */}
                        <Skeleton className="h-5 w-full bg-bg-tertiary" />
                        <Skeleton className="h-5 w-3/4 bg-bg-tertiary" />

                        {/* Description skeleton */}
                        <Skeleton className="h-4 w-full bg-bg-tertiary/50" />
                        <Skeleton className="h-4 w-2/3 bg-bg-tertiary/50" />

                        {/* Footer skeleton */}
                        <div className="flex justify-between pt-2">
                            <Skeleton className="h-7 w-24 bg-bg-tertiary" />
                            <Skeleton className="h-7 w-20 bg-bg-tertiary" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </>
    );
}

interface PageLoadingSkeletonProps {
    rows?: number;
    columns?: number;
}

export function PageLoadingSkeleton({ rows = 2, columns = 4 }: PageLoadingSkeletonProps): React.ReactElement {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <ProductCardSkeleton count={rows * columns} />
        </div>
    );
}

export function OrderCardSkeleton(): React.ReactElement {
    return (
        <Card className="bg-bg-secondary border-border-subtle">
            <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-6 w-24 bg-bg-tertiary" />
                            <Skeleton className="h-4 w-20 bg-bg-tertiary/50" />
                        </div>
                        <Skeleton className="h-5 w-48 bg-bg-tertiary" />
                        <Skeleton className="h-4 w-32 bg-bg-tertiary/50" />
                    </div>
                    <div className="text-right space-y-2">
                        <Skeleton className="h-8 w-20 bg-bg-tertiary" />
                        <Skeleton className="h-3 w-16 bg-bg-tertiary/50" />
                    </div>
                </div>

                <div className="flex gap-2 pt-4">
                    <Skeleton className="h-9 flex-1 bg-bg-tertiary" />
                    <Skeleton className="h-9 flex-1 bg-bg-tertiary" />
                </div>
            </CardContent>
        </Card>
    );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }): React.ReactElement {
    return (
        <tr className="border-b border-border-subtle">
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="p-4">
                    <Skeleton className="h-5 w-full bg-bg-tertiary" />
                </td>
            ))}
        </tr>
    );
}
