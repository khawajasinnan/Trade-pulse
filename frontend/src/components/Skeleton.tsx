import React from 'react';

interface SkeletonProps {
    variant?: 'text' | 'title' | 'circle' | 'card' | 'rectangular';
    width?: string;
    height?: string;
    className?: string;
}

export default function Skeleton({ variant = 'rectangular', width, height, className = '' }: SkeletonProps) {
    const baseClasses = 'skeleton';

    const variantClasses = {
        text: 'skeleton-text',
        title: 'skeleton-title',
        circle: 'skeleton-circle',
        card: 'skeleton-card',
        rectangular: '',
    };

    const style: React.CSSProperties = {};
    if (width) style.width = width;
    if (height) style.height = height;

    if (variant === 'card') {
        return (
            <div className="skeleton-card">
                <div className="skeleton-title" />
                <div className="skeleton-text" />
                <div className="skeleton-text" />
                <div className="skeleton-text w-2/3" />
            </div>
        );
    }

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    );
}

// Dashboard Skeleton Component
export function DashboardSkeleton() {
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {/* Summary Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-md p-6">
                        <Skeleton variant="text" width="60%" className="mb-3" />
                        <Skeleton variant="title" width="80%" />
                    </div>
                ))}
            </div>

            {/* Top Movers Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} variant="card" />
                ))}
            </div>

            {/* Live Rates Grid Skeleton */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
                <Skeleton variant="title" width="30%" className="mb-4" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="p-4 border border-gray-200 rounded-lg">
                            <Skeleton variant="text" width="50%" className="mb-2" />
                            <Skeleton variant="title" width="70%" className="mb-2" />
                            <Skeleton variant="text" width="40%" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Converter Skeleton
export function ConverterSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Skeleton variant="card" />
                </div>
                <div className="lg:col-span-1">
                    <Skeleton variant="card" />
                </div>
            </div>
        </div>
    );
}
