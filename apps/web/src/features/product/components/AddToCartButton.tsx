'use client';

import { Button } from '@/design-system/primitives/button';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';

interface AddToCartButtonProps {
  id: string;
  title: string;
  price: number;
  image?: string;
}

export function AddToCartButton({ id, title, price, image }: AddToCartButtonProps): React.ReactElement {
  const { addItem } = useCart();

  const handleAddToCart = (): void => {
    addItem({
      productId: id,
      title: title,
      price: price,
      quantity: 1,
      image: image,
    });
    toast.success('Added to cart');
  };

  return (
    <Button size="lg" variant="outline" className="flex-1 text-lg h-12" onClick={handleAddToCart}>
      <ShoppingCart className="mr-2 h-5 w-5" />
      Add to Cart
    </Button>
  );
}
