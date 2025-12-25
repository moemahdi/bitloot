'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function ProfileLayout({
    children,
}: {
    children: React.ReactNode;
}): React.ReactElement {
    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-dark">
                {/* Main Profile Content */}
                <main 
                    id="profile-content"
                    tabIndex={-1}
                    aria-label="Profile content"
                    className="p-6 md:p-8 lg:p-12 safe-left safe-right focus:outline-none"
                >
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    );
}
