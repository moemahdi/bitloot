 'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Configuration, UsersApi } from '@bitloot/sdk';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import { Label } from '@/design-system/primitives/label';
import { Separator } from '@/design-system/primitives/separator';
import { Loader2, User, Shield, Lock } from 'lucide-react';
import { toast } from 'sonner';

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

export default function AccountPage(): React.ReactElement {
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
    });

    const onSubmit = async (data: PasswordFormValues): Promise<void> => {
        setIsSubmitting(true);
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
            setIsSubmitting(false);
        }
    };

    if (user === null || user === undefined) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 space-y-8 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold">Account Settings</h1>
                <p className="text-muted-foreground">Manage your profile and security preferences.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
                {/* Sidebar Navigation (Mock for now, could be real links) */}
                <div className="md:col-span-1 space-y-2">
                    <Button variant="secondary" className="w-full justify-start" size="lg">
                        <User className="mr-2 h-4 w-4" />
                        General
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" size="lg">
                        <Shield className="mr-2 h-4 w-4" />
                        Security
                    </Button>
                </div>

                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Profile Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>Your account details.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Email Address</Label>
                                <Input value={user.email} disabled className="bg-muted" />
                                <p className="text-xs text-muted-foreground">
                                    Email cannot be changed. Contact support for assistance.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>User ID</Label>
                                <Input value={user.id} disabled className="bg-muted font-mono text-xs" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Security Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Security</CardTitle>
                            <CardDescription>Update your password and security settings.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="oldPassword">Current Password</Label>
                                    <Input
                                        id="oldPassword"
                                        type="password"
                                        {...register('oldPassword')}
                                        placeholder="Enter current password"
                                    />
                                    {errors.oldPassword !== null && errors.oldPassword !== undefined && (
                                        <p className="text-sm text-destructive">{errors.oldPassword.message}</p>
                                    )}
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        {...register('newPassword')}
                                        placeholder="Enter new password"
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
                                    />
                                    {errors.confirmPassword !== null && errors.confirmPassword !== undefined && (
                                        <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                                    )}
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <Lock className="mr-2 h-4 w-4" />
                                                Update Password
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
