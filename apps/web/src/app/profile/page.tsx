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
import { Loader2, User, Shield, Lock, Key, Package, DollarSign, Check } from 'lucide-react';
import { toast } from 'sonner';
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl bg-linear-to-r from-primary to-blue-800 p-8 text-primary-foreground shadow-lg">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user.email.split('@')[0]}</h1>
            <p className="text-blue-100">Manage your profile, security, and digital keys all in one place.</p>
          </div>
        </div>
        {/* Decorative background */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-black/10 blur-3xl" />
      </div>

      {/* Quick Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
              <h3 className="text-2xl font-bold">{totalOrders}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-green-100 p-3 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <Check className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <h3 className="text-2xl font-bold">{completedOrders}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-orange-100 p-3 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
              <h3 className="text-2xl font-bold">${totalSpent.toFixed(2)}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-purple-100 p-3 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <Key className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Digital Keys</p>
              <h3 className="text-2xl font-bold">{completedOrders}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="help">Help</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Recent Orders */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Your latest purchases and delivery status</CardDescription>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="flex h-40 items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="flex h-40 flex-col items-center justify-center text-muted-foreground">
                      <Package className="mb-4 h-12 w-12 opacity-20" />
                      <p className="text-lg font-medium">No orders yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.slice(0, 5).map((order: OrderResponseDto) => (
                        <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                          <div>
                            <p className="font-medium">{order.id.slice(0, 8)}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.createdAt ?? new Date()).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${(() => { const total = typeof order.total === 'string' ? parseFloat(order.total) : (order.total ?? 0); return typeof total === 'number' ? total.toFixed(2) : '0.00'; })()}</p>
                            <Badge variant={order.status === 'fulfilled' ? 'default' : 'secondary'}>
                              {order.status ?? 'pending'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Orders</p>
                    <p className="text-3xl font-bold text-orange-600">{pendingOrders}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Available Keys</p>
                    <p className="text-3xl font-bold text-green-600">{completedOrders}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your password and security preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="oldPassword" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Current Password
                  </Label>
                  <Input
                    id="oldPassword"
                    type="password"
                    {...register('oldPassword')}
                    placeholder="Enter current password"
                    disabled={isSubmittingPassword}
                  />
                  {errors.oldPassword !== null && errors.oldPassword !== undefined && (
                    <p className="text-sm text-destructive">{errors.oldPassword.message}</p>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    New Password
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    {...register('newPassword')}
                    placeholder="Enter new password (min 8 characters)"
                    disabled={isSubmittingPassword}
                  />
                  {errors.newPassword !== null && errors.newPassword !== undefined && (
                    <p className="text-sm text-destructive">{errors.newPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...register('confirmPassword')}
                    placeholder="Confirm new password"
                    disabled={isSubmittingPassword}
                  />
                  {errors.confirmPassword !== null && errors.confirmPassword !== undefined && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isSubmittingPassword}>
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
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your profile and account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Email Address
                </Label>
                <Input value={user.email} disabled className="bg-muted" />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>User ID</Label>
                <Input value={user.id} disabled className="bg-muted font-mono text-xs" />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Account Role</Label>
                <Badge variant="outline">
                  {user.role ?? 'user'}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Email Verified</Label>
                <Badge variant={user.emailConfirmed ? 'default' : 'secondary'}>
                  {user.emailConfirmed ? 'Verified' : 'Not Verified'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Help Tab */}
        <TabsContent value="help" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Help & Support</CardTitle>
              <CardDescription>Frequently asked questions and support information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">How do I download my keys?</h4>
                <p className="text-sm text-muted-foreground">Keys are available immediately after purchase in the &quot;Overview&quot; tab and can be copied or downloaded.</p>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">How do I reset my password?</h4>
                <p className="text-sm text-muted-foreground">Use the &quot;Security&quot; tab to change your password. You&apos;ll need to provide your current password.</p>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Can I change my email address?</h4>
                <p className="text-sm text-muted-foreground">Email addresses cannot be self-changed. Please contact our support team for assistance.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
