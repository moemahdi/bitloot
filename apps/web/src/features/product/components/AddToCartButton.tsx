'use client';

import { useState } from 'react';
import { Button } from '@/design-system/primitives/button';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';

interface AddToCartButtonProps {
  id: string;
  slug?: string;
  title: string;
  price: number;
  image?: string;
  disabled?: boolean;
  className?: string;
}

export function AddToCartButton({ 
  id, 
  slug,
  title, 
  price, 
  image,
  disabled = false,
  className = '',
}: AddToCartButtonProps): React.ReactElement {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const handleAddToCart = async (): Promise<void> => {
    if (isAdding || justAdded || disabled) return;
    
    setIsAdding(true);
    
    // Simulate a brief delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 300));
    
    addItem({
      productId: id,
      slug: slug,
      title: title,
      price: price,
      quantity: 1,
      image: image,
    });
    
    setIsAdding(false);
    setJustAdded(true);
    
    toast.success('Added to cart', {
      description: title,
      duration: 2000,
    });
    
    // Reset after animation
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <Button 
      size="lg" 
      variant="outline" 
      disabled={disabled || isAdding}
      onClick={handleAddToCart}
      className={`
        group relative flex-1 text-lg h-12 min-h-12
        border-purple-neon/50 bg-purple-neon/10
        text-purple-neon font-semibold
        transition-all duration-200
        hover:bg-purple-neon/20 hover:border-purple-neon
        hover:shadow-glow-purple-sm hover:text-white
        active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none
        ${justAdded ? 'border-green-success/50 bg-green-success/10 text-green-success hover:bg-green-success/20 hover:border-green-success hover:shadow-glow-success' : ''}
        ${className}
      `}
    >
      {isAdding ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Adding...
        </>
      ) : justAdded ? (
        <>
          <Check className="mr-2 h-5 w-5" />
          Added!
        </>
      ) : (
        <>
          <ShoppingCart className="mr-2 h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
          Add to Cart
        </>
      )}
    </Button>
  );
}
