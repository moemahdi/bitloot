'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import { Badge } from '@/design-system/primitives/badge';
import Image from 'next/image';

interface CartItemRowProps {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  onRemove: () => void;
  onQuantityChange: (quantity: number) => void;
}

export function CartItemRow({
  title,
  price,
  quantity,
  image,
  onRemove,
  onQuantityChange,
}: CartItemRowProps): React.ReactElement {
  const itemTotal = price * quantity;

  const handleDecrement = (): void => {
    if (quantity > 1) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrement = (): void => {
    onQuantityChange(quantity + 1);
  };

  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      onQuantityChange(value);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
      {/* Product Image */}
      <div className="shrink-0 w-full sm:w-20 h-20 bg-muted rounded-md overflow-hidden">
        {image !== undefined && image.length > 0 ? (
          <Image
            src={image}
            alt={title}
            width={80}
            height={80}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No image
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm sm:text-base truncate">{title}</h3>
        <p className="text-sm text-muted-foreground">
          €{price.toFixed(2)} each
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDecrement}
          aria-label="Decrease quantity"
          disabled={quantity <= 1}
          className="h-8 w-8 p-0"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          type="number"
          min="1"
          max="999"
          value={quantity}
          onChange={handleQuantityInputChange}
          className="w-12 h-8 text-center px-2 py-1"
          aria-label="Product quantity"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleIncrement}
          aria-label="Increase quantity"
          className="h-8 w-8 p-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Item Total */}
      <div className="flex flex-col items-end justify-between">
        <Badge variant="secondary" className="text-xs mb-2">
          €{itemTotal.toFixed(2)}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          aria-label={`Remove ${title} from cart`}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
