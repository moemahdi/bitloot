'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Copy,
  Eye,
  Loader2,
  Check,
  Image as ImageIcon,
  Package,
  Download,
  Key,
  Lock,
  LogIn,
  AlertCircle,
} from 'lucide-react';
import { FulfillmentApi } from '@bitloot/sdk';
import type { RevealedKeyDto } from '@bitloot/sdk';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { toast } from 'sonner';
import { apiConfig } from '@/lib/api-config';
import { cn } from '@/design-system/utils/utils';

// Initialize SDK client
const fulfillmentClient = new FulfillmentApi(apiConfig);

export interface OrderItem {
  id: string;
  productId?: string;
  productTitle?: string;
  quantity?: number;
}

export interface KeyAccessStatus {
  canAccess: boolean;
  reason: 'owner' | 'admin' | 'email_match' | 'session_token' | 'guest_order' | 'not_authenticated' | 'not_owner';
  isAuthenticated: boolean;
  message: string;
}

interface KeyRevealProps {
  orderId: string;
  items: OrderItem[];
  isFulfilled: boolean;
  variant?: 'default' | 'compact';
  /** Access status - if not provided, assumes user can access */
  accessStatus?: KeyAccessStatus;
}

export function KeyReveal({ 
  orderId, 
  items, 
  isFulfilled,
  variant = 'default',
  accessStatus,
}: KeyRevealProps): React.ReactElement {
  const pathname = usePathname();
  const [revealedKeys, setRevealedKeys] = useState<Record<string, RevealedKeyDto>>({});
  const [revealingItemId, setRevealingItemId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Default to allowing access if no accessStatus is provided (backward compatibility)
  const canAccess = accessStatus?.canAccess ?? true;
  const isAuthenticated = accessStatus?.isAuthenticated ?? true;
  const accessReason = accessStatus?.reason ?? 'owner';
  const accessMessage = accessStatus?.message ?? '';

  /**
   * Get order session token from localStorage for guest access
   */
  const getOrderSessionToken = (): string | undefined => {
    if (typeof window === 'undefined') return undefined;
    const token = localStorage.getItem(`order_session_${orderId}`);
    return token ?? undefined;
  };

  const revealKeyMutation = useMutation({
    mutationFn: async ({ itemId }: { itemId: string }) => {
      setRevealingItemId(itemId);
      // Include session token for guest access
      const sessionToken = getOrderSessionToken();
      return await fulfillmentClient.fulfillmentControllerRevealMyKey({
        id: orderId,
        itemId,
        xOrderSessionToken: sessionToken,
      });
    },
    onSuccess: (keyData, variables) => {
      setRevealedKeys(prev => ({ ...prev, [variables.itemId]: keyData }));
      setRevealingItemId(null);
      toast.success('Code revealed successfully!');
    },
    onError: (err) => {
      console.error('Failed to reveal code:', err);
      setRevealingItemId(null);
      toast.error('Failed to reveal code. Please try again.');
    },
  });

  const handleRevealKey = (itemId: string): void => {
    revealKeyMutation.mutate({ itemId });
  };

  const copyToClipboard = (text: string): void => {
    void navigator.clipboard.writeText(text);
    setCopiedKey(text);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // ============ ACCESS CONTROL: Check canAccess first (includes session token access) ============
  // If canAccess is true (via session token, owner, admin, email match), skip login prompt
  // If canAccess is false AND not authenticated, show login
  // If canAccess is false AND authenticated, show access denied

  // ============ LOCKED STATE: Not authenticated AND cannot access ============
  if (!canAccess && !isAuthenticated) {
    const loginUrl = `/auth/login?redirect=${encodeURIComponent(pathname)}`;
    return (
      <Card className="border-amber-400/30 bg-amber-400/5">
        <CardHeader className={variant === 'compact' ? 'py-3' : undefined}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center",
              variant === 'compact' ? 'h-8 w-8' : 'h-10 w-10'
            )}>
              <Lock className={cn(
                "text-amber-400",
                variant === 'compact' ? 'h-4 w-4' : 'h-5 w-5'
              )} />
            </div>
            <div>
              <CardTitle className={variant === 'compact' ? 'text-base' : 'text-lg'}>
                Login Required
              </CardTitle>
              <CardDescription className={variant === 'compact' ? 'text-xs' : undefined}>
                Sign in to access your products
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted/50 p-4 mb-4">
            <div className="flex items-center gap-3 text-amber-400">
              <Lock className="h-4 w-4 shrink-0" />
              <span className="text-sm">
                Your products are secure. Login with the email you used for this order to access them.
              </span>
            </div>
          </div>
          <Button asChild className="w-full bg-amber-400 text-black hover:bg-amber-500">
            <Link href={loginUrl}>
              <LogIn className="mr-2 h-4 w-4" />
              Login to Access Products
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ============ LOCKED STATE: Authenticated but not owner ============
  if (!canAccess && isAuthenticated) {
    const isGuestOrder = accessReason === 'guest_order';
    return (
      <Card className="border-red-500/30 bg-red-500/5">
        <CardHeader className={variant === 'compact' ? 'py-3' : undefined}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center",
              variant === 'compact' ? 'h-8 w-8' : 'h-10 w-10'
            )}>
              <AlertCircle className={cn(
                "text-red-500",
                variant === 'compact' ? 'h-4 w-4' : 'h-5 w-5'
              )} />
            </div>
            <div>
              <CardTitle className={cn(
                "text-red-500",
                variant === 'compact' ? 'text-base' : 'text-lg'
              )}>
                {isGuestOrder ? 'Guest Order' : 'Access Denied'}
              </CardTitle>
              <CardDescription className={variant === 'compact' ? 'text-xs' : undefined}>
                {accessMessage}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Lock className="h-4 w-4 shrink-0" />
              <span className="text-sm">
                {isGuestOrder 
                  ? 'This order was placed as a guest. If you used a different email, try logging in with that email address.'
                  : 'You do not have permission to access this order.'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Not fulfilled - show loading state
  if (!isFulfilled && items.length > 0) {
    return (
      <Card className="border-[hsl(var(--orange-warning))]/20">
        <CardHeader className={variant === 'compact' ? 'py-3' : undefined}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "rounded-lg bg-[hsl(var(--orange-warning))]/10 border border-[hsl(var(--orange-warning))]/20 flex items-center justify-center",
              variant === 'compact' ? 'h-8 w-8' : 'h-10 w-10'
            )}>
              <Loader2 className={cn(
                "text-[hsl(var(--orange-warning))] animate-spin",
                variant === 'compact' ? 'h-4 w-4' : 'h-5 w-5'
              )} />
            </div>
            <div>
              <CardTitle className={variant === 'compact' ? 'text-base' : 'text-lg'}>
                Preparing Your Products
              </CardTitle>
              <CardDescription className={variant === 'compact' ? 'text-xs' : undefined}>
                This usually takes just a few moments
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-[hsl(var(--orange-warning))] animate-pulse" />
              <span className="text-sm text-muted-foreground">
                Preparing your digital products...
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No items
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">No items in this order</p>
        </CardContent>
      </Card>
    );
  }

  // Fulfilled - show keys
  return (
    <Card className="border-[hsl(var(--green-success))]/20">
      <CardHeader className={variant === 'compact' ? 'py-3' : undefined}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "rounded-lg bg-[hsl(var(--green-success))]/10 border border-[hsl(var(--green-success))]/20 flex items-center justify-center",
            variant === 'compact' ? 'h-8 w-8' : 'h-10 w-10'
          )}>
            <Key className={cn(
              "text-[hsl(var(--green-success))]",
              variant === 'compact' ? 'h-4 w-4' : 'h-5 w-5'
            )} />
          </div>
          <div>
            <CardTitle className={variant === 'compact' ? 'text-base' : 'text-lg'}>
              Your Digital Products
            </CardTitle>
            <CardDescription className={variant === 'compact' ? 'text-xs' : undefined}>
              Click to reveal your product codes
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item, index) => {
          const itemId = item.id;
          const revealedKey = revealedKeys[itemId];
          const isRevealing = revealingItemId === itemId;
          const isImage = revealedKey?.contentType?.startsWith('image/');
          
          return (
            <div 
              key={itemId} 
              className={cn(
                "rounded-xl border bg-card shadow-sm transition-all hover:shadow-md",
                variant === 'compact' ? 'p-3' : 'p-4'
              )}
            >
              <div className={cn(
                "flex items-center justify-between",
                variant === 'compact' ? 'mb-2' : 'mb-3'
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "rounded-lg bg-muted flex items-center justify-center",
                    variant === 'compact' ? 'h-7 w-7' : 'h-9 w-9'
                  )}>
                    <Package className={cn(
                      "text-muted-foreground",
                      variant === 'compact' ? 'h-3.5 w-3.5' : 'h-4 w-4'
                    )} />
                  </div>
                  <div>
                    <p className={cn(
                      "font-medium",
                      variant === 'compact' ? 'text-xs' : 'text-sm'
                    )}>
                      {item.productTitle ?? 'Digital Product'}
                    </p>
                    <p className={cn(
                      "text-muted-foreground",
                      variant === 'compact' ? 'text-[10px]' : 'text-xs'
                    )}>
                      Item {index + 1} of {items.length}
                    </p>
                  </div>
                </div>
                {revealedKey !== null && revealedKey !== undefined && (
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-[hsl(var(--green-success))] border-[hsl(var(--green-success))]/30 bg-[hsl(var(--green-success))]/10",
                      variant === 'compact' && 'text-[10px] py-0'
                    )}
                  >
                    <Check className={cn("mr-1", variant === 'compact' ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
                    Revealed
                  </Badge>
                )}
              </div>
              
              {revealedKey === null || revealedKey === undefined ? (
                <Button 
                  onClick={() => handleRevealKey(itemId)} 
                  disabled={isRevealing}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  size={variant === 'compact' ? 'sm' : 'lg'}
                >
                  {isRevealing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Revealing...
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Reveal Product
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-3">
                  {isImage === true ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ImageIcon className="h-4 w-4" />
                        <span>Image Code ({revealedKey.contentType})</span>
                      </div>
                      <div className="relative rounded-lg overflow-hidden border bg-muted/30">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={`data:${revealedKey.contentType};base64,${revealedKey.plainKey}`}
                          alt="Product Code"
                          className="max-w-full"
                        />
                      </div>
                      <Button variant="outline" size="sm" className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Download Image
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between rounded-lg bg-muted/50 p-1">
                        <code className={cn(
                          "flex-1 px-3 py-2 font-mono break-all select-all",
                          variant === 'compact' ? 'text-xs' : 'text-sm'
                        )}>
                          {revealedKey.plainKey}
                        </code>
                        <Button
                          variant={copiedKey === revealedKey.plainKey ? "default" : "ghost"}
                          size="icon"
                          onClick={() => copyToClipboard(revealedKey.plainKey)}
                          className={cn(
                            "shrink-0 transition-all",
                            copiedKey === revealedKey.plainKey && "bg-[hsl(var(--green-success))] hover:bg-[hsl(var(--green-success))]/80"
                          )}
                        >
                          {copiedKey === revealedKey.plainKey ? (
                            <Check className="h-4 w-4 text-white" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
