'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Configuration, UsersApi, type OrderResponseDto } from '@bitloot/sdk';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import { Label } from '@/design-system/primitives/label';
import { Separator } from '@/design-system/primitives/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/design-system/primitives/tabs';
import { Badge } from '@/design-system/primitives/badge';
import { Loader2, User, Shield, Lock, Key, Package, DollarSign, Check, ArrowUpRight } from 'lucide-react';
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

// Initialize SDK configuration
const apiConfig = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  accessToken: (): string => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken') ?? '';
    }
    return '';
  },
});

const usersClient = new UsersApi(apiConfig);

export default function ProfilePage(): React.ReactElement {
  const { user } = useAuth();
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

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
  const pendingOrders = orders.filter((o: OrderResponseDto) => o.status === 'pending').length;
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
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-glow" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Neon Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl border border-cyan-glow/20 bg-bg-secondary p-8 shadow-lg shadow-cyan-glow/5">
        <div className="absolute inset-0 opacity-30">
          <AnimatedGridPattern />
        </div>
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-text-primary">
              Welcome back, <span className="text-cyan-glow">{user.email.split('@')[0]}</span>
            </h1>
            <p className="text-text-secondary">Manage your profile, security, and digital keys all in one place.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-cyan-glow/30 bg-cyan-glow/10 px-4 py-1.5 backdrop-blur-sm">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-success shadow-[0_0_8px_#39FF14]" />
            <span className="text-sm font-medium text-cyan-glow">Account Active</span>
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
          value={`$${totalSpent.toFixed(2)}`}
          icon={DollarSign}
          color="orange"
          delay={0.3}
        />
        <DashboardStatCard
          title="Digital Keys"
          value={completedOrders}
          icon={Key}
          color="purple"
          delay={0.4}
        />
      </div>

      {/* Main Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-bg-secondary/50 p-1 backdrop-blur-sm">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-cyan-glow/10 data-[state=active]:text-cyan-glow"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-cyan-glow/10 data-[state=active]:text-cyan-glow"
          >
            Security
          </TabsTrigger>
          <TabsTrigger
            value="account"
            className="data-[state=active]:bg-cyan-glow/10 data-[state=active]:text-cyan-glow"
          >
            Account
          </TabsTrigger>
          <TabsTrigger
            value="help"
            className="data-[state=active]:bg-cyan-glow/10 data-[state=active]:text-cyan-glow"
          >
            Help
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
              <Card className="border-border/50 bg-bg-secondary/50 backdrop-blur-sm">
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
                      <Package className="mb-4 h-12 w-12 opacity-20" />
                      <p className="text-lg font-medium">No orders yet</p>
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
                              ${(() => { const total = typeof order.total === 'string' ? parseFloat(order.total) : (order.total ?? 0); return typeof total === 'number' ? total.toFixed(2) : '0.00'; })()}
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
              <Card className="border-purple-neon/20 bg-gradient-to-br from-bg-secondary to-purple-neon/5 backdrop-blur-sm">
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
                  <GlowButton variant="secondary" className="w-full">
                    Contact Support
                  </GlowButton>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="border-border/50 bg-bg-secondary/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-text-primary">Security Settings</CardTitle>
              <CardDescription className="text-text-secondary">Manage your password and security preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="oldPassword" className="flex items-center gap-2 text-text-secondary">
                    <Lock className="h-4 w-4 text-cyan-glow" />
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
                    <p className="text-sm text-destructive">{errors.oldPassword.message}</p>
                  )}
                </div>

                <Separator className="bg-border/50" />

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="flex items-center gap-2 text-text-secondary">
                    <Shield className="h-4 w-4 text-cyan-glow" />
                    New Password
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    {...register('newPassword')}
                    placeholder="Enter new password (min 8 characters)"
                    disabled={isSubmittingPassword}
                    className="border-border/50 bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20"
                  />
                  {errors.newPassword !== null && errors.newPassword !== undefined && (
                    <p className="text-sm text-destructive">{errors.newPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-text-secondary">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...register('confirmPassword')}
                    placeholder="Confirm new password"
                    disabled={isSubmittingPassword}
                    className="border-border/50 bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20"
                  />
                  {errors.confirmPassword !== null && errors.confirmPassword !== undefined && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <GlowButton type="submit" disabled={isSubmittingPassword} variant="primary">
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
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card className="border-border/50 bg-bg-secondary/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-text-primary">Account Information</CardTitle>
              <CardDescription className="text-text-secondary">Your profile and account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-text-secondary">
                  <User className="h-4 w-4 text-cyan-glow" />
                  Email Address
                </Label>
                <Input value={user.email} disabled className="border-border/50 bg-bg-tertiary/50 text-text-muted" />
              </div>

              <Separator className="bg-border/50" />

              <div className="space-y-2">
                <Label className="text-text-secondary">User ID</Label>
                <Input value={user.id} disabled className="border-border/50 bg-bg-tertiary/50 font-mono text-xs text-text-muted" />
              </div>

              <Separator className="bg-border/50" />

              <div className="space-y-2">
                <Label className="text-text-secondary">Account Role</Label>
                <Badge variant="outline" className="border-cyan-glow/30 text-cyan-glow">
                  {user.role ?? 'user'}
                </Badge>
              </div>

              <Separator className="bg-border/50" />

              <div className="space-y-2">
                <Label className="text-text-secondary">Email Verified</Label>
                <Badge
                  variant={user.emailConfirmed ? 'default' : 'secondary'}
                  className={user.emailConfirmed
                    ? 'bg-green-success/20 text-green-success border-green-success/20'
                    : 'bg-orange-warning/20 text-orange-warning border-orange-warning/20'
                  }
                >
                  {user.emailConfirmed ? 'Verified' : 'Not Verified'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Help Tab */}
        <TabsContent value="help" className="space-y-6">
          <Card className="border-border/50 bg-bg-secondary/50 backdrop-blur-sm">
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
