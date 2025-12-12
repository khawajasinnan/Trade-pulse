'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, loading, router]);

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center hero-gradient">
                <div className="text-center">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary-200 border-t-primary-500 mx-auto"></div>
                        <div className="absolute inset-0 rounded-full animate-ping bg-primary-500/20"></div>
                    </div>
                    <p className="mt-6 text-gray-600 font-medium animate-pulse">Verifying access...</p>
                </div>
            </div>
        );
    }

    // Don't render protected content if not authenticated
    if (!isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}
