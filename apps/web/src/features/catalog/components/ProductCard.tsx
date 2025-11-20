'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/design-system/primitives/card';
import { Badge } from '@/design-system/primitives/badge';
import { Button } from '@/design-system/primitives/button';
import { Bitcoin } from 'lucide-react';

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image?: string;
    platform?: string;
    discount?: number;
}

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    return (
        <Link href={`/product/${product.id}`}>
            <Card className="h-full overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg">
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
                    <Image
                        src={product.image || '/placeholder-product.jpg'}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-300 hover:scale-105"
                    />
                    {product.discount !== undefined && product.discount > 0 && (
                        <Badge className="absolute right-2 top-2 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                            {product.discount}% OFF
                        </Badge>
                    )}
                </div>
                <CardContent className="p-4">
                    <div className="mb-2 flex items-start justify-between">
                        <h3 className="line-clamp-2 text-lg font-semibold text-foreground">
                            {product.name}
                        </h3>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                        {product.description}
                    </p>
                </CardContent>
                <CardFooter className="flex items-center justify-between p-4 pt-0">
                    <div className="flex flex-col">
                        <span className="text-xl font-bold text-primary">${product.price}</span>
                        <span className="text-xs text-muted-foreground">{product.platform}</span>
                    </div>
                    <Button size="sm" className="gap-2">
                        <Bitcoin className="h-4 w-4" />
                        Buy
                    </Button>
                </CardFooter>
            </Card>
        </Link>
    );
}
