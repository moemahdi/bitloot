'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UsersApi, type OrderResponseDto } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import { Label } from '@/design-system/primitives/label';
import { Separator } from '@/design-system/primitives/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/design-system/primitives/tabs';
import { Badge } from '@/design-system/primitives/badge';
import { Loader2, User, Shield, Lock, Key, Package, DollarSign, Check, Download, Copy, ShoppingBag, LogOut, LayoutDashboard, Eye, HelpCircle, Mail, Hash, Crown, ShieldCheck, AlertCircle, Fingerprint, KeyRound, Info } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard';
import { AnimatedGridPattern } from '@/components/animations/FloatingParticles';
import { GlowButton } from '@/design-system/primitives/glow-button';

// Validation schemas
const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm password is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

const usersClient = new UsersApi(apiConfig);

export default function ProfilePage(): React.ReactElement {
  const { user, logout } = useAuth();
  const searchParams = useSearchParams();
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  
  // Calculate password strength
  const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
    if (password === '' || password === null || password === undefined) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;
    
    if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 2) return { score, label: 'Fair', color: 'bg-orange-warning' };
    if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-500' };
    if (score <= 4) return { score, label: 'Strong', color: 'bg-green-success' };
    return { score, label: 'Very Strong', color: 'bg-cyan-glow' };
  };
  
  const passwordStrength = getPasswordStrength(newPasswordValue);
  
  // Sync activeTab with URL query params
  const urlTab = searchParams.get('tab');
  const validTabs = ['overview', 'purchases', 'security', 'account', 'help'];
  const [activeTab, setActiveTab] = useState(() => 
    urlTab !== null && validTabs.includes(urlTab) ? urlTab : 'overview'
  );

  // Update activeTab when URL changes
  useEffect(() => {
    if (urlTab !== null && validTabs.includes(urlTab)) {
      setActiveTab(urlTab);
    }
    // validTabs is a stable array, no need to include in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlTab]);

  // Fetch user's orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery<OrderResponseDto[]>({
    queryKey: ['profile-orders'],
    queryFn: async () => {
      try {
        const response = await usersClient.usersControllerGetOrdersRaw();
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
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
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

  const onPasswordSubmit = async (data: PasswordFormValues): Promise<void> => {
    setIsSubmittingPassword(true);
    try {
      await usersClient.usersControllerUpdatePassword({
        updatePasswordDto: {
          oldPassword: data.oldPassword,
          newPassword: data.newPassword,
        },
      });
      toast.success('Password updated successfully');
      reset();
    } catch (error) {
      console.error('Failed to update password:', error);
      toast.error('Failed to update password. Please check your current password.');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // Loading state
  if (user === null || user === undefined) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-glow" />
        <p className="text-sm text-text-secondary">Loading your profile...</p>
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
            <div className="flex items-center gap-2 rounded-full border border-cyan-glow/30 bg-cyan-glow/10 px-4 py-1.5 backdrop-blur-sm">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-success shadow-[0_0_8px_#39FF14]" />
              <span className="text-sm font-medium text-cyan-glow">Account Active</span>
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
        <TabsList className="glass grid w-full grid-cols-5 border border-border/30 bg-bg-secondary/50 p-1 backdrop-blur-sm">
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
                            <p className="font-bold text-text-primary">
                              €{(() => { const total = typeof order.total === 'string' ? parseFloat(order.total) : (order.total ?? 0); return typeof total === 'number' ? total.toFixed(2) : '0.00'; })()}
                            </p>
                            <Badge
                              variant={order.status === 'fulfilled' ? 'default' : 'secondary'}
                              className={order.status === 'fulfilled'
                                ? 'bg-green-success/20 text-green-success hover:bg-green-success/30 border-green-success/20'
                                : 'bg-orange-warning/20 text-orange-warning hover:bg-orange-warning/30 border-orange-warning/20'
                              }
                            >
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

        {/* My Purchases Tab */}
        <TabsContent value="purchases" className="space-y-6">
          <Card className="glass border-border/50 bg-bg-secondary/50 backdrop-blur-sm transition-all duration-300 hover:border-cyan-glow/20 focus-within:ring-2 focus-within:ring-cyan-glow/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-text-primary">
                <ShoppingBag className="h-5 w-5 text-cyan-glow" />
                My Purchases
              </CardTitle>
              <CardDescription className="text-text-secondary">View all your orders and download your digital keys</CardDescription>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-cyan-glow" />
                </div>
              ) : orders.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center text-text-muted">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-cyan-glow/10 to-purple-neon/10 border border-cyan-glow/20">
                    <ShoppingBag className="h-10 w-10 text-cyan-glow/40" />
                  </div>
                  <p className="text-lg font-medium text-text-secondary">No purchases yet</p>
                  <p className="text-sm text-text-muted mt-1 text-center max-w-xs">Your purchased games and digital keys will appear here after checkout</p>
                  <Button variant="outline" size="sm" asChild className="mt-4 border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10">
                    <Link href="/">Start Shopping</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order: OrderResponseDto, index) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={order.id}
                      className="group rounded-xl border border-border/50 bg-bg-tertiary/30 p-5 transition-all hover:border-cyan-glow/30 hover:bg-bg-tertiary/50 hover:shadow-[0_0_20px_rgba(0,217,255,0.08)]"
                    >
                      {/* Order Header */}
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-glow/10 text-cyan-glow border border-cyan-glow/20">
                            <Package className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                            <p className="text-sm text-text-secondary">
                              {new Date(order.createdAt ?? new Date()).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={order.status === 'fulfilled' ? 'default' : 'secondary'}
                            className={order.status === 'fulfilled'
                              ? 'bg-green-success/20 text-green-success hover:bg-green-success/30 border-green-success/20'
                              : order.status === 'pending'
                                ? 'bg-orange-warning/20 text-orange-warning hover:bg-orange-warning/30 border-orange-warning/20'
                                : 'bg-cyan-glow/20 text-cyan-glow hover:bg-cyan-glow/30 border-cyan-glow/20'
                            }
                          >
                            {order.status ?? 'pending'}
                          </Badge>
                          <span className="font-bold text-lg text-text-primary">
                            €{(() => { const total = typeof order.total === 'string' ? parseFloat(order.total) : (order.total ?? 0); return typeof total === 'number' ? total.toFixed(2) : '0.00'; })()}
                          </span>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="space-y-3">
                        {order.items.map((item, itemIndex) => (
                          <div
                            key={itemIndex}
                            className="flex items-center justify-between rounded-lg bg-bg-primary/50 p-4 border border-border/30"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-neon/10 text-purple-neon">
                                <Key className="h-5 w-5" />
                              </div>
                              <div>
                                {/* TODO: Fetch product name from catalog service using productId */}
                                <p className="font-medium text-text-primary">Digital Key</p>
                                <p className="text-sm text-text-secondary font-mono">SKU: {item.productId.slice(0, 8).toUpperCase()}</p>
                              </div>
                            </div>
                            {order.status === 'fulfilled' && (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  aria-label={`Copy key for ${item.productId}`}
                                  className="border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10 hover:border-cyan-glow/50"
                                  onClick={() => {
                                    // TODO: Fetch real key from secure R2 signed URL
                                    void navigator.clipboard.writeText('XXXX-XXXX-XXXX-XXXX');
                                    toast.success('Key copied to clipboard!');
                                  }}
                                >
                                  <Copy className="h-4 w-4 mr-1" />
                                  Copy Key
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  aria-label={`Download key file for ${item.productId}`}
                                  className="border-green-success/30 text-green-success hover:bg-green-success/10 hover:border-green-success/50"
                                  onClick={() => {
                                    // TODO: Fetch real key from secure R2 signed URL
                                    const blob = new Blob([`Product: ${item.productId}\nKey: XXXX-XXXX-XXXX-XXXX\nPurchased: ${new Date(order.createdAt ?? new Date()).toISOString()}`], { type: 'text/plain' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `key-${order.id.slice(0, 8)}.txt`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                    toast.success('Key downloaded!');
                                  }}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
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
                      <ShieldCheck className="h-12 w-12 text-green-success" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-green-success text-bg-primary">
                      <Check className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-1">Account Secured</h3>
                  <p className="text-sm text-text-secondary mb-4">Your account has password protection enabled</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge className="bg-green-success/20 text-green-success border-green-success/30">
                      <Lock className="h-3 w-3 mr-1" /> Password Set
                    </Badge>
                    {user.emailConfirmed && (
                      <Badge className="bg-cyan-glow/20 text-cyan-glow border-cyan-glow/30">
                        <Mail className="h-3 w-3 mr-1" /> Email Verified
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Change Password Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="lg:col-span-2"
            >
              <Card className="glass border-border/50 bg-bg-secondary/50 backdrop-blur-sm transition-all duration-300 hover:border-cyan-glow/20 focus-within:ring-2 focus-within:ring-cyan-glow/30">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-glow/10 border border-cyan-glow/20">
                      <KeyRound className="h-5 w-5 text-cyan-glow" />
                    </div>
                    <div>
                      <CardTitle className="text-text-primary">Change Password</CardTitle>
                      <CardDescription className="text-text-secondary">Update your account password</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="oldPassword" className="flex items-center gap-2 text-text-secondary text-sm">
                        <Lock className="h-4 w-4 text-text-muted" />
                        Current Password
                      </Label>
                      <Input
                        id="oldPassword"
                        type="password"
                        {...register('oldPassword')}
                        placeholder="Enter current password"
                        disabled={isSubmittingPassword}
                        className="border-border/50 bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20"
                      />
                      {errors.oldPassword !== null && errors.oldPassword !== undefined && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.oldPassword.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="flex items-center gap-2 text-text-secondary text-sm">
                        <Shield className="h-4 w-4 text-text-muted" />
                        New Password
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        {...register('newPassword')}
                        placeholder="Enter new password (min 8 characters)"
                        disabled={isSubmittingPassword}
                        className="border-border/50 bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20"
                        onChange={(e) => setNewPasswordValue(e.target.value)}
                      />
                      {/* Password Strength Indicator */}
                      {newPasswordValue !== '' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-2 pt-2"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-text-secondary">Password strength:</span>
                            <span className={`font-semibold ${
                              passwordStrength.score <= 1 ? 'text-red-500' :
                              passwordStrength.score <= 2 ? 'text-orange-warning' :
                              passwordStrength.score <= 3 ? 'text-yellow-500' :
                              passwordStrength.score <= 4 ? 'text-green-success' :
                              'text-cyan-glow'
                            }`}>
                              {passwordStrength.label}
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-bg-tertiary overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                              className={`h-full transition-colors duration-300 ${passwordStrength.color}`}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            <div className={`flex items-center gap-2 text-xs rounded-md p-2 transition-colors ${
                              newPasswordValue.length >= 8 
                                ? 'bg-green-success/10 text-green-success border border-green-success/20' 
                                : 'bg-bg-tertiary/50 text-text-muted border border-transparent'
                            }`}>
                              {newPasswordValue.length >= 8 ? <Check className="h-3.5 w-3.5" /> : <span className="h-3.5 w-3.5 rounded-full border border-current" />}
                              8+ characters
                            </div>
                            <div className={`flex items-center gap-2 text-xs rounded-md p-2 transition-colors ${
                              /[a-z]/.test(newPasswordValue) && /[A-Z]/.test(newPasswordValue)
                                ? 'bg-green-success/10 text-green-success border border-green-success/20' 
                                : 'bg-bg-tertiary/50 text-text-muted border border-transparent'
                            }`}>
                              {/[a-z]/.test(newPasswordValue) && /[A-Z]/.test(newPasswordValue) ? <Check className="h-3.5 w-3.5" /> : <span className="h-3.5 w-3.5 rounded-full border border-current" />}
                              Mixed case
                            </div>
                            <div className={`flex items-center gap-2 text-xs rounded-md p-2 transition-colors ${
                              /\d/.test(newPasswordValue)
                                ? 'bg-green-success/10 text-green-success border border-green-success/20' 
                                : 'bg-bg-tertiary/50 text-text-muted border border-transparent'
                            }`}>
                              {/\d/.test(newPasswordValue) ? <Check className="h-3.5 w-3.5" /> : <span className="h-3.5 w-3.5 rounded-full border border-current" />}
                              Number
                            </div>
                            <div className={`flex items-center gap-2 text-xs rounded-md p-2 transition-colors ${
                              /[^a-zA-Z\d]/.test(newPasswordValue)
                                ? 'bg-green-success/10 text-green-success border border-green-success/20' 
                                : 'bg-bg-tertiary/50 text-text-muted border border-transparent'
                            }`}>
                              {/[^a-zA-Z\d]/.test(newPasswordValue) ? <Check className="h-3.5 w-3.5" /> : <span className="h-3.5 w-3.5 rounded-full border border-current" />}
                              Special char
                            </div>
                          </div>
                        </motion.div>
                      )}
                      {errors.newPassword !== null && errors.newPassword !== undefined && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.newPassword.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-text-secondary text-sm">
                        <Check className="h-4 w-4 text-text-muted" />
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        {...register('confirmPassword')}
                        placeholder="Confirm new password"
                        disabled={isSubmittingPassword}
                        className="border-border/50 bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20"
                      />
                      {errors.confirmPassword !== null && errors.confirmPassword !== undefined && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end pt-2">
                      <GlowButton type="submit" disabled={isSubmittingPassword} variant="default">
                        {isSubmittingPassword ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Shield className="mr-2 h-4 w-4" />
                            Update Password
                          </>
                        )}
                      </GlowButton>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>

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
                        Use a unique password for BitLoot
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-purple-neon shrink-0" />
                        Never share your password with anyone
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-purple-neon shrink-0" />
                        Check for secure connection (HTTPS)
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
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-cyan-glow/20 to-purple-neon/20 border-2 border-cyan-glow/30 shadow-[0_0_30px_rgba(0,217,255,0.2)]">
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
                      ? 'bg-purple-neon/20 text-purple-neon border-purple-neon/30' 
                      : 'bg-cyan-glow/20 text-cyan-glow border-cyan-glow/30'
                    }>
                      {user.role === 'admin' ? (
                        <><Crown className="h-3 w-3 mr-1" /> Admin</>
                      ) : (
                        <><User className="h-3 w-3 mr-1" /> Member</>
                      )}
                    </Badge>
                    <Badge className={user.emailConfirmed 
                      ? 'bg-green-success/20 text-green-success border-green-success/30' 
                      : 'bg-orange-warning/20 text-orange-warning border-orange-warning/30'
                    }>
                      {user.emailConfirmed ? (
                        <><Check className="h-3 w-3 mr-1" /> Verified</>
                      ) : (
                        <><AlertCircle className="h-3 w-3 mr-1" /> Unverified</>
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
                        <Badge className="bg-green-success/20 text-green-success border-green-success/20">
                          <Check className="h-3 w-3 mr-1" /> Verified
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
                    <div className="rounded-lg border border-border/30 bg-bg-tertiary/30 p-4 text-center">
                      <p className="text-2xl font-bold text-cyan-glow">{totalOrders}</p>
                      <p className="text-xs text-text-muted">Total Orders</p>
                    </div>
                    <div className="rounded-lg border border-border/30 bg-bg-tertiary/30 p-4 text-center">
                      <p className="text-2xl font-bold text-green-success">€{totalSpent.toFixed(2)}</p>
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
