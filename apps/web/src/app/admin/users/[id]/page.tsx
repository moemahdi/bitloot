'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/design-system/primitives/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/design-system/primitives/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/design-system/primitives/dialog';
import { Textarea } from '@/design-system/primitives/textarea';
import { Label } from '@/design-system/primitives/label';
import { Separator } from '@/design-system/primitives/separator';
import { TooltipProvider } from '@/design-system/primitives/tooltip';
import { 
  ArrowLeft,
  Loader2, 
  User,
  Mail,
  MailCheck,
  Clock,
  Crown,
  Shield,
  ShieldOff,
  Ban,
  UserCheck,
  Trash2,
  RotateCcw,
  LogOut,
  Activity,
  ShoppingCart,
  Star,
  Heart,
  Tag,
  Monitor,
  Globe,
  Copy,
  Check,
  AlertTriangle,
  Smartphone,
  Laptop,
  XCircle,
  RefreshCw,
  CreditCard,
  MessageSquare,
  Percent,
  Eye,
  Bookmark,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatDate } from '@/utils/format-date';
import { useAdminGuard } from '@/features/admin/hooks/useAdminGuard';
import {
  useUserDetail,
  useUserSessions,
  useUserOrders,
  useUserReviews,
  useUserPromos,
  useUserWatchlist,
  useUserActivity,
  useChangeRole,
  useSuspendUser,
  useUnsuspendUser,
  useDeleteUser,
  useRestoreUser,
  useHardDeleteUser,
  useForceLogout,
  useRevokeSession,
  type AdminUserDetailDto,
} from '@/features/admin/hooks/useAdminUsers';

/**
 * Get user status info
 */
function getUserStatusInfo(user: AdminUserDetailDto): { label: string; color: string; icon: React.ReactNode } {
  if (user.deletedAt != null) {
    return { 
      label: 'Deleted', 
      color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      icon: <XCircle className="h-4 w-4" />
    };
  }
  if (user.isSuspended) {
    return { 
      label: 'Suspended', 
      color: 'bg-destructive/20 text-destructive border-destructive/30',
      icon: <Ban className="h-4 w-4" />
    };
  }
  return { 
    label: 'Active', 
    color: 'bg-green-success/20 text-green-success border-green-success/30',
    icon: <Check className="h-4 w-4" />
  };
}

/**
 * Get role badge class
 */
function getRoleBadgeClass(role: string): string {
  return role === 'admin' 
    ? 'bg-purple-neon/20 text-purple-neon border border-purple-neon/30'
    : 'bg-cyan-glow/20 text-cyan-glow border border-cyan-glow/30';
}

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get device icon
 */
function getDeviceIcon(userAgent: string): React.ReactNode {
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return <Smartphone className="h-4 w-4" />;
  }
  return <Laptop className="h-4 w-4" />;
}

/**
 * Get order status badge class
 */
function getOrderStatusBadgeClass(status: string): string {
  switch (status) {
    case 'fulfilled':
      return 'bg-green-success/20 text-green-success border border-green-success/30';
    case 'paid':
      return 'bg-cyan-glow/20 text-cyan-glow border border-cyan-glow/30';
    case 'pending':
    case 'confirming':
      return 'bg-orange-warning/20 text-orange-warning border border-orange-warning/30';
    case 'failed':
    case 'underpaid':
      return 'bg-destructive/20 text-destructive border border-destructive/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminUserDetailPage({ params }: PageProps): React.ReactElement {
  const { id } = use(params);
  const router = useRouter();
  const { isLoading: guardLoading, isAdmin } = useAdminGuard();
  
  // Copy state
  const [copied, setCopied] = useState(false);
  
  // Dialog states
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hardDeleteDialogOpen, setHardDeleteDialogOpen] = useState(false);
  const [changeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false);
  const [forceLogoutDialogOpen, setForceLogoutDialogOpen] = useState(false);
  const [unsuspendDialogOpen, setUnsuspendDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  
  // Form states
  const [suspendReason, setSuspendReason] = useState('');
  const [selectedRole, setSelectedRole] = useState<'user' | 'admin'>('user');
  
  // Pagination config
  const SESSIONS_PER_PAGE = 10;
  const ORDERS_PER_PAGE = 10;
  const REVIEWS_PER_PAGE = 10;
  const PROMOS_PER_PAGE = 10;
  const WATCHLIST_PER_PAGE = 10;
  const ACTIVITY_PER_PAGE = 20;

  // Pagination states
  const [sessionsPage, setSessionsPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [promosPage, setPromosPage] = useState(1);
  const [watchlistPage, setWatchlistPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);

  // Queries - hooks expect (userId, limit, offset)
  const { user, isLoading, refetch: refetchUser } = useUserDetail(id);
  const { sessions, total: totalSessions, isLoading: sessionsLoading, refetch: refetchSessions } = useUserSessions(id, SESSIONS_PER_PAGE, (sessionsPage - 1) * SESSIONS_PER_PAGE);
  const { orders, total: totalOrders, isLoading: ordersLoading } = useUserOrders(id, ORDERS_PER_PAGE, (ordersPage - 1) * ORDERS_PER_PAGE);
  const { reviews, total: totalReviews, isLoading: reviewsLoading } = useUserReviews(id, REVIEWS_PER_PAGE, (reviewsPage - 1) * REVIEWS_PER_PAGE);
  const { promos, total: totalPromos, isLoading: promosLoading } = useUserPromos(id, PROMOS_PER_PAGE, (promosPage - 1) * PROMOS_PER_PAGE);
  const { items: watchlist, total: totalWatchlist, isLoading: watchlistLoading } = useUserWatchlist(id, WATCHLIST_PER_PAGE, (watchlistPage - 1) * WATCHLIST_PER_PAGE);
  const { activities, total: totalActivities, isLoading: activitiesLoading } = useUserActivity(id, ACTIVITY_PER_PAGE, (activityPage - 1) * ACTIVITY_PER_PAGE);

  // Calculate total pages (after queries provide the totals)
  const totalSessionsPages = Math.ceil(totalSessions / SESSIONS_PER_PAGE);
  const totalOrdersPages = Math.ceil(totalOrders / ORDERS_PER_PAGE);
  const totalReviewsPages = Math.ceil(totalReviews / REVIEWS_PER_PAGE);
  const totalPromosPages = Math.ceil(totalPromos / PROMOS_PER_PAGE);
  const totalWatchlistPages = Math.ceil(totalWatchlist / WATCHLIST_PER_PAGE);
  const totalActivityPages = Math.ceil(totalActivities / ACTIVITY_PER_PAGE);

  // Mutations
  const { changeRole, isChanging } = useChangeRole();
  const { suspendUser, isSuspending } = useSuspendUser();
  const { unsuspendUser, isUnsuspending } = useUnsuspendUser();
  const { deleteUser, isDeleting } = useDeleteUser();
  const { restoreUser, isRestoring } = useRestoreUser();
  const { hardDeleteUser, isDeleting: isHardDeleting } = useHardDeleteUser();
  const { forceLogout, isLoggingOut } = useForceLogout();
  const { revokeSession, isRevoking } = useRevokeSession();

  // Copy handler
  const handleCopy = (text: string): void => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Action handlers
  const handleSuspend = async (): Promise<void> => {
    if (suspendReason.length === 0) return;
    try {
      await suspendUser(id, suspendReason);
      setSuspendDialogOpen(false);
      setSuspendReason('');
      void refetchUser();
    } catch (error) {
      console.error('Failed to suspend user:', error);
    }
  };

  const handleUnsuspend = async (): Promise<void> => {
    try {
      await unsuspendUser(id);
      void refetchUser();
    } catch (error) {
      console.error('Failed to unsuspend user:', error);
    }
  };

  const handleDelete = async (): Promise<void> => {
    try {
      await deleteUser(id);
      setDeleteDialogOpen(false);
      void refetchUser();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleRestore = async (): Promise<void> => {
    try {
      await restoreUser(id);
      void refetchUser();
    } catch (error) {
      console.error('Failed to restore user:', error);
    }
  };

  const handleHardDelete = async (): Promise<void> => {
    try {
      await hardDeleteUser(id);
      setHardDeleteDialogOpen(false);
      router.push('/admin/users');
    } catch (error) {
      console.error('Failed to hard delete user:', error);
    }
  };

  const handleForceLogout = async (): Promise<void> => {
    try {
      await forceLogout(id);
      void refetchSessions();
    } catch (error) {
      console.error('Failed to force logout:', error);
    }
  };

  const handleRevokeSession = async (sessionId: string): Promise<void> => {
    try {
      await revokeSession(id, sessionId);
      void refetchSessions();
    } catch (error) {
      console.error('Failed to revoke session:', error);
    }
  };

  const handleChangeRole = async (): Promise<void> => {
    try {
      await changeRole(id, selectedRole);
      setChangeRoleDialogOpen(false);
      void refetchUser();
    } catch (error) {
      console.error('Failed to change role:', error);
    }
  };

  if (guardLoading || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin-glow text-cyan-glow" />
          <span className="text-text-secondary text-sm">Loading user details...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <div />;
  }

  if (user == null) {
    return (
      <div className="container mx-auto py-8">
        <Card className="bg-bg-secondary border-border-subtle">
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4">
              <AlertTriangle className="h-12 w-12 text-orange-warning" />
              <h2 className="text-xl font-semibold text-text-primary">User Not Found</h2>
              <p className="text-text-secondary">The requested user could not be found.</p>
              <Button variant="outline" asChild>
                <Link href="/admin/users">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Users
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getUserStatusInfo(user);

  return (
    <TooltipProvider>
      <div className="container mx-auto py-8 space-y-6">
        {/* Back Button & Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="sm" asChild className="mt-1">
              <Link href="/admin/users">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-cyan-glow/10 border border-cyan-glow/20">
                  <User className="h-6 w-6 text-cyan-glow" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-text-primary">{user.email}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getRoleBadgeClass(user.role)}>
                      {user.role === 'admin' && <Crown className="h-3 w-3 mr-1" />}
                      {user.role}
                    </Badge>
                    <Badge className={`${statusInfo.color} border`}>
                      {statusInfo.icon}
                      <span className="ml-1">{statusInfo.label}</span>
                    </Badge>
                    {user.emailConfirmed ? (
                      <Badge className="bg-green-success/20 text-green-success border border-green-success/30">
                        <MailCheck className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-warning/20 text-orange-warning border border-orange-warning/30">
                        <Mail className="h-3 w-3 mr-1" />
                        Unverified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => void refetchUser()}
              className="border-border-accent"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedRole(user.role === 'admin' ? 'user' : 'admin');
                setChangeRoleDialogOpen(true);
              }}
              className="border-border-accent"
            >
              {user.role === 'admin' ? <ShieldOff className="mr-2 h-4 w-4" /> : <Shield className="mr-2 h-4 w-4" />}
              {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setForceLogoutDialogOpen(true)}
              disabled={isLoggingOut}
              className="border-border-accent"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Force Logout
            </Button>

            {user.isSuspended ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUnsuspendDialogOpen(true)}
                disabled={isUnsuspending}
                className="border-green-success/50 text-green-success hover:bg-green-success/10"
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Unsuspend
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSuspendDialogOpen(true)}
                className="border-orange-warning/50 text-orange-warning hover:bg-orange-warning/10"
              >
                <Ban className="mr-2 h-4 w-4" />
                Suspend
              </Button>
            )}

            {user.deletedAt != null ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRestoreDialogOpen(true)}
                disabled={isRestoring}
                className="border-green-success/50 text-green-success hover:bg-green-success/10"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Restore
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                className="border-destructive/50 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Suspension Warning */}
        {user.isSuspended && (user.suspendedReason as unknown as string | null) != null && (
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <Ban className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">User Suspended</p>
                  <p className="text-sm text-text-secondary mt-1">
                    Reason: {user.suspendedReason as unknown as string}
                  </p>
                  {(user.suspendedAt as unknown as Date | null) != null && (
                    <p className="text-xs text-text-muted mt-1">
                      Suspended on {formatDate(user.suspendedAt as unknown as Date)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Basic Info */}
          <Card className="bg-bg-secondary border-border-subtle">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-text-secondary">User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-text-muted text-sm">User ID</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-bg-tertiary px-2 py-1 rounded font-mono text-text-secondary">
                    {user.id.slice(0, 8)}...
                  </code>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0"
                    onClick={() => handleCopy(user.id)}
                  >
                    {copied ? <Check className="h-3 w-3 text-green-success" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
              <Separator className="bg-border-subtle" />
              <div className="flex items-center justify-between">
                <span className="text-text-muted text-sm">Created</span>
                <span className="text-text-secondary text-sm">{formatDate(user.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted text-sm">Last Login</span>
                <span className="text-text-secondary text-sm">
                  {(user.lastLoginAt as unknown as Date | null) != null ? formatDate(user.lastLoginAt as unknown as Date) : 'Never'}
                </span>
              </div>
              {(user.deletedAt as unknown as Date | null) != null && (
                <div className="flex items-center justify-between">
                  <span className="text-text-muted text-sm">Deleted</span>
                  <span className="text-destructive text-sm">{formatDate(user.deletedAt as unknown as Date)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="bg-bg-secondary border-border-subtle">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-text-secondary">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-text-muted text-sm flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" /> Orders
                </span>
                <span className="text-text-primary font-medium">{user.ordersCount ?? 0}</span>
              </div>
              <Separator className="bg-border-subtle" />
              <div className="flex items-center justify-between">
                <span className="text-text-muted text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> Total Spent
                </span>
                <span className="text-text-primary font-medium">{formatCurrency(user.totalSpent ?? 0)}</span>
              </div>
              <Separator className="bg-border-subtle" />
              <div className="flex items-center justify-between">
                <span className="text-text-muted text-sm flex items-center gap-2">
                  <Star className="h-4 w-4" /> Reviews
                </span>
                <span className="text-text-primary font-medium">{user.reviewsCount ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted text-sm flex items-center gap-2">
                  <Heart className="h-4 w-4" /> Watchlist
                </span>
                <span className="text-text-primary font-medium">{user.watchlistCount ?? 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Sessions Overview */}
          <Card className="bg-bg-secondary border-border-subtle">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-text-secondary">Active Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-text-primary mb-2">{totalSessions}</div>
              <p className="text-sm text-text-muted">
                {totalSessions === 1 ? 'Active session' : 'Active sessions'}
              </p>
              {totalSessions > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 w-full text-orange-warning hover:text-orange-warning hover:bg-orange-warning/10"
                  onClick={() => void handleForceLogout()}
                  disabled={isLoggingOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout All Sessions
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="sessions" className="space-y-4">
          <TabsList className="bg-bg-secondary border border-border-subtle">
            <TabsTrigger value="sessions" className="data-[state=active]:bg-cyan-glow/20 data-[state=active]:text-cyan-glow">
              <Monitor className="mr-2 h-4 w-4" />
              Sessions ({totalSessions})
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-cyan-glow/20 data-[state=active]:text-cyan-glow">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Orders ({totalOrders})
            </TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:bg-cyan-glow/20 data-[state=active]:text-cyan-glow">
              <MessageSquare className="mr-2 h-4 w-4" />
              Reviews ({totalReviews})
            </TabsTrigger>
            <TabsTrigger value="promos" className="data-[state=active]:bg-cyan-glow/20 data-[state=active]:text-cyan-glow">
              <Percent className="mr-2 h-4 w-4" />
              Promos ({totalPromos})
            </TabsTrigger>
            <TabsTrigger value="watchlist" className="data-[state=active]:bg-cyan-glow/20 data-[state=active]:text-cyan-glow">
              <Bookmark className="mr-2 h-4 w-4" />
              Watchlist ({totalWatchlist})
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-cyan-glow/20 data-[state=active]:text-cyan-glow">
              <Activity className="mr-2 h-4 w-4" />
              Activity ({totalActivities})
            </TabsTrigger>
          </TabsList>

          {/* Sessions Tab */}
          <TabsContent value="sessions">
            <Card className="bg-bg-secondary border-border-subtle">
              <CardHeader>
                <CardTitle className="text-lg text-text-primary">Active Sessions</CardTitle>
                <CardDescription className="text-text-secondary">
                  View and manage the user&apos;s active login sessions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessionsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-glow" />
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8 text-text-muted">
                    <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active sessions</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sessions.map((session) => {
                      const deviceInfo = session.deviceInfo as unknown as string | null;
                      const ipAddress = session.ipAddress as unknown as string | null;
                      const lastActiveAt = session.lastActiveAt as unknown as string | Date | null;
                      return (
                      <div 
                        key={session.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-bg-tertiary border border-border-subtle"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-bg-secondary">
                            {getDeviceIcon(deviceInfo ?? '')}
                          </div>
                          <div>
                            <p className="text-sm text-text-primary font-medium">
                              {deviceInfo?.slice(0, 50) ?? 'Unknown Device'}...
                            </p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-text-muted">
                              <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {ipAddress ?? 'Unknown IP'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Last active: {lastActiveAt != null ? formatDate(lastActiveAt) : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleRevokeSession(session.id)}
                          disabled={isRevoking}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )})}
                  </div>
                )}
                {/* Sessions Pagination */}
                {totalSessions > SESSIONS_PER_PAGE && (
                  <div className="flex items-center justify-between pt-4 border-t border-border-subtle mt-4">
                    <p className="text-sm text-text-muted">
                      Showing {((sessionsPage - 1) * SESSIONS_PER_PAGE) + 1}-{Math.min(sessionsPage * SESSIONS_PER_PAGE, totalSessions)} of {totalSessions}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSessionsPage((p) => Math.max(1, p - 1))}
                        disabled={sessionsPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-text-secondary">
                        Page {sessionsPage} of {totalSessionsPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSessionsPage((p) => Math.min(totalSessionsPages, p + 1))}
                        disabled={sessionsPage >= totalSessionsPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card className="bg-bg-secondary border-border-subtle">
              <CardHeader>
                <CardTitle className="text-lg text-text-primary">Order History</CardTitle>
                <CardDescription className="text-text-secondary">
                  View all orders placed by this user.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-glow" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8 text-text-muted">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No orders found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border-subtle">
                        <TableHead className="text-text-secondary">Order ID</TableHead>
                        <TableHead className="text-text-secondary">Status</TableHead>
                        <TableHead className="text-text-secondary">Items</TableHead>
                        <TableHead className="text-text-secondary text-right">Total</TableHead>
                        <TableHead className="text-text-secondary">Date</TableHead>
                        <TableHead className="text-text-secondary text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id} className="border-border-subtle">
                          <TableCell className="font-mono text-sm">{order.id.slice(0, 8)}...</TableCell>
                          <TableCell>
                            <Badge className={getOrderStatusBadgeClass(order.status)}>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{order.itemsCount}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(parseFloat(order.total))} {order.currency}</TableCell>
                          <TableCell className="text-text-secondary text-sm">{formatDate(order.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/admin/orders/${order.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                {/* Orders Pagination */}
                {totalOrders > ORDERS_PER_PAGE && (
                  <div className="flex items-center justify-between pt-4 border-t border-border-subtle mt-4">
                    <p className="text-sm text-text-muted">
                      Showing {((ordersPage - 1) * ORDERS_PER_PAGE) + 1}-{Math.min(ordersPage * ORDERS_PER_PAGE, totalOrders)} of {totalOrders}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                        disabled={ordersPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-text-secondary">
                        Page {ordersPage} of {totalOrdersPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOrdersPage((p) => Math.min(totalOrdersPages, p + 1))}
                        disabled={ordersPage >= totalOrdersPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <Card className="bg-bg-secondary border-border-subtle">
              <CardHeader>
                <CardTitle className="text-lg text-text-primary">Reviews</CardTitle>
                <CardDescription className="text-text-secondary">
                  Reviews submitted by this user.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reviewsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-glow" />
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-8 text-text-muted">
                    <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No reviews found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="p-4 rounded-lg bg-bg-tertiary border border-border-subtle">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-text-primary">{review.productTitle as unknown as string}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`h-4 w-4 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-text-muted'}`}
                                  />
                                ))}
                              </div>
                              <Badge className={review.status === 'approved' ? 'bg-green-success/20 text-green-success' : 'bg-orange-warning/20 text-orange-warning'}>
                                {review.status}
                              </Badge>
                            </div>
                          </div>
                          <span className="text-xs text-text-muted">{formatDate(review.createdAt)}</span>
                        </div>
                        {(review.content as unknown as string | null) != null && (review.content as unknown as string).length > 0 && (
                          <p className="mt-2 text-sm text-text-secondary">{review.content as unknown as string}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {/* Reviews Pagination */}
                {totalReviews > REVIEWS_PER_PAGE && (
                  <div className="flex items-center justify-between pt-4 border-t border-border-subtle mt-4">
                    <p className="text-sm text-text-muted">
                      Showing {((reviewsPage - 1) * REVIEWS_PER_PAGE) + 1}-{Math.min(reviewsPage * REVIEWS_PER_PAGE, totalReviews)} of {totalReviews}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReviewsPage((p) => Math.max(1, p - 1))}
                        disabled={reviewsPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-text-secondary">
                        Page {reviewsPage} of {totalReviewsPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReviewsPage((p) => Math.min(totalReviewsPages, p + 1))}
                        disabled={reviewsPage >= totalReviewsPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Promos Tab */}
          <TabsContent value="promos">
            <Card className="bg-bg-secondary border-border-subtle">
              <CardHeader>
                <CardTitle className="text-lg text-text-primary">Promo Code Usage</CardTitle>
                <CardDescription className="text-text-secondary">
                  Promo codes used by this user.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {promosLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-glow" />
                  </div>
                ) : promos.length === 0 ? (
                  <div className="text-center py-8 text-text-muted">
                    <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No promo codes used</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border-subtle">
                        <TableHead className="text-text-secondary">Code</TableHead>
                        <TableHead className="text-text-secondary">Discount</TableHead>
                        <TableHead className="text-text-secondary">Order</TableHead>
                        <TableHead className="text-text-secondary">Used At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {promos.map((promo) => {
                        const orderId = promo.orderId as unknown as string | null;
                        return (
                        <TableRow key={promo.id} className="border-border-subtle">
                          <TableCell className="font-mono">{promo.code}</TableCell>
                          <TableCell>
                            {promo.discountType === 'percent' 
                              ? `${promo.discountAmount}%` 
                              : formatCurrency(promo.discountAmount)}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {orderId != null ? (
                              <Link href={`/admin/orders/${orderId}`} className="text-cyan-glow hover:underline">
                                {orderId.slice(0, 8)}...
                              </Link>
                            ) : (
                              <span className="text-text-muted">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-text-secondary text-sm">{formatDate(promo.redeemedAt)}</TableCell>
                        </TableRow>
                      )})}
                    </TableBody>
                  </Table>
                )}
                {/* Promos Pagination */}
                {totalPromos > PROMOS_PER_PAGE && (
                  <div className="flex items-center justify-between pt-4 border-t border-border-subtle mt-4">
                    <p className="text-sm text-text-muted">
                      Showing {((promosPage - 1) * PROMOS_PER_PAGE) + 1}-{Math.min(promosPage * PROMOS_PER_PAGE, totalPromos)} of {totalPromos}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPromosPage((p) => Math.max(1, p - 1))}
                        disabled={promosPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-text-secondary">
                        Page {promosPage} of {totalPromosPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPromosPage((p) => Math.min(totalPromosPages, p + 1))}
                        disabled={promosPage >= totalPromosPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Watchlist Tab */}
          <TabsContent value="watchlist">
            <Card className="bg-bg-secondary border-border-subtle">
              <CardHeader>
                <CardTitle className="text-lg text-text-primary">Watchlist</CardTitle>
                <CardDescription className="text-text-secondary">
                  Products saved by this user.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {watchlistLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-glow" />
                  </div>
                ) : watchlist.length === 0 ? (
                  <div className="text-center py-8 text-text-muted">
                    <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Watchlist is empty</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {watchlist.map((item) => {
                      const productTitle = item.productTitle as unknown as string | null;
                      const productPrice = item.productPrice as unknown as number | null;
                      return (
                      <div key={item.id} className="p-4 rounded-lg bg-bg-tertiary border border-border-subtle">
                        <p className="font-medium text-text-primary line-clamp-1">{productTitle ?? 'Unknown Product'}</p>
                        <p className="text-cyan-glow font-mono mt-1">{productPrice != null ? formatCurrency(productPrice) : '—'}</p>
                        <p className="text-xs text-text-muted mt-2">Added {formatDate(item.addedAt)}</p>
                      </div>
                    )})}
                  </div>
                )}
                {/* Watchlist Pagination */}
                {totalWatchlist > WATCHLIST_PER_PAGE && (
                  <div className="flex items-center justify-between pt-4 border-t border-border-subtle mt-4">
                    <p className="text-sm text-text-muted">
                      Showing {((watchlistPage - 1) * WATCHLIST_PER_PAGE) + 1}-{Math.min(watchlistPage * WATCHLIST_PER_PAGE, totalWatchlist)} of {totalWatchlist}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWatchlistPage((p) => Math.max(1, p - 1))}
                        disabled={watchlistPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-text-secondary">
                        Page {watchlistPage} of {totalWatchlistPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWatchlistPage((p) => Math.min(totalWatchlistPages, p + 1))}
                        disabled={watchlistPage >= totalWatchlistPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card className="bg-bg-secondary border-border-subtle">
              <CardHeader>
                <CardTitle className="text-lg text-text-primary">Activity Log</CardTitle>
                <CardDescription className="text-text-secondary">
                  Recent user activity and events.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activitiesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-glow" />
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-8 text-text-muted">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No activity recorded</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div 
                        key={activity.id}
                        className="flex items-start gap-4 p-3 rounded-lg bg-bg-tertiary border border-border-subtle"
                      >
                        <div className="p-2 rounded-lg bg-bg-secondary">
                          <Activity className="h-4 w-4 text-cyan-glow" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-text-primary">{activity.action}</p>
                          {(activity.details as unknown as string | null) != null && (
                            <p className="text-xs text-text-muted mt-1">{activity.details as unknown as string}</p>
                          )}
                        </div>
                        <span className="text-xs text-text-muted">{formatDate(activity.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {/* Activity Pagination */}
                {totalActivities > ACTIVITY_PER_PAGE && (
                  <div className="flex items-center justify-between pt-4 border-t border-border-subtle mt-4">
                    <p className="text-sm text-text-muted">
                      Showing {((activityPage - 1) * ACTIVITY_PER_PAGE) + 1}-{Math.min(activityPage * ACTIVITY_PER_PAGE, totalActivities)} of {totalActivities}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                        disabled={activityPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-text-secondary">
                        Page {activityPage} of {totalActivityPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActivityPage((p) => Math.min(totalActivityPages, p + 1))}
                        disabled={activityPage >= totalActivityPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        
        {/* Suspend Dialog */}
        <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
          <DialogContent className="bg-bg-secondary border-border-subtle">
            <DialogHeader>
              <DialogTitle className="text-text-primary flex items-center gap-2">
                <Ban className="h-5 w-5 text-orange-warning" />
                Suspend User
              </DialogTitle>
              <DialogDescription className="text-text-secondary">
                This will prevent the user from logging in and accessing their account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="suspendReason">Suspension Reason</Label>
                <Textarea
                  id="suspendReason"
                  placeholder="Enter the reason for suspension..."
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="bg-bg-tertiary border-border-subtle min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => void handleSuspend()}
                disabled={isSuspending || suspendReason.length === 0}
                className="bg-orange-warning text-bg-primary hover:bg-orange-warning/90"
              >
                {isSuspending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Suspend User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="bg-bg-secondary border-border-subtle">
            <DialogHeader>
              <DialogTitle className="text-text-primary flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                Delete User
              </DialogTitle>
              <DialogDescription className="text-text-secondary">
                This will soft-delete the user. They can be restored later.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => void handleDelete()}
                disabled={isDeleting}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Hard Delete Dialog */}
        <Dialog open={hardDeleteDialogOpen} onOpenChange={setHardDeleteDialogOpen}>
          <DialogContent className="bg-bg-secondary border-border-subtle">
            <DialogHeader>
              <DialogTitle className="text-text-primary flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Permanently Delete User
              </DialogTitle>
              <DialogDescription className="text-text-secondary">
                <span className="text-destructive font-medium">Warning:</span> This action is irreversible. 
                All user data will be permanently removed.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setHardDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => void handleHardDelete()}
                disabled={isHardDeleting}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                {isHardDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Permanently Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Change Role Dialog */}
        <Dialog open={changeRoleDialogOpen} onOpenChange={setChangeRoleDialogOpen}>
          <DialogContent className="bg-bg-secondary border-border-subtle">
            <DialogHeader>
              <DialogTitle className="text-text-primary flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-neon" />
                Change User Role
              </DialogTitle>
              <DialogDescription className="text-text-secondary">
                {selectedRole === 'admin' 
                  ? `This will grant ${user.email} admin privileges. They will have full access to the admin dashboard.` 
                  : `This will remove admin privileges from ${user.email}. They will no longer have access to the admin dashboard.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setChangeRoleDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => void handleChangeRole()}
                disabled={isChanging}
                className="bg-purple-neon text-white hover:bg-purple-neon/90"
              >
                {isChanging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedRole === 'admin' ? 'Make Admin' : 'Remove Admin'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Force Logout Dialog */}
        <Dialog open={forceLogoutDialogOpen} onOpenChange={setForceLogoutDialogOpen}>
          <DialogContent className="bg-bg-secondary border-border-subtle">
            <DialogHeader>
              <DialogTitle className="text-text-primary flex items-center gap-2">
                <LogOut className="h-5 w-5 text-cyan-glow" />
                Force Logout
              </DialogTitle>
              <DialogDescription className="text-text-secondary">
                Are you sure you want to force logout <span className="font-medium text-text-primary">{user.email}</span>? This will terminate all their active sessions and require them to log in again.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setForceLogoutDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  void handleForceLogout().then(() => {
                    setForceLogoutDialogOpen(false);
                  });
                }}
                disabled={isLoggingOut}
                className="btn-primary"
              >
                {isLoggingOut && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Force Logout
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Unsuspend Dialog */}
        <Dialog open={unsuspendDialogOpen} onOpenChange={setUnsuspendDialogOpen}>
          <DialogContent className="bg-bg-secondary border-border-subtle">
            <DialogHeader>
              <DialogTitle className="text-text-primary flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-green-success" />
                Unsuspend User
              </DialogTitle>
              <DialogDescription className="text-text-secondary">
                Are you sure you want to unsuspend <span className="font-medium text-text-primary">{user.email}</span>? This will restore their access to the platform.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUnsuspendDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  void handleUnsuspend().then(() => {
                    setUnsuspendDialogOpen(false);
                  });
                }}
                disabled={isUnsuspending}
                className="bg-green-success text-bg-primary hover:bg-green-success/90"
              >
                {isUnsuspending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Unsuspend User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Restore User Dialog */}
        <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
          <DialogContent className="bg-bg-secondary border-border-subtle">
            <DialogHeader>
              <DialogTitle className="text-text-primary flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-green-success" />
                Restore User
              </DialogTitle>
              <DialogDescription className="text-text-secondary">
                Are you sure you want to restore <span className="font-medium text-text-primary">{user.email}</span>? This will reactivate their account and allow them to log in again.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRestoreDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  void handleRestore().then(() => {
                    setRestoreDialogOpen(false);
                  });
                }}
                disabled={isRestoring}
                className="bg-green-success text-bg-primary hover:bg-green-success/90"
              >
                {isRestoring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Restore User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
