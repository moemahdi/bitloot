'use client';

import type { ReactElement } from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUpdatePassword } from '@/hooks/useUserProfile';
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import { Label } from '@/design-system/primitives/label';

const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(6, 'Password must be at least 6 characters'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export function ChangePasswordForm(): ReactElement {
  const [successMessage, setSuccessMessage] = useState('');
  const updatePassword = useUpdatePassword();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  async function onSubmit(data: ChangePasswordFormData): Promise<void> {
    try {
      await updatePassword.mutateAsync({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      setSuccessMessage('Password updated successfully');
      reset();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Password update failed:', error);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border p-6">
      <h2 className="text-xl font-semibold">Change Password</h2>

      {successMessage.length > 0 && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">{successMessage}</div>
      )}

      {(updatePassword.isError ?? false) && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {updatePassword.error instanceof Error && updatePassword.error.message !== undefined
            ? updatePassword.error.message
            : 'Failed to update password'}
        </div>
      )}

      <div>
        <Label htmlFor="oldPassword">Current Password</Label>
        <Input
          {...register('oldPassword')}
          id="oldPassword"
          type="password"
          placeholder="Enter your current password"
          disabled={isSubmitting}
          aria-label="Current password"
          aria-invalid={errors.oldPassword !== undefined}
        />
        {errors.oldPassword !== undefined && (
          <span className="text-sm text-red-500">{errors.oldPassword.message}</span>
        )}
      </div>

      <div>
        <Label htmlFor="newPassword">New Password</Label>
        <Input
          {...register('newPassword')}
          id="newPassword"
          type="password"
          placeholder="Enter your new password"
          disabled={isSubmitting}
          aria-label="New password"
          aria-invalid={errors.newPassword !== undefined}
        />
        {errors.newPassword !== undefined && (
          <span className="text-sm text-red-500">{errors.newPassword.message}</span>
        )}
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input
          {...register('confirmPassword')}
          id="confirmPassword"
          type="password"
          placeholder="Confirm your new password"
          disabled={isSubmitting}
          aria-label="Confirm password"
          aria-invalid={errors.confirmPassword !== undefined}
        />
        {errors.confirmPassword !== undefined && (
          <span className="text-sm text-red-500">{errors.confirmPassword.message}</span>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting || updatePassword.isPending} className="w-full">
        {isSubmitting ? 'Updating...' : 'Update Password'}
      </Button>
    </form>
  );
}
