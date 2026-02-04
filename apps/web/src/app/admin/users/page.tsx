'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Input } from '@/design-system/primitives/input';
import { Checkbox } from '@/design-system/primitives/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/design-system/primitives/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/design-system/primitives/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/design-system/primitives/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/design-system/primitives/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/design-system/primitives/dropdown-menu';
import { Textarea } from '@/design-system/primitives/textarea';
import { Label } from '@/design-system/primitives/label';
import { 
  Search, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Download, 
  RefreshCw, 
  Users, 
  MoreHorizontal,
  Shield,
  ShieldOff,
  UserCheck,
  Trash2,
  LogOut,
  Ban,
  CheckCircle2,
  Mail,
  MailCheck,
  Crown,
} from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/utils/format-date';
import { useAdminGuard } from '@/features/admin/hooks/useAdminGuard';
import { useAdminTableState } from '@/features/admin/hooks/useAdminTableState';
import {
  useAdminUsers,
  useUserStats,
  useSuspendUser,
  useUnsuspendUser,
  useDeleteUser,
  useRestoreUser,
  useForceLogout,
  useChangeRole,
  useExportUsers,
  type AdminUserListItemDto,
} from '@/features/admin/hooks/useAdminUsers';

/**
 * Get neon badge class for user status
 */
function getUserStatusBadgeClass(user: AdminUserListItemDto): string {
  if (user.isDeleted) {
    return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
  }
  if (user.isSuspended) {
    return 'bg-destructive/20 text-destructive border border-destructive/30';
  }
  return 'bg-green-success/20 text-green-success border border-green-success/30';
}

/**
 * Get user status label
 */
function getUserStatusLabel(user: AdminUserListItemDto): string {
  if (user.isDeleted) return 'Deleted';
  if (user.isSuspended) return 'Suspended';
  return 'Active';
}

/**
 * Get role badge class
 */
function getRoleBadgeClass(role: string): string {
  switch (role) {
    case 'admin':
      return 'bg-purple-neon/20 text-purple-neon border border-purple-neon/30';
    default:
      return 'bg-cyan-glow/20 text-cyan-glow border border-cyan-glow/30';
  }
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

export default function AdminUsersPage(): React.ReactElement {
  const { isLoading: guardLoading, isAdmin } = useAdminGuard();
  
  // Bulk selection state
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // Dialog states
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [forceLogoutDialogOpen, setForceLogoutDialogOpen] = useState(false);
  const [changeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false);
  const [unsuspendDialogOpen, setUnsuspendDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>('');
  const [selectedNewRole, setSelectedNewRole] = useState<'user' | 'admin'>('user');
  const [suspendReason, setSuspendReason] = useState('');
  
  const tableState = useAdminTableState({
    initialFilters: {
      status: 'all',
      role: 'all',
      search: '',
      emailConfirmed: 'all',
    },
  });

  const {
    page,
    limit,
    filters,
    setPage,
    setLimit,
    handleFilterChange,
  } = tableState;

  const { 
    users, 
    total: totalItems, 
    isLoading, 
    refetch,
    isRefetching: _isRefetching
  } = useAdminUsers(tableState);
  const totalPages = (totalItems > 0 && limit > 0) ? Math.ceil(totalItems / limit) : 0;

  // Stats hook
  const { stats, isLoading: statsLoading, refetch: refetchStats } = useUserStats();
  
  // Mutations
  const { suspendUser, isSuspending } = useSuspendUser();
  const { unsuspendUser, isUnsuspending } = useUnsuspendUser();
  const { deleteUser, isDeleting } = useDeleteUser();
  const { restoreUser, isRestoring } = useRestoreUser();
  const { forceLogout, isLoggingOut } = useForceLogout();
  const { changeRole, isChanging } = useChangeRole();
  const { exportUsers, isExporting } = useExportUsers();
  
  // Refresh loading state
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);

  // Bulk selection handlers
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map((u) => u.id));
    } else {
      setSelectedUsers([]);
    }
  }, [users]);

  const handleSelectUser = useCallback((userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  }, []);

  // Suspend handler
  const handleSuspend = async (): Promise<void> => {
    if (selectedUserId == null || suspendReason.length === 0) return;
    try {
      await suspendUser(selectedUserId, suspendReason);
      setSuspendDialogOpen(false);
      setSelectedUserId(null);
      setSuspendReason('');
      void refetch();
      void refetchStats();
    } catch (error) {
      console.error('Failed to suspend user:', error);
    }
  };

  // Delete handler
  const handleDelete = async (): Promise<void> => {
    if (selectedUserId == null) return;
    try {
      await deleteUser(selectedUserId);
      setDeleteDialogOpen(false);
      setSelectedUserId(null);
      void refetch();
      void refetchStats();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  // Export handler
  const handleExport = async (): Promise<void> => {
    try {
      const blob = await exportUsers({
        role: filters.role !== 'all' ? filters.role as 'user' | 'admin' : undefined,
        status: filters.status !== 'all' ? filters.status as 'active' | 'suspended' | 'deleted' : undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (guardLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin-glow text-cyan-glow" />
          <span className="text-text-secondary text-sm">Loading users...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <div />;
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-glow/10 border border-cyan-glow/20">
                <Users className="h-6 w-6 text-cyan-glow" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-text-primary tracking-tight">User Management</h1>
                <p className="text-text-secondary">View and manage all platform users.</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsRefreshingAll(true);
                void Promise.all([refetch(), Promise.resolve(refetchStats())]).finally(() => {
                  setIsRefreshingAll(false);
                });
              }}
              disabled={isRefreshingAll}
              className="border-border-accent hover:border-cyan-glow/50 hover:shadow-glow-cyan-sm transition-all"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshingAll ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              onClick={() => void handleExport()}
              disabled={isExporting}
              className="border-border-accent hover:border-cyan-glow/50 hover:shadow-glow-cyan-sm transition-all"
            >
              <Download className={`mr-2 h-4 w-4 ${isExporting ? 'animate-spin' : ''}`} />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-bg-secondary border-border-subtle hover:border-cyan-glow/30 transition-all">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Total Users</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.totalUsers ?? 0}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-cyan-glow/10">
                  <Users className="h-5 w-5 text-cyan-glow" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-bg-secondary border-border-subtle hover:border-green-success/30 transition-all">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Active Today</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.activeToday ?? 0}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-success/10">
                  <CheckCircle2 className="h-5 w-5 text-green-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-bg-secondary border-border-subtle hover:border-destructive/30 transition-all">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Suspended</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.suspendedCount ?? 0}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-destructive/10">
                  <Ban className="h-5 w-5 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-bg-secondary border-border-subtle hover:border-purple-neon/30 transition-all">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Admins</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.adminCount ?? 0}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-neon/10">
                  <Crown className="h-5 w-5 text-purple-neon" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Card */}
        <Card className="bg-bg-secondary border-border-subtle">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              {/* Search */}
              <div className="flex-1">
                <Label className="text-text-secondary mb-2 block">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <Input
                    placeholder="Search by email or ID..."
                    value={(filters.search as string) ?? ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10 bg-bg-tertiary border-border-subtle focus:border-cyan-glow/50 focus:shadow-glow-cyan-sm"
                  />
                </div>
              </div>

              {/* Role Filter */}
              <div className="w-full md:w-40">
                <Label className="text-text-secondary mb-2 block">Role</Label>
                <Select
                  value={(filters.role as string) ?? 'all'}
                  onValueChange={(value) => handleFilterChange('role', value)}
                >
                  <SelectTrigger className="bg-bg-tertiary border-border-subtle">
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="w-full md:w-40">
                <Label className="text-text-secondary mb-2 block">Status</Label>
                <Select
                  value={(filters.status as string) ?? 'all'}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger className="bg-bg-tertiary border-border-subtle">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="deleted">Deleted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Email Confirmed Filter */}
              <div className="w-full md:w-44">
                <Label className="text-text-secondary mb-2 block">Email</Label>
                <Select
                  value={(filters.emailConfirmed as string) ?? 'all'}
                  onValueChange={(value) => handleFilterChange('emailConfirmed', value)}
                >
                  <SelectTrigger className="bg-bg-tertiary border-border-subtle">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Confirmed</SelectItem>
                    <SelectItem value="false">Unconfirmed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Page Size */}
              <div className="w-full md:w-28">
                <Label className="text-text-secondary mb-2 block">Per page</Label>
                <Select
                  value={limit.toString()}
                  onValueChange={(value) => setLimit(parseInt(value, 10))}
                >
                  <SelectTrigger className="bg-bg-tertiary border-border-subtle">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions Bar */}
        {selectedUsers.length > 0 && (
          <Card className="bg-cyan-glow/5 border-cyan-glow/30 shadow-glow-cyan-sm">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">
                  {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedUsers([])}
                    className="border-border-accent"
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Users Table */}
        <Card className="bg-bg-secondary border-border-subtle overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border-subtle hover:bg-transparent">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUsers.length === users.length && users.length > 0}
                        onCheckedChange={(checked) => handleSelectAll(checked === true)}
                      />
                    </TableHead>
                    <TableHead className="text-text-secondary">Email</TableHead>
                    <TableHead className="text-text-secondary">Role</TableHead>
                    <TableHead className="text-text-secondary">Status</TableHead>
                    <TableHead className="text-text-secondary">Email Verified</TableHead>
                    <TableHead className="text-text-secondary text-right">Orders</TableHead>
                    <TableHead className="text-text-secondary text-right">Total Spent</TableHead>
                    <TableHead className="text-text-secondary">Last Login</TableHead>
                    <TableHead className="text-text-secondary">Created</TableHead>
                    <TableHead className="text-text-secondary text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="border-border-subtle">
                        <TableCell colSpan={10}>
                          <div className="h-12 bg-bg-tertiary animate-pulse rounded" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : users.length === 0 ? (
                    <TableRow className="border-border-subtle">
                      <TableCell colSpan={10} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <Users className="h-12 w-12 text-text-muted" />
                          <p className="text-text-secondary">No users found</p>
                          <p className="text-text-muted text-sm">Try adjusting your filters</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow 
                        key={user.id} 
                        className="border-border-subtle hover:bg-bg-tertiary/50 transition-colors"
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={(checked) => handleSelectUser(user.id, checked === true)}
                          />
                        </TableCell>
                        <TableCell>
                          <Link 
                            href={`/admin/users/${user.id}`}
                            className="text-text-primary hover:text-cyan-glow transition-colors font-medium"
                          >
                            {user.email}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeClass(user.role)}>
                            {user.role === 'admin' && <Crown className="h-3 w-3 mr-1" />}
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getUserStatusBadgeClass(user)}>
                            {getUserStatusLabel(user)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.emailConfirmed ? (
                            <Tooltip>
                              <TooltipTrigger>
                                <MailCheck className="h-4 w-4 text-green-success" />
                              </TooltipTrigger>
                              <TooltipContent>Email confirmed</TooltipContent>
                            </Tooltip>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger>
                                <Mail className="h-4 w-4 text-text-muted" />
                              </TooltipTrigger>
                              <TooltipContent>Email not confirmed</TooltipContent>
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {user.ordersCount ?? 0}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(user.totalSpent ?? 0)}
                        </TableCell>
                        <TableCell className="text-text-secondary text-sm">
                          {(user.lastLoginAt as unknown as Date | null) != null ? formatDate(user.lastLoginAt as unknown as Date) : 'Never'}
                        </TableCell>
                        <TableCell className="text-text-secondary text-sm">
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-bg-secondary border-border-subtle">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/users/${user.id}`} className="cursor-pointer">
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              
                              {/* Role Change */}
                              {user.role === 'user' ? (
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedUserId(user.id);
                                    setSelectedUserEmail(user.email);
                                    setSelectedNewRole('admin');
                                    setChangeRoleDialogOpen(true);
                                  }}
                                  disabled={isChanging}
                                >
                                  <Shield className="mr-2 h-4 w-4" />
                                  Make Admin
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedUserId(user.id);
                                    setSelectedUserEmail(user.email);
                                    setSelectedNewRole('user');
                                    setChangeRoleDialogOpen(true);
                                  }}
                                  disabled={isChanging}
                                >
                                  <ShieldOff className="mr-2 h-4 w-4" />
                                  Remove Admin
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />
                              
                              {/* Force Logout */}
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedUserId(user.id);
                                  setSelectedUserEmail(user.email);
                                  setForceLogoutDialogOpen(true);
                                }}
                                disabled={isLoggingOut}
                              >
                                <LogOut className="mr-2 h-4 w-4" />
                                Force Logout
                              </DropdownMenuItem>

                              {/* Suspend/Unsuspend */}
                              {user.isSuspended ? (
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedUserId(user.id);
                                    setSelectedUserEmail(user.email);
                                    setUnsuspendDialogOpen(true);
                                  }}
                                  disabled={isUnsuspending}
                                >
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Unsuspend User
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedUserId(user.id);
                                    setSelectedUserEmail(user.email);
                                    setSuspendDialogOpen(true);
                                  }}
                                  className="text-orange-warning"
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  Suspend User
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />
                              
                              {/* Delete/Restore */}
                              {user.isDeleted ? (
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedUserId(user.id);
                                    setSelectedUserEmail(user.email);
                                    setRestoreDialogOpen(true);
                                  }}
                                  disabled={isRestoring}
                                >
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Restore User
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedUserId(user.id);
                                    setSelectedUserEmail(user.email);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete User
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalItems > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border-subtle">
                <p className="text-sm text-text-secondary">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalItems)} of {totalItems} users
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                    className="border-border-accent"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-text-secondary px-3">
                    Page {page} of {Math.max(totalPages, 1)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages || totalPages <= 1}
                    className="border-border-accent"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Suspend User Dialog */}
        <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
          <DialogContent className="bg-bg-secondary border-border-subtle">
            <DialogHeader>
              <DialogTitle className="text-text-primary flex items-center gap-2">
                <Ban className="h-5 w-5 text-orange-warning" />
                Suspend User
              </DialogTitle>
              <DialogDescription className="text-text-secondary">
                This will prevent <span className="font-medium text-text-primary">{selectedUserEmail}</span> from logging in and accessing their account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Suspension Reason</Label>
                <Textarea
                  id="reason"
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

        {/* Delete User Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="bg-bg-secondary border-border-subtle">
            <DialogHeader>
              <DialogTitle className="text-text-primary flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                Delete User
              </DialogTitle>
              <DialogDescription className="text-text-secondary">
                Are you sure you want to delete <span className="font-medium text-text-primary">{selectedUserEmail}</span>? This action can be reversed by restoring the user.
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

        {/* Force Logout Dialog */}
        <Dialog open={forceLogoutDialogOpen} onOpenChange={setForceLogoutDialogOpen}>
          <DialogContent className="bg-bg-secondary border-border-subtle">
            <DialogHeader>
              <DialogTitle className="text-text-primary flex items-center gap-2">
                <LogOut className="h-5 w-5 text-cyan-glow" />
                Force Logout
              </DialogTitle>
              <DialogDescription className="text-text-secondary">
                Are you sure you want to force logout <span className="font-medium text-text-primary">{selectedUserEmail}</span>? This will terminate all their active sessions and require them to log in again.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setForceLogoutDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (selectedUserId) {
                    void forceLogout(selectedUserId).then(() => {
                      setForceLogoutDialogOpen(false);
                      setSelectedUserId(null);
                      setSelectedUserEmail('');
                    });
                  }
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

        {/* Change Role Dialog */}
        <Dialog open={changeRoleDialogOpen} onOpenChange={setChangeRoleDialogOpen}>
          <DialogContent className="bg-bg-secondary border-border-subtle">
            <DialogHeader>
              <DialogTitle className="text-text-primary flex items-center gap-2">
                {selectedNewRole === 'admin' ? (
                  <Shield className="h-5 w-5 text-purple-neon" />
                ) : (
                  <ShieldOff className="h-5 w-5 text-orange-warning" />
                )}
                {selectedNewRole === 'admin' ? 'Make Admin' : 'Remove Admin'}
              </DialogTitle>
              <DialogDescription className="text-text-secondary">
                {selectedNewRole === 'admin' ? (
                  <>
                    Are you sure you want to grant admin privileges to <span className="font-medium text-text-primary">{selectedUserEmail}</span>? They will have full access to the admin dashboard.
                  </>
                ) : (
                  <>
                    Are you sure you want to remove admin privileges from <span className="font-medium text-text-primary">{selectedUserEmail}</span>? They will no longer have access to the admin dashboard.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setChangeRoleDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (selectedUserId) {
                    void changeRole(selectedUserId, selectedNewRole).then(() => {
                      void refetch();
                      void refetchStats();
                      setChangeRoleDialogOpen(false);
                      setSelectedUserId(null);
                      setSelectedUserEmail('');
                    });
                  }
                }}
                disabled={isChanging}
                className={selectedNewRole === 'admin' ? 'bg-purple-neon text-white hover:bg-purple-neon/90' : 'bg-orange-warning text-bg-primary hover:bg-orange-warning/90'}
              >
                {isChanging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedNewRole === 'admin' ? 'Make Admin' : 'Remove Admin'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Unsuspend User Dialog */}
        <Dialog open={unsuspendDialogOpen} onOpenChange={setUnsuspendDialogOpen}>
          <DialogContent className="bg-bg-secondary border-border-subtle">
            <DialogHeader>
              <DialogTitle className="text-text-primary flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-green-success" />
                Unsuspend User
              </DialogTitle>
              <DialogDescription className="text-text-secondary">
                Are you sure you want to unsuspend <span className="font-medium text-text-primary">{selectedUserEmail}</span>? This will restore their access to the platform.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUnsuspendDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (selectedUserId) {
                    void unsuspendUser(selectedUserId).then(() => {
                      void refetch();
                      void refetchStats();
                      setUnsuspendDialogOpen(false);
                      setSelectedUserId(null);
                      setSelectedUserEmail('');
                    });
                  }
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
                <UserCheck className="h-5 w-5 text-green-success" />
                Restore User
              </DialogTitle>
              <DialogDescription className="text-text-secondary">
                Are you sure you want to restore <span className="font-medium text-text-primary">{selectedUserEmail}</span>? This will reactivate their account and allow them to log in again.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRestoreDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (selectedUserId) {
                    void restoreUser(selectedUserId).then(() => {
                      void refetch();
                      void refetchStats();
                      setRestoreDialogOpen(false);
                      setSelectedUserId(null);
                      setSelectedUserEmail('');
                    });
                  }
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
