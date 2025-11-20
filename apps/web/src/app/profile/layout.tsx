'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function ProfileLayout({
    children,
}: {
    children: React.ReactNode;
}): React.ReactElement {
    return (
        <ProtectedRoute>
            <div className="flex min-h-screen">
                <Sidebar />
                <main className="flex-1 p-8">
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    );
}
