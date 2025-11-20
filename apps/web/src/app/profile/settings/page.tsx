'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage() {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Account Settings</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Email Address</label>
                        <div className="rounded-md border p-2 bg-muted text-muted-foreground">
                            {user?.email}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Your email address is managed via OTP verification.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
