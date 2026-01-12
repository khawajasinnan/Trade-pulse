'use client';

import React from 'react';

interface BeautifulLoaderProps {
    size?: 'sm' | 'md' | 'lg';
    color?: 'primary' | 'white' | 'accent';
}

export default function BeautifulLoader({ size = 'md', color = 'primary' }: BeautifulLoaderProps) {
    const sizes = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16',
    };

    const colors = {
        primary: 'border-primary-500',
        white: 'border-white',
        accent: 'border-accent-500',
    };

    return (
        <div className="flex items-center justify-center">
            <div className="relative">
                {/* Outer rotating ring */}
                <div className={`${sizes[size]} rounded-full border-4 ${colors[color]} border-t-transparent animate-spin`}></div>

                {/* Inner pulsing circle */}
                <div className={`absolute inset-0 m-auto ${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-gradient-to-br from-primary-400 to-primary-600 animate-pulse`}></div>

                {/* Glow effect */}
                <div className={`absolute inset-0 rounded-full bg-primary-500/20 blur-xl animate-pulse`}></div>
            </div>
        </div>
    );
}

// Alternative: Dots Loader
export function DotsLoader({ color = 'primary' }: { color?: 'primary' | 'white' | 'accent' }) {
    const colorClasses = {
        primary: 'bg-primary-500',
        white: 'bg-white',
        accent: 'bg-accent-500',
    };

    return (
        <div className="flex items-center justify-center space-x-2">
            <div className={`w-3 h-3 ${colorClasses[color]} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
            <div className={`w-3 h-3 ${colorClasses[color]} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
            <div className={`w-3 h-3 ${colorClasses[color]} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
        </div>
    );
}

// Alternative: Spinner with Trail
export function SpinnerLoader({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const sizes = {
        sm: 'w-6 h-6',
        md: 'w-10 h-10',
        lg: 'w-14 h-14',
    };

    return (
        <div className="flex items-center justify-center">
            <div className="relative">
                <div className={`${sizes[size]} rounded-full border-4 border-gray-200`}></div>
                <div className={`absolute top-0 left-0 ${sizes[size]} rounded-full border-4 border-transparent border-t-primary-500 border-r-primary-400 animate-spin`}></div>
            </div>
        </div>
    );
}
