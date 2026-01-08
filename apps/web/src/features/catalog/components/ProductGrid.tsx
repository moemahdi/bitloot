'use client';

import { ProductCard } from './ProductCard';
import type { Product } from './ProductCard';

interface ProductGridProps {
    products: Product[];
}

export function ProductGrid({ products }: ProductGridProps): React.ReactElement {
    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product, index) => (
                <ProductCard 
                    key={product.id} 
                    product={product} 
                    isAboveFold={index < 4}
                />
            ))}
        </div>
    );
}
