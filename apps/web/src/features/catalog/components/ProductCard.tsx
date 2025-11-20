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
    price: string;
    currency: string;
    image?: string;
    platform?: string;
    discount?: number;
    stock?: number; // Optional for now, but good to have
    isAvailable?: boolean; // Derived or direct
}

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps): React.ReactElement {
    const isOutOfStock = product.stock !== undefined && product.stock <= 0;

    return (
        <Link href={`/product/${product.id}`}>
            <Card className="h-full overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg">
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
                    <Image
                        src={product.image ?? '/placeholder-product.jpg'}
                        alt={product.name}
                        fill
                        className={`object-cover transition-transform duration-300 hover:scale-105 ${isOutOfStock ? 'grayscale' : ''}`}
                    />
                    {product.discount != null && product.discount > 0 && !isOutOfStock && (
                        <Badge className="absolute right-2 top-2 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                            {product.discount}% OFF
                        </Badge>
                    )}
                    {isOutOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                            <Badge variant="destructive" className="text-lg font-bold">
                                OUT OF STOCK
                            </Badge>
                        </div>
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
                        <span className="text-xl font-bold text-primary">
                            {product.price} <span className="text-sm font-normal text-muted-foreground">{product.currency}</span>
                        </span>
                        <span className="text-xs text-muted-foreground">{product.platform}</span>
                    </div>
                    <Button asChild size="sm" className="gap-2" disabled={isOutOfStock}>
                        <div>
                            <Bitcoin className="h-4 w-4" />
                            {isOutOfStock ? 'Sold Out' : 'Buy'}
                        </div>
                    </Button>
                </CardFooter>
            </Card>
        </Link>
    );
}
