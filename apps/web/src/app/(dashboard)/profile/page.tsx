'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UsersApi, FulfillmentApi, AuthenticationApi, SessionsApi, type OrderResponseDto, type OrderItemResponseDto } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import { useWatchlist, useRemoveFromWatchlist } from '@/features/watchlist';
import { useCart } from '@/context/CartContext';
import { KeyReveal, type OrderItem } from '@/features/orders';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import { Separator } from '@/design-system/primitives/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/design-system/primitives/tabs';
import { Badge } from '@/design-system/primitives/badge';
import { Loader2, User, Shield, Key, Package, DollarSign, Check, Copy, ShoppingBag, LogOut, LayoutDashboard, Eye, HelpCircle, Mail, Hash, Crown, ShieldCheck, AlertCircle, Fingerprint, Info, Heart, ChevronDown, ChevronUp, RefreshCw, Download, Smartphone, Monitor, Trash2, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard';
import { AnimatedGridPattern } from '@/components/animations/FloatingParticles';
import { GlowButton } from '@/design-system/primitives/glow-button';
import { WatchlistProductCard } from '@/features/watchlist/components/WatchlistProductCard';

const usersClient = new UsersApi(apiConfig);
const fulfillmentClient = new FulfillmentApi(apiConfig);

// ============ WATCHLIST TAB CONTENT COMPONENT ============
function WatchlistTabContent(): React.ReactElement {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  const { data: watchlistData, isLoading, error, refetch } = useWatchlist(currentPage, itemsPerPage);
  const removeFromWatchlist = useRemoveFromWatchlist();
  const { addItem } = useCart();

  const handleAddToCart = (item: NonNullable<typeof watchlistData>['data'][0]): void => {
    addItem({
      productId: item.product.id,
      title: item.product.title,
      price: item.product.price,
      quantity: 1,
      image: item.product.coverImageUrl ?? undefined,
    });
    toast.success(`${item.product.title} added to cart`);
  };

  const handleRemoveFromWatchlist = async (productId: string, productTitle: string): Promise<void> => {
    try {
      await removeFromWatchlist.mutateAsync(productId);
      toast.success(`${productTitle} removed from watchlist`);
    } catch {
      toast.error('Failed to remove from watchlist');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <Card className="glass border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="skeleton h-6 w-40 animate-shimmer rounded" />
                <div className="skeleton h-4 w-28 animate-shimmer rounded" />
              </div>
              <div className="skeleton h-9 w-28 animate-shimmer rounded" />
            </div>
          </CardHeader>
        </Card>
        {/* Grid Skeleton */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass rounded-lg p-4 space-y-3">
              <div className="skeleton h-40 w-full animate-shimmer rounded-lg" />
              <div className="skeleton h-5 w-3/4 animate-shimmer rounded" />
              <div className="skeleton h-4 w-1/2 animate-shimmer rounded" />
              <div className="skeleton h-8 w-full animate-shimmer rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error !== null) {
    return (
      <Card className="glass border-orange-warning/30">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="p-4 rounded-full bg-orange-warning/10">
            <AlertCircle className="h-12 w-12 text-orange-warning" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary">Failed to load watchlist</h3>
          <p className="text-text-secondary text-center max-w-sm">We couldn&apos;t fetch your saved products. Please try again.</p>
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            className="border-orange-warning/30 text-orange-warning hover:bg-orange-warning/10 hover:border-orange-warning/50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const items = watchlistData?.data ?? [];
  const total = watchlistData?.total ?? 0;
  const totalPages = watchlistData?.totalPages ?? 1;

  if (items.length === 0) {
    return (
      <Card className="glass border-border/50 border-dashed">
        <CardContent className="empty-state py-16">
          <div className="p-5 rounded-full bg-purple-neon/10 border border-purple-neon/20">
            <Heart className="empty-state-icon text-purple-neon" />
          </div>
          <h3 className="empty-state-title">Your watchlist is empty</h3>
          <p className="empty-state-description">
            Browse our catalog and add products to your watchlist to track them here.
          </p>
          <Link href="/catalog">
            <GlowButton 
              variant="default"
              className="mt-6"
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              Browse Products
            </GlowButton>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="glass border-border/50 bg-bg-secondary/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-text-primary flex items-center gap-2">
                  <Heart className="h-5 w-5 text-purple-neon" />
                  Your Watchlist
                </CardTitle>
                <CardDescription className="text-text-secondary mt-1">
                  {total} {total === 1 ? 'product' : 'products'} saved
                </CardDescription>
              </div>
              <Link href="/catalog">
                <Button variant="outline" size="sm" className="border-border/50 hover:border-cyan-glow/30">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Browse More
                </Button>
              </Link>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Watchlist Items Grid - Matching ProductCard Design */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
          >
            <WatchlistProductCard
              product={{
                id: item.product.id,
                slug: item.product.slug,
                title: item.product.title,
                subtitle: item.product.subtitle,
                price: item.product.price,
                coverImageUrl: item.product.coverImageUrl,
                platform: item.product.platform,
                region: item.product.region,
                isPublished: item.product.isPublished,
              }}
              addedAt={item.createdAt}
              onRemove={async (productId: string) => {
                await handleRemoveFromWatchlist(productId, item.product.title);
              }}
              onAddToCart={() => handleAddToCart(item)}
              isRemoving={removeFromWatchlist.isPending}
            />
          </motion.div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex justify-center gap-2 pt-4"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="border-border/50"
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-text-secondary">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="border-border/50"
          >
            Next
          </Button>
        </motion.div>
      )}
    </div>
  );
}

export default function ProfilePage(): React.ReactElement {
  const { user, logout, accessToken, sessionId } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Sync activeTab with URL query params
  const urlTab = searchParams.get('tab');
  const validTabs = ['overview', 'purchases', 'watchlist', 'security', 'account', 'help'];
  const [activeTab, setActiveTab] = useState(() => 
    urlTab !== null && validTabs.includes(urlTab) ? urlTab : 'overview'
  );

  // State for expanded orders in Purchases tab
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  // State for tracking download in progress
  const [downloadingOrder, setDownloadingOrder] = useState<string | null>(null);
  // State for tracking key recovery in progress
  const [recoveringOrder, setRecoveringOrder] = useState<string | null>(null);

  // Security tab state
  const [newEmail, setNewEmail] = useState('');
  const [oldEmailOtp, setOldEmailOtp] = useState('');
  const [newEmailOtp, setNewEmailOtp] = useState('');
  const [isEmailChangeStep, setIsEmailChangeStep] = useState<'idle' | 'otp' | 'verifying'>('idle');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  // API clients
  const queryClient = useQueryClient();
  const authClient = new AuthenticationApi(apiConfig);
  const sessionsClient = new SessionsApi(apiConfig);

  // Update activeTab when URL changes
  useEffect(() => {
    if (urlTab !== null && validTabs.includes(urlTab)) {
      setActiveTab(urlTab);
    }
    // validTabs is a stable array, no need to include in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlTab]);

  // Fetch user's orders - always fetch fresh data to show updated order status
  const { data: orders = [], isLoading: ordersLoading, refetch: refetchOrders } = useQuery<OrderResponseDto[]>({
    queryKey: ['profile-orders'],
    queryFn: async () => {
      try {
        const response = await usersClient.usersControllerGetOrdersRaw({});
        if (response.raw.ok) {
          return (await response.raw.json()) as OrderResponseDto[];
        }
        return [];
      } catch (error) {
        console.error('Failed to fetch orders:', error);
        return [];
      }
    },
    enabled: user !== null && user !== undefined,
    staleTime: 0, // Always consider data stale to fetch fresh status
    refetchOnMount: 'always', // Refetch when component mounts (tab visited)
    refetchOnWindowFocus: true, // Refetch when user returns to window
  });

  // Fetch active sessions
  interface SessionData {
    id: string;
    deviceInfo: string;
    ipAddress: string;
    lastActiveAt: string;
    createdAt: string;
    isCurrent: boolean;
  }
  
  const { data: sessions = [], isLoading: sessionsLoading, refetch: refetchSessions } = useQuery<SessionData[]>({
    queryKey: ['active-sessions', sessionId],
    queryFn: async () => {
      try {
        // Pass currentSessionId to identify current session
        const queryParams = sessionId !== null ? `?currentSessionId=${sessionId}` : '';
        console.info('📋 Fetching sessions with currentSessionId:', sessionId);
        const response = await fetch(`${apiConfig.basePath}/sessions${queryParams}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (response.ok) {
          const result = (await response.json()) as { sessions: SessionData[]; total: number };
          console.info('📋 Sessions received:', result.sessions.map(s => ({ id: s.id, isCurrent: s.isCurrent })));
          
          // ========== REVOKED SESSION CHECK ==========
          // If we passed a currentSessionId but no session is marked as current,
          // it means our session was revoked or expired. Trigger full logout.
          if (sessionId !== null && result.sessions.length > 0) {
            const hasCurrentSession = result.sessions.some(s => s.isCurrent);
            if (!hasCurrentSession) {
              console.warn('🚫 Current session was revoked - logging out');
              toast.error('Your session was revoked. Please log in again.');
              // Use setTimeout to allow toast to show before logout
              setTimeout(() => {
                logout();
              }, 500);
              return [];
            }
          }
          
          // Edge case: No sessions at all means all were revoked
          if (sessionId !== null && result.sessions.length === 0) {
            console.warn('🚫 No active sessions found - logging out');
            toast.error('Your session has expired. Please log in again.');
            setTimeout(() => {
              logout();
            }, 500);
            return [];
          }
          
          return result.sessions;
        }
        return [];
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
        return [];
      }
    },
    enabled: user !== null && user !== undefined && activeTab === 'security' && accessToken !== null,
    staleTime: 30000,
  });

  // Fetch account deletion status
  interface DeletionStatus {
    deletionRequested: boolean;
    deletionScheduledAt: string | null;
    daysRemaining: number | null;
  }
  
  // API response interface (different from UI interface)
  interface DeletionStatusApiResponse {
    success: boolean;
    message: string;
    deletionDate: string | null;
    daysRemaining: number | null;
  }
  
  const { data: deletionStatus, refetch: refetchDeletionStatus } = useQuery<DeletionStatus | null>({
    queryKey: ['deletion-status'],
    queryFn: async () => {
      try {
        const response = await authClient.authControllerGetAccountDeletionStatusRaw({});
        if (response.raw.ok) {
          const apiData = (await response.raw.json()) as DeletionStatusApiResponse;
          // Map API response to UI interface
          return {
            deletionRequested: apiData.deletionDate !== null,
            deletionScheduledAt: apiData.deletionDate,
            daysRemaining: apiData.daysRemaining,
          };
        }
        return null;
      } catch (error) {
        console.error('Failed to fetch deletion status:', error);
        return null;
      }
    },
    enabled: user !== null && user !== undefined && activeTab === 'security',
    staleTime: 0, // Always consider stale to ensure fresh data
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when user comes back to tab
  });

  // Email change mutations (Dual-OTP: old email + new email verification)
  const requestEmailChangeMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await authClient.authControllerRequestEmailChangeRaw({
        requestEmailChangeDto: { newEmail: email }
      });
      if (!response.raw.ok) {
        const error = await response.raw.json();
        throw new Error((error as { message?: string }).message ?? 'Failed to request email change');
      }
      return response.raw.json();
    },
    onSuccess: () => {
      setIsEmailChangeStep('otp');
      toast.success('Verification codes sent to both your current and new email addresses');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const verifyEmailChangeMutation = useMutation({
    mutationFn: async ({ oldCode, newCode }: { oldCode: string; newCode: string }) => {
      const response = await authClient.authControllerVerifyEmailChangeRaw({
        verifyEmailChangeDto: { oldEmailCode: oldCode, newEmailCode: newCode }
      });
      if (!response.raw.ok) {
        const error = await response.raw.json();
        throw new Error((error as { message?: string }).message ?? 'Failed to verify email change');
      }
      return response.raw.json();
    },
    onSuccess: () => {
      setIsEmailChangeStep('idle');
      setNewEmail('');
      setOldEmailOtp('');
      setNewEmailOtp('');
      toast.success('Email address updated successfully!');
      // Refresh user data
      void queryClient.invalidateQueries({ queryKey: ['auth-user'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Session mutations
  const revokeSessionMutation = useMutation({
    mutationFn: async (revokeSessionId: string) => {
      const response = await sessionsClient.sessionControllerRevokeSessionRaw({ sessionId: revokeSessionId });
      if (!response.raw.ok) {
        throw new Error('Failed to revoke session');
      }
      // Return whether this was the current session
      return revokeSessionId === sessionId;
    },
    onSuccess: (wasCurrentSession) => {
      if (wasCurrentSession) {
        toast.success('Current session ended. Logging out...');
        // Small delay to show the toast, then logout
        setTimeout(() => {
          logout();
        }, 1500);
      } else {
        toast.success('Session revoked');
        void refetchSessions();
      }
    },
    onError: () => {
      toast.error('Failed to revoke session');
    }
  });

  const revokeAllSessionsMutation = useMutation({
    mutationFn: async () => {
      const response = await sessionsClient.sessionControllerRevokeAllSessionsRaw({});
      if (!response.raw.ok) {
        throw new Error('Failed to revoke all sessions');
      }
    },
    onSuccess: () => {
      toast.success('All sessions revoked. Logging out...');
      // Revoke all includes current, so logout
      setTimeout(() => {
        logout();
      }, 1500);
    },
    onError: () => {
      toast.error('Failed to revoke sessions');
    }
  });

  // Account deletion mutations
  const requestDeletionMutation = useMutation({
    mutationFn: async () => {
      const response = await authClient.authControllerRequestAccountDeletionRaw({
        requestDeletionDto: { confirmation: 'DELETE' }
      });
      if (!response.raw.ok) {
        const error = await response.raw.json();
        throw new Error((error as { message?: string }).message ?? 'Failed to request account deletion');
      }
      return response.raw.json();
    },
    onSuccess: async () => {
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
      toast.success('Account deletion scheduled. You have 30 days to cancel.');
      // Invalidate and refetch the deletion status cache
      await queryClient.invalidateQueries({ queryKey: ['deletion-status'] });
      await queryClient.refetchQueries({ queryKey: ['deletion-status'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Cancel deletion mutation - redirects to cancel-deletion page for consistent UX
  const cancelDeletionMutation = useMutation({
    mutationFn: async () => {
      // Get cancellation token from API - use the typed method, not raw
      const data = await authClient.authControllerGetCancellationToken();
      return data;
    },
    onSuccess: (data) => {
      // Redirect to the cancel-deletion page with the token
      router.push(`/cancel-deletion/${data.token}`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Calculate statistics
  const totalOrders = orders.length;
  const completedOrders = orders.filter((o: OrderResponseDto) => o.status === 'fulfilled').length;
  const _pendingOrders = orders.filter((o: OrderResponseDto) => o.status === 'pending').length;
  const totalSpent = orders
    .filter((o: OrderResponseDto) => o.status === 'fulfilled')
    .reduce((acc: number, o: OrderResponseDto) => {
      const total = typeof o.total === 'string' ? parseFloat(o.total) : o.total;
      return acc + (isNaN(total) ? 0 : total);
    }, 0);

  // Download keys for a fulfilled order
  const handleDownloadKeys = async (orderId: string): Promise<void> => {
    setDownloadingOrder(orderId);
    try {
      const response = await fulfillmentClient.fulfillmentControllerGetDownloadLink({ id: orderId });
      if (response.signedUrl != null && response.signedUrl !== '') {
        // Open the signed URL in a new tab to download the keys
        window.open(response.signedUrl, '_blank');
        toast.success('Keys download started!');
      } else {
        toast.error('Download link not available');
      }
    } catch (error) {
      console.error('Failed to get download link:', error);
      toast.error('Failed to download keys. Please try again.');
    } finally {
      setDownloadingOrder(null);
    }
  };

  // Recover keys for orders stuck at 'paid' status with null signedUrl
  const handleRecoverKeys = async (orderId: string): Promise<void> => {
    setRecoveringOrder(orderId);
    try {
      await fulfillmentClient.fulfillmentControllerRecoverOrder({ id: orderId });
      toast.success('Keys recovered successfully! Refreshing orders...');
      await refetchOrders();
    } catch (error) {
      console.error('Failed to recover keys:', error);
      toast.error('Failed to recover keys. Please contact support.');
    } finally {
      setRecoveringOrder(null);
    }
  };

  // Loading state
  if (user === null || user === undefined) {
    return (
      <div className="container mx-auto max-w-6xl py-8 space-y-8">
        {/* Banner Skeleton */}
        <div className="glass rounded-xl p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div className="skeleton h-8 w-64 animate-shimmer rounded" />
              <div className="skeleton h-5 w-96 animate-shimmer rounded" />
            </div>
            <div className="flex items-center gap-3">
              <div className="skeleton h-8 w-32 animate-shimmer rounded-full" />
              <div className="skeleton h-8 w-24 animate-shimmer rounded" />
            </div>
          </div>
        </div>
        {/* Stats Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-6 space-y-3">
              <div className="skeleton h-5 w-24 animate-shimmer rounded" />
              <div className="skeleton h-8 w-16 animate-shimmer rounded" />
            </div>
          ))}
        </div>
        {/* Tabs Skeleton */}
        <div className="glass rounded-xl p-1">
          <div className="skeleton h-10 w-full animate-shimmer rounded" />
        </div>
        <div className="skeleton h-64 w-full animate-shimmer rounded-xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl py-8 space-y-8" role="region" aria-label="User profile dashboard">
      {/* Neon Welcome Banner */}
      <div className="glass relative overflow-hidden rounded-xl border border-cyan-glow/20 bg-bg-secondary p-8 shadow-lg shadow-cyan-glow/5">
        <div className="absolute inset-0 opacity-30">
          <AnimatedGridPattern />
        </div>
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-text-primary">
              Welcome back, <span className="text-gradient-primary">{user.email.split('@')[0]}</span>
            </h1>
            <p className="text-text-secondary">Manage your profile, security, and digital keys all in one place.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-green-success/30 bg-green-success/10 px-4 py-1.5 backdrop-blur-sm">
              <span className="status-dot status-dot-success" />
              <span className="text-sm font-medium text-green-success">Account Active</span>
            </div>
            {user.role === 'admin' && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/50 hover:text-purple-300"
              >
                <Link href="/admin">
                  <LayoutDashboard className="h-4 w-4 mr-1.5" />
                  Admin Dashboard
                </Link>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              aria-label="Log out of your account"
              onClick={() => {
                // User confirmed logout action by clicking button
                logout();
                toast.success('Logged out successfully');
              }}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-300"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Animated Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardStatCard
          title="Total Orders"
          value={totalOrders}
          icon={Package}
          color="cyan"
          delay={0.1}
        />
        <DashboardStatCard
          title="Completed"
          value={completedOrders}
          icon={Check}
          color="green"
          delay={0.2}
        />
        <DashboardStatCard
          title="Total Spent"
          value={`€${totalSpent.toFixed(2)}`}
          icon={DollarSign}
          color="orange"
          delay={0.3}
        />
        <DashboardStatCard
          title="Digital Downloads"
          value={completedOrders}
          icon={Key}
          color="purple"
          delay={0.4}
        />
      </div>

      {/* Main Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="glass grid w-full grid-cols-6 border border-border/30 bg-bg-secondary/50 p-1 backdrop-blur-sm">
          <TabsTrigger
            value="overview"
            aria-label="Overview tab - view dashboard summary"
            className="flex items-center justify-center gap-1.5 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-cyan-glow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary data-[state=active]:bg-cyan-glow/10 data-[state=active]:text-cyan-glow data-[state=active]:shadow-glow-sm"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger
            value="purchases"
            aria-label="My Purchases tab - view order history and download keys"
            className="flex items-center justify-center gap-1.5 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-cyan-glow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary data-[state=active]:bg-cyan-glow/10 data-[state=active]:text-cyan-glow data-[state=active]:shadow-glow-sm"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Purchases</span>
          </TabsTrigger>
          <TabsTrigger
            value="watchlist"
            aria-label="Watchlist tab - view and manage your saved products"
            className="flex items-center justify-center gap-1.5 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-cyan-glow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary data-[state=active]:bg-cyan-glow/10 data-[state=active]:text-cyan-glow data-[state=active]:shadow-glow-sm"
          >
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Watchlist</span>
          </TabsTrigger>
          <TabsTrigger
            value="account"
            aria-label="Account tab - view profile information"
            className="flex items-center justify-center gap-1.5 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-cyan-glow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary data-[state=active]:bg-cyan-glow/10 data-[state=active]:text-cyan-glow data-[state=active]:shadow-glow-sm"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
          <TabsTrigger
            value="security"
            aria-label="Security tab - manage password and security settings"
            className="flex items-center justify-center gap-1.5 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-cyan-glow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary data-[state=active]:bg-cyan-glow/10 data-[state=active]:text-cyan-glow data-[state=active]:shadow-glow-sm"
          >
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>

          <TabsTrigger
            value="help"
            aria-label="Help tab - frequently asked questions and support"
            className="flex items-center justify-center gap-1.5 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-cyan-glow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary data-[state=active]:bg-cyan-glow/10 data-[state=active]:text-cyan-glow data-[state=active]:shadow-glow-sm"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Help</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Recent Orders */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-2"
            >
              <Card className="glass border-border/50 bg-bg-secondary/50 backdrop-blur-sm transition-all duration-300 hover:border-cyan-glow/20 hover:shadow-glow-sm focus-within:ring-2 focus-within:ring-cyan-glow/30">
                <CardHeader>
                  <CardTitle className="text-text-primary">Recent Orders</CardTitle>
                  <CardDescription className="text-text-secondary">Your latest purchases and delivery status</CardDescription>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="flex h-40 items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-cyan-glow" />
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="flex h-40 flex-col items-center justify-center text-text-muted">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-glow/5 border border-cyan-glow/10">
                        <Package className="h-8 w-8 text-cyan-glow/30" />
                      </div>
                      <p className="text-lg font-medium text-text-secondary">No orders yet</p>
                      <p className="text-sm text-text-muted mt-1">Start shopping to see your orders here</p>
                      <Button variant="outline" size="sm" asChild className="mt-4 border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10">
                        <Link href="/">Browse Games</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.slice(0, 5).map((order: OrderResponseDto, index) => (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          key={order.id}
                          className="group flex items-center justify-between rounded-lg border border-transparent bg-bg-tertiary/30 p-4 transition-all hover:border-cyan-glow/30 hover:bg-bg-tertiary/50 hover:shadow-[0_0_15px_rgba(0,217,255,0.05)]"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-primary text-cyan-glow">
                              <Package className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium text-text-primary font-mono">{order.id.slice(0, 8)}</p>
                              <p className="text-sm text-text-secondary">
                                {new Date(order.createdAt ?? new Date()).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="crypto-amount font-bold text-text-primary">
                              €{(() => { const total = typeof order.total === 'string' ? parseFloat(order.total) : (order.total ?? 0); return typeof total === 'number' ? total.toFixed(2) : '0.00'; })()}
                            </p>
                            <Badge
                              variant={order.status === 'fulfilled' ? 'default' : 'secondary'}
                              className={order.status === 'fulfilled'
                                ? 'badge-success'
                                : order.status === 'paid'
                                  ? 'badge-info'
                                  : order.status === 'failed'
                                    ? 'badge-error'
                                    : 'badge-warning'
                              }
                            >
                              <span className={`status-dot mr-1.5 ${
                                order.status === 'fulfilled' ? 'status-dot-success' 
                                : order.status === 'paid' ? 'status-dot-info'
                                : order.status === 'failed' ? 'status-dot-error'
                                : 'status-dot-warning'
                              }`} />
                              {order.status ?? 'pending'}
                            </Badge>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions / Promo */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Card className="glass border-purple-neon/20 bg-linear-to-br from-bg-secondary to-purple-neon/5 backdrop-blur-sm transition-all duration-300 hover:border-purple-neon/40 hover:shadow-[0_0_20px_rgba(157,78,221,0.15)]">
                <CardHeader>
                  <CardTitle className="text-text-primary">Need Help?</CardTitle>
                  <CardDescription className="text-text-secondary">Contact our support team for assistance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-purple-neon/20 bg-purple-neon/10 p-4">
                    <p className="text-sm text-purple-neon">
                      Our support team is available 24/7 to help with any issues regarding your keys or payments.
                    </p>
                  </div>
                  <GlowButton 
                    variant="secondary" 
                    className="w-full"
                    onClick={() => {
                      // Try to open Tawk.to chat if available, fallback to email
                      const tawkWindow = window as unknown as { Tawk_API?: { maximize?: () => void } };
                      if (typeof window !== 'undefined' && tawkWindow.Tawk_API !== null && tawkWindow.Tawk_API !== undefined && typeof tawkWindow.Tawk_API.maximize === 'function') {
                        tawkWindow.Tawk_API.maximize();
                      } else {
                        window.open(`mailto:support@bitloot.io?subject=Support Request&body=Hi, I need help with my account (${user?.email ?? 'Unknown'}).`, '_blank');
                      }
                    }}
                  >
                    Contact Support
                  </GlowButton>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* My Purchases Tab - Comprehensive Order History */}
        <TabsContent value="purchases" className="space-y-6">
          <Card className="glass border-border/50 bg-bg-secondary/50 backdrop-blur-sm transition-all duration-300 hover:border-cyan-glow/20 focus-within:ring-2 focus-within:ring-cyan-glow/30">
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-neon/10 border border-purple-neon/20">
                    <ShoppingBag className="h-5 w-5 text-purple-neon" />
                  </div>
                  <div>
                    <CardTitle className="text-text-primary">Purchase History</CardTitle>
                    <CardDescription className="text-text-secondary">{totalOrders} orders • {completedOrders} completed • €{totalSpent.toFixed(2)} total spent</CardDescription>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => void refetchOrders()}
                  disabled={ordersLoading}
                  className="border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${ordersLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {ordersLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="h-10 w-10 animate-spin text-purple-neon" />
                  <p className="text-text-secondary">Loading your purchase history...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ShoppingBag className="h-16 w-16 text-text-muted/30 mb-4" />
                  <h3 className="text-lg font-semibold text-text-primary mb-2">No purchases yet</h3>
                  <p className="text-text-secondary mb-4">Start exploring our catalog to find amazing deals!</p>
                  <Link href="/">
                    <Button className="bg-purple-neon hover:bg-purple-neon/80">
                      Browse Products
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order: OrderResponseDto, index) => {
                    const isExpanded = expandedOrders.has(order.id);
                    const isFulfilled = order.status === 'fulfilled';
                    const isPaid = order.status === 'paid';
                    const isFailed = order.status === 'failed' || order.status === 'underpaid';
                    const isPending = order.status === 'waiting' || order.status === 'pending' || order.status === 'confirming';
                    
                    // Map order items to KeyReveal format using real product titles
                    const keyRevealItems: OrderItem[] = order.items.map((item: OrderItemResponseDto) => ({
                      id: item.id,
                      productId: item.productId,
                      productTitle: item.productTitle,
                      quantity: 1,
                    }));

                    return (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`group rounded-xl border transition-all duration-300 ${
                          isFulfilled 
                            ? 'border-green-success/30 bg-green-success/5 hover:border-green-success/50' 
                            : isFailed
                            ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/50'
                            : isPaid
                            ? 'border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50'
                            : 'border-border/50 bg-bg-tertiary/30 hover:border-purple-neon/20 hover:bg-bg-tertiary/50'
                        }`}
                      >
                        {/* Order Header - Clickable to expand */}
                        <div 
                          className="p-5 cursor-pointer"
                          onClick={() => {
                            const newExpanded = new Set(expandedOrders);
                            if (isExpanded) {
                              newExpanded.delete(order.id);
                            } else {
                              newExpanded.add(order.id);
                            }
                            setExpandedOrders(newExpanded);
                          }}
                        >
                          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-12 w-12 items-center justify-center rounded-lg border ${
                                isFulfilled 
                                  ? 'bg-green-success/10 border-green-success/30' 
                                  : isFailed
                                  ? 'bg-red-500/10 border-red-500/30'
                                  : isPaid
                                  ? 'bg-blue-500/10 border-blue-500/30'
                                  : 'bg-purple-neon/10 border-purple-neon/20'
                              }`}>
                                {isFulfilled ? (
                                  <Key className="h-6 w-6 text-green-success" />
                                ) : isFailed ? (
                                  <AlertCircle className="h-6 w-6 text-red-500" />
                                ) : isPaid ? (
                                  <RefreshCw className="h-6 w-6 text-blue-400" />
                                ) : (
                                  <Package className="h-6 w-6 text-purple-neon" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-text-primary">
                                    Order #{order.id.slice(-8).toUpperCase()}
                                  </p>
                                  <Badge variant="outline" className="text-xs">
                                    {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-text-secondary line-clamp-1">
                                  {order.items.length === 1 
                                    ? (order.items[0]?.productTitle ?? 'Unknown Product')
                                    : order.items.length > 1
                                    ? `${order.items[0]?.productTitle ?? 'Product'} + ${order.items.length - 1} more`
                                    : 'No items'}
                                </p>
                                <p className="text-xs text-text-tertiary mt-0.5">
                                  {order.createdAt != null
                                    ? new Date(order.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })
                                    : 'Date unknown'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge
                                className={
                                  isFulfilled
                                    ? 'bg-green-success/20 text-green-success border-green-success/30'
                                    : isFailed
                                    ? 'bg-red-500/20 text-red-500 border-red-500/30'
                                    : isPaid
                                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                    : order.status === 'confirming'
                                    ? 'bg-orange-warning/20 text-orange-warning border-orange-warning/30'
                                    : 'bg-cyan-glow/20 text-cyan-glow border-cyan-glow/30'
                                }
                              >
                                {isFulfilled && <Check className="h-3 w-3 mr-1" />}
                                {order.status ?? 'pending'}
                              </Badge>
                              <span className="font-bold text-lg text-text-primary">
                                €{(() => { const total = typeof order.total === 'string' ? parseFloat(order.total) : (order.total ?? 0); return typeof total === 'number' ? total.toFixed(2) : '0.00'; })()}
                              </span>
                              <div className="text-text-muted">
                                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                              </div>
                            </div>
                          </div>
                          
                          {/* Quick action buttons (always visible) */}
                          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/30">
                            {isFulfilled && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); void handleDownloadKeys(order.id); }}
                                  disabled={downloadingOrder === order.id}
                                  className="bg-green-success hover:bg-green-success/80 text-black"
                                >
                                  {downloadingOrder === order.id ? (
                                    <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Downloading...</>
                                  ) : (
                                    <><Download className="h-4 w-4 mr-1" />Download All Keys</>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => { e.stopPropagation(); setExpandedOrders(prev => new Set(prev).add(order.id)); }}
                                  className="border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Keys
                                </Button>
                              </>
                            )}
                            {isPaid && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => { e.stopPropagation(); void handleRecoverKeys(order.id); }}
                                disabled={recoveringOrder === order.id}
                                className="border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                              >
                                {recoveringOrder === order.id ? (
                                  <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Recovering...</>
                                ) : (
                                  <><RefreshCw className="h-4 w-4 mr-1" />Recover Keys</>
                                )}
                              </Button>
                            )}
                            {isPending && (
                              <div className="flex items-center gap-2 text-sm text-text-secondary">
                                <Loader2 className="h-4 w-4 animate-spin text-orange-warning" />
                                <span>
                                  {order.status === 'confirming' ? 'Payment being confirmed...' : 
                                   order.status === 'waiting' ? 'Awaiting payment...' : 
                                   'Processing...'}
                                </span>
                              </div>
                            )}
                            {isFailed && (
                              <div className="flex items-center gap-2 text-sm text-red-400">
                                <AlertCircle className="h-4 w-4" />
                                <span>{order.status === 'underpaid' ? 'Insufficient payment received' : 'Payment failed'}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Expanded Order Details with KeyReveal */}
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="border-t border-border/30 px-5 pb-5"
                          >
                            <div className="pt-5 space-y-4">
                              {/* Order Details Summary */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-bg-primary/50 border border-border/30">
                                <div>
                                  <p className="text-xs text-text-muted uppercase tracking-wider">Order ID</p>
                                  <p className="font-mono text-sm text-text-primary truncate">{order.id}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-text-muted uppercase tracking-wider">Total Items</p>
                                  <p className="font-semibold text-text-primary">{order.items.length}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-text-muted uppercase tracking-wider">Payment</p>
                                  <p className="font-semibold text-text-primary">€{(() => { const total = typeof order.total === 'string' ? parseFloat(order.total) : (order.total ?? 0); return typeof total === 'number' ? total.toFixed(2) : '0.00'; })()}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-text-muted uppercase tracking-wider">Status</p>
                                  <p className={`font-semibold ${
                                    isFulfilled ? 'text-green-success' : 
                                    isFailed ? 'text-red-500' : 
                                    isPaid ? 'text-blue-400' : 
                                    'text-orange-warning'
                                  }`}>
                                    {(order.status ?? 'pending').charAt(0).toUpperCase() + (order.status ?? 'pending').slice(1)}
                                  </p>
                                </div>
                              </div>

                              {/* KeyReveal Component for Fulfilled Orders */}
                              {(isFulfilled || isPaid) && order.items.length > 0 && (
                                <div className="mt-4">
                                  <KeyReveal
                                    orderId={order.id}
                                    items={keyRevealItems}
                                    isFulfilled={isFulfilled}
                                    variant="default"
                                  />
                                </div>
                              )}

                              {/* Items List for Non-Fulfilled Orders */}
                              {!isFulfilled && !isPaid && order.items.length > 0 && (
                                <div className="space-y-2">
                                  <h4 className="font-medium text-text-primary flex items-center gap-2">
                                    <Package className="h-4 w-4 text-purple-neon" />
                                    Order Items
                                  </h4>
                                  <div className="space-y-2">
                                    {order.items.map((item: OrderItemResponseDto, itemIndex) => (
                                      <div
                                        key={item.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-bg-primary/50 border border-border/30"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className="flex h-8 w-8 items-center justify-center rounded bg-purple-neon/10 text-purple-neon text-sm font-bold">
                                            {itemIndex + 1}
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium text-text-primary">
                                              {item.productTitle}
                                            </p>
                                            <p className="text-xs text-text-muted">
                                              Source: {item.sourceType ?? 'custom'}
                                            </p>
                                          </div>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                          {isPending ? 'Pending' : isFailed ? 'Failed' : 'Processing'}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Copy Order ID */}
                              <div className="flex justify-end pt-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-text-muted hover:text-cyan-glow"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void navigator.clipboard.writeText(order.id);
                                    toast.success('Order ID copied to clipboard');
                                  }}
                                >
                                  <Copy className="h-4 w-4 mr-1" />
                                  Copy Order ID
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab - OTP-Based Authentication */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Security Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-1"
            >
              <Card className="glass h-full border-border/50 bg-bg-secondary/50 backdrop-blur-sm transition-all duration-300 hover:border-green-success/30 hover:shadow-[0_0_20px_rgba(57,255,20,0.1)]">
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="relative mb-4">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-success/10 border-2 border-green-success/30">
                      <Fingerprint className="h-12 w-12 text-green-success" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-green-success text-bg-primary">
                      <Check className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-1">Passwordless Auth</h3>
                  <p className="text-sm text-text-secondary mb-4">Your account uses secure OTP verification</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge className="badge-success">
                      <span className="status-dot status-dot-success mr-1" />
                      <Shield className="h-3 w-3 mr-1" /> OTP Protected
                    </Badge>
                    {user.emailConfirmed && (
                      <Badge className="badge-info">
                        <span className="status-dot status-dot-info mr-1" />
                        <Mail className="h-3 w-3 mr-1" /> Email Verified
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Email Management */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="lg:col-span-2"
            >
              <Card className="glass border-border/50 bg-bg-secondary/50 backdrop-blur-sm transition-all duration-300 hover:border-cyan-glow/20">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-glow/10 border border-cyan-glow/20">
                      <Mail className="h-5 w-5 text-cyan-glow" />
                    </div>
                    <div>
                      <CardTitle className="text-text-primary">Email Address</CardTitle>
                      <CardDescription className="text-text-secondary">Manage your account email</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Current Email Display */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-bg-tertiary/30 border border-border/30">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-text-muted" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">{user?.email}</p>
                        <p className="text-xs text-text-secondary">Primary email address</p>
                      </div>
                    </div>
                    {user.emailConfirmed && (
                      <Badge className="badge-success text-xs">
                        <Check className="h-3 w-3 mr-1" /> Verified
                      </Badge>
                    )}
                  </div>

                  {/* Email Change Form */}
                  <AnimatePresence mode="wait">
                    {isEmailChangeStep === 'idle' && (
                      <motion.div
                        key="email-form"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3"
                      >
                        <div className="flex gap-2">
                          <Input
                            type="email"
                            placeholder="Enter new email address"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="flex-1 bg-bg-tertiary/50 border-border/50"
                          />
                          <Button
                            onClick={() => void requestEmailChangeMutation.mutateAsync(newEmail)}
                            disabled={!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail) || requestEmailChangeMutation.isPending}
                            className="bg-cyan-glow/10 text-cyan-glow hover:bg-cyan-glow/20 border border-cyan-glow/30"
                          >
                            {requestEmailChangeMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Change Email'
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {isEmailChangeStep === 'otp' && (
                      <motion.div
                        key="otp-form"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                      >
                        <div className="p-4 rounded-lg bg-cyan-glow/5 border border-cyan-glow/20 space-y-4">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-text-secondary">
                              <p className="font-medium text-text-primary mb-1">Dual verification required</p>
                              <p>For your security, we&apos;ve sent verification codes to both your current email (<span className="font-medium text-cyan-glow">{user?.email}</span>) and new email (<span className="font-medium text-cyan-glow">{newEmail}</span>).</p>
                            </div>
                          </div>

                          {/* Current Email OTP */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">
                              Code from current email ({user?.email})
                            </label>
                            <Input
                              type="text"
                              placeholder="Enter 6-digit code"
                              value={oldEmailOtp}
                              onChange={(e) => setOldEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              maxLength={6}
                              className="bg-bg-tertiary/50 border-border/50 font-mono tracking-widest text-center"
                            />
                          </div>

                          {/* New Email OTP */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">
                              Code from new email ({newEmail})
                            </label>
                            <Input
                              type="text"
                              placeholder="Enter 6-digit code"
                              value={newEmailOtp}
                              onChange={(e) => setNewEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              maxLength={6}
                              className="bg-bg-tertiary/50 border-border/50 font-mono tracking-widest text-center"
                            />
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-2">
                            <Button
                              onClick={() => void verifyEmailChangeMutation.mutateAsync({ oldCode: oldEmailOtp, newCode: newEmailOtp })}
                              disabled={oldEmailOtp.length !== 6 || newEmailOtp.length !== 6 || verifyEmailChangeMutation.isPending}
                              className="flex-1 bg-green-success/10 text-green-success hover:bg-green-success/20 border border-green-success/30"
                            >
                              {verifyEmailChangeMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Check className="h-4 w-4 mr-2" />
                              )}
                              Verify Both Codes
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setIsEmailChangeStep('idle');
                                setOldEmailOtp('');
                                setNewEmailOtp('');
                              }}
                              className="text-text-muted hover:text-text-primary"
                            >
                              <X className="h-4 w-4 mr-1" /> Cancel
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Active Sessions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Card className="glass border-border/50 bg-bg-secondary/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-success/10 border border-green-success/20">
                      <Key className="h-5 w-5 text-green-success" />
                    </div>
                    <div>
                      <CardTitle className="text-text-primary">Active Sessions</CardTitle>
                      <CardDescription className="text-text-secondary">Devices where you&apos;re signed in</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void refetchSessions()}
                      disabled={sessionsLoading}
                      className="text-text-muted hover:text-text-primary"
                    >
                      <RefreshCw className={`h-4 w-4 ${sessionsLoading ? 'animate-spin' : ''}`} />
                    </Button>
                    {sessions.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void revokeAllSessionsMutation.mutateAsync()}
                        disabled={revokeAllSessionsMutation.isPending}
                        className="text-orange-warning border-orange-warning/30 hover:bg-orange-warning/10"
                      >
                        {revokeAllSessionsMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <LogOut className="h-4 w-4 mr-1" />
                        )}
                        Revoke All Others
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {sessionsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="p-6 rounded-lg bg-bg-tertiary/20 border border-border/30 text-center">
                    <p className="text-sm text-text-secondary">No active sessions found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                          session.isCurrent === true
                            ? 'bg-green-success/5 border-green-success/30'
                            : 'bg-bg-tertiary/30 border-border/30 hover:border-border/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                            session.isCurrent === true ? 'bg-green-success/10' : 'bg-bg-tertiary/50'
                          }`}>
                            {session.deviceInfo?.toLowerCase().includes('mobile') ? (
                              <Smartphone className={`h-5 w-5 ${session.isCurrent === true ? 'text-green-success' : 'text-text-muted'}`} />
                            ) : (
                              <Monitor className={`h-5 w-5 ${session.isCurrent === true ? 'text-green-success' : 'text-text-muted'}`} />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-text-primary">
                                {session.deviceInfo ?? 'Unknown Device'}
                              </p>
                              {session.isCurrent === true && (
                                <Badge className="badge-success text-xs">
                                  Current
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-text-muted">
                              <span>{session.ipAddress ?? 'Unknown'}</span>
                              <span>•</span>
                              <span>Last active: {session.lastActiveAt != null ? new Date(session.lastActiveAt).toLocaleDateString() : 'Unknown'}</span>
                            </div>
                          </div>
                        </div>
                        {session.isCurrent !== true && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void revokeSessionMutation.mutateAsync(session.id)}
                            disabled={revokeSessionMutation.isPending}
                            className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          >
                            {revokeSessionMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Account Deletion */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="glass border-red-500/20 bg-red-500/5 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <CardTitle className="text-text-primary">Delete Account</CardTitle>
                    <CardDescription className="text-text-secondary">Permanently delete your account and data</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {deletionStatus?.deletionRequested ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-orange-warning/10 border border-orange-warning/30">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-orange-warning shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-orange-warning mb-1">
                            Account Deletion Scheduled
                          </p>
                          <p className="text-sm text-text-secondary">
                            Your account will be permanently deleted in <span className="font-bold text-orange-warning">{deletionStatus.daysRemaining} days</span>.
                            All your data, orders, and keys will be removed.
                          </p>
                          {deletionStatus.deletionScheduledAt && (
                            <p className="text-xs text-text-muted mt-2">
                              Scheduled for: {new Date(deletionStatus.deletionScheduledAt).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => void cancelDeletionMutation.mutateAsync()}
                      disabled={cancelDeletionMutation.isPending}
                      className="w-full bg-green-success/10 text-green-success hover:bg-green-success/20 border border-green-success/30"
                    >
                      {cancelDeletionMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <X className="h-4 w-4 mr-2" />
                      )}
                      Cancel Account Deletion
                    </Button>
                  </div>
                ) : showDeleteConfirm ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                      <p className="text-sm text-text-secondary mb-3">
                        This action is <span className="font-bold text-red-500">irreversible</span>. After 30 days, all your data will be permanently deleted including:
                      </p>
                      <ul className="text-sm text-text-muted space-y-1 ml-4">
                        <li>• Your account and profile</li>
                        <li>• All purchase history</li>
                        <li>• Downloaded product keys</li>
                        <li>• Watchlist and preferences</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-text-secondary">
                        Type <span className="font-mono font-bold text-red-500">DELETE</span> to confirm:
                      </p>
                      <Input
                        type="text"
                        placeholder="Type DELETE"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        className="bg-bg-tertiary/50 border-red-500/30 focus:border-red-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmText('');
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => void requestDeletionMutation.mutateAsync()}
                        disabled={deleteConfirmText !== 'DELETE' || requestDeletionMutation.isPending}
                        className="flex-1 bg-red-500 text-white hover:bg-red-600"
                      >
                        {requestDeletionMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        Delete My Account
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-text-secondary">
                      Once deleted, your account cannot be recovered. You have 30 days to cancel.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Security Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="glass border-purple-neon/20 bg-purple-neon/5 backdrop-blur-sm">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-neon/10 border border-purple-neon/20">
                    <Info className="h-5 w-5 text-purple-neon" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary mb-2">Security Tips</h4>
                    <ul className="grid gap-2 text-sm text-text-secondary md:grid-cols-2">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-purple-neon shrink-0" />
                        Keep your email account secure
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-purple-neon shrink-0" />
                        Never share OTP codes with anyone
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-purple-neon shrink-0" />
                        Check for secure connection (HTTPS)
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-purple-neon shrink-0" />
                        OTP codes expire in 5 minutes
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-1"
            >
              <Card className="glass h-full border-border/50 bg-bg-secondary/50 backdrop-blur-sm transition-all duration-300 hover:border-cyan-glow/30 hover:shadow-[0_0_20px_rgba(0,217,255,0.1)]">
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                  {/* Avatar with initials */}
                  <div className="relative mb-4">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-cyan-glow/20 to-purple-neon/20 border-2 border-cyan-glow/30 shadow-[0_0_30px_rgba(0,217,255,0.2)]">
                      <span className="text-3xl font-bold text-cyan-glow">
                        {user.email.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    {user.role === 'admin' && (
                      <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-purple-neon text-white shadow-[0_0_15px_rgba(157,78,221,0.5)]">
                        <Crown className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-1">
                    {user.email.split('@')[0]}
                  </h3>
                  <p className="text-sm text-text-secondary mb-4 font-mono">{user.email}</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge className={user.role === 'admin' 
                      ? 'badge-featured' 
                      : 'badge-info'
                    }>
                      {user.role === 'admin' ? (
                        <><span className="status-dot mr-1" style={{ background: 'var(--pink-featured)' }} /><Crown className="h-3 w-3 mr-1" /> Admin</>
                      ) : (
                        <><span className="status-dot status-dot-info mr-1" /><User className="h-3 w-3 mr-1" /> Member</>
                      )}
                    </Badge>
                    <Badge className={user.emailConfirmed 
                      ? 'badge-success' 
                      : 'badge-warning'
                    }>
                      {user.emailConfirmed ? (
                        <><span className="status-dot status-dot-success mr-1" /><Check className="h-3 w-3 mr-1" /> Verified</>
                      ) : (
                        <><span className="status-dot status-dot-warning mr-1" /><AlertCircle className="h-3 w-3 mr-1" /> Unverified</>
                      )}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Account Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="lg:col-span-2"
            >
              <Card className="glass border-border/50 bg-bg-secondary/50 backdrop-blur-sm transition-all duration-300 hover:border-cyan-glow/20">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-glow/10 border border-cyan-glow/20">
                      <Fingerprint className="h-5 w-5 text-cyan-glow" />
                    </div>
                    <div>
                      <CardTitle className="text-text-primary">Account Details</CardTitle>
                      <CardDescription className="text-text-secondary">Your profile information and settings</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Email Field */}
                  <div className="group rounded-lg border border-border/30 bg-bg-tertiary/30 p-4 transition-all hover:border-cyan-glow/20 hover:bg-bg-tertiary/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-glow/10">
                          <Mail className="h-4 w-4 text-cyan-glow" />
                        </div>
                        <div>
                          <p className="text-xs text-text-muted uppercase tracking-wide">Email Address</p>
                          <p className="font-medium text-text-primary">{user.email}</p>
                        </div>
                      </div>
                      {user.emailConfirmed && (
                        <Badge className="badge-success">
                          <span className="status-dot status-dot-success mr-1" /><Check className="h-3 w-3 mr-1" /> Verified
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* User ID Field */}
                  <div className="group rounded-lg border border-border/30 bg-bg-tertiary/30 p-4 transition-all hover:border-cyan-glow/20 hover:bg-bg-tertiary/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-neon/10">
                          <Hash className="h-4 w-4 text-purple-neon" />
                        </div>
                        <div>
                          <p className="text-xs text-text-muted uppercase tracking-wide">User ID</p>
                          <p className="font-mono text-sm text-text-primary">{user.id}</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-text-muted hover:text-cyan-glow"
                        onClick={() => {
                          void navigator.clipboard.writeText(user.id);
                          toast.success('User ID copied to clipboard');
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Account Role Field */}
                  <div className="group rounded-lg border border-border/30 bg-bg-tertiary/30 p-4 transition-all hover:border-cyan-glow/20 hover:bg-bg-tertiary/50">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        user.role === 'admin' ? 'bg-purple-neon/10' : 'bg-cyan-glow/10'
                      }`}>
                        {user.role === 'admin' ? (
                          <Crown className="h-4 w-4 text-purple-neon" />
                        ) : (
                          <User className="h-4 w-4 text-cyan-glow" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-text-muted uppercase tracking-wide">Account Type</p>
                        <p className="font-medium text-text-primary capitalize">{user.role ?? 'Member'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Account Stats */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="rounded-lg border border-border/30 bg-bg-tertiary/30 p-4 text-center group hover:border-cyan-glow/30 transition-colors">
                      <p className="crypto-amount text-2xl font-bold text-cyan-glow">{totalOrders}</p>
                      <p className="text-xs text-text-muted">Total Orders</p>
                    </div>
                    <div className="rounded-lg border border-border/30 bg-bg-tertiary/30 p-4 text-center group hover:border-green-success/30 transition-colors">
                      <p className="crypto-amount text-2xl font-bold text-green-success">€{totalSpent.toFixed(2)}</p>
                      <p className="text-xs text-text-muted">Total Spent</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="glass border-border/50 bg-bg-secondary/50 backdrop-blur-sm">
              <CardContent className="p-5">
                <h4 className="font-semibold text-text-primary mb-4">Quick Actions</h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Button 
                    variant="outline" 
                    className="h-auto flex-col gap-2 py-4 border-border/50 hover:border-cyan-glow/30 hover:bg-cyan-glow/5"
                    onClick={() => setActiveTab('security')}
                  >
                    <Shield className="h-5 w-5 text-cyan-glow" />
                    <span className="text-sm">Change Password</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto flex-col gap-2 py-4 border-border/50 hover:border-purple-neon/30 hover:bg-purple-neon/5"
                    onClick={() => setActiveTab('purchases')}
                  >
                    <ShoppingBag className="h-5 w-5 text-purple-neon" />
                    <span className="text-sm">View Purchases</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto flex-col gap-2 py-4 border-border/50 hover:border-green-success/30 hover:bg-green-success/5"
                    onClick={() => setActiveTab('help')}
                  >
                    <HelpCircle className="h-5 w-5 text-green-success" />
                    <span className="text-sm">Get Help</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Watchlist Tab */}
        <TabsContent value="watchlist" className="space-y-6">
          <WatchlistTabContent />
        </TabsContent>

        {/* Help Tab */}
        <TabsContent value="help" className="space-y-6">
          <Card className="glass border-border/50 bg-bg-secondary/50 backdrop-blur-sm transition-all duration-300 hover:border-cyan-glow/20 focus-within:ring-2 focus-within:ring-cyan-glow/30">
            <CardHeader>
              <CardTitle className="text-text-primary">Help & Support</CardTitle>
              <CardDescription className="text-text-secondary">Frequently asked questions and support information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-2 text-text-primary">How do I download my keys?</h4>
                <p className="text-sm text-text-secondary">Keys are available immediately after purchase in the &quot;Overview&quot; tab and can be copied or downloaded.</p>
              </div>
              <Separator className="bg-border/50" />
              <div>
                <h4 className="font-medium mb-2 text-text-primary">How do I reset my password?</h4>
                <p className="text-sm text-text-secondary">Use the &quot;Security&quot; tab to change your password. You&apos;ll need to provide your current password.</p>
              </div>
              <Separator className="bg-border/50" />
              <div>
                <h4 className="font-medium mb-2 text-text-primary">Can I change my email address?</h4>
                <p className="text-sm text-text-secondary">Email addresses cannot be self-changed. Please contact our support team for assistance.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
