'use client';

import type { ReactElement } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { ChangePasswordForm } from '@/features/account/ChangePasswordForm';
import { Skeleton } from '@/design-system/primitives/skeleton';

export default function ProfilePage(): ReactElement {
  const { data: profile, isLoading, error } = useUserProfile();

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-6 py-8">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (error !== null) {
    return (
      <div className="container mx-auto py-8">
        <div className="rounded-lg bg-red-50 p-6 text-red-700">
          <h2 className="text-lg font-semibold">Error Loading Profile</h2>
          <p>{error instanceof Error ? error.message : 'Failed to load your profile'}</p>
        </div>
      </div>
    );
  }

  if (profile === undefined) {
    return (
      <div className="container mx-auto py-8">
        <div className="rounded-lg bg-yellow-50 p-6 text-yellow-700">
          <h2 className="text-lg font-semibold">No Profile Data</h2>
          <p>Unable to load your profile information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-bold">My Account</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Profile Information */}
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">Profile Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Email</label>
              <p className="mt-1 text-lg">{profile.email}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Account Status</label>
              <p className="mt-1 flex items-center gap-2">
                {profile.emailConfirmed ? (
                  <>
                    <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                    <span className="text-green-700">Verified</span>
                  </>
                ) : (
                  <>
                    <span className="inline-block h-2 w-2 rounded-full bg-yellow-500"></span>
                    <span className="text-yellow-700">Pending Verification</span>
                  </>
                )}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Role</label>
              <p className="mt-1 capitalize">{profile.role}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Member Since</label>
              <p className="mt-1">{new Date(profile.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <ChangePasswordForm />
      </div>
    </div>
  );
}
