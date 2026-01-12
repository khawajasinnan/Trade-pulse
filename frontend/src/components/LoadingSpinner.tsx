'use client';

export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const sizes = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16',
    };

    return (
        <div className="flex items-center justify-center">
            <div className="relative">
                {/* Outer rotating ring */}
                <div className={`${sizes[size]} rounded-full border-4 border-primary-500 border-t-transparent animate-spin`}></div>

                {/* Inner pulsing circle */}
                <div className={`absolute inset-0 m-auto ${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-gradient-to-br from-primary-400 to-primary-600 animate-pulse`}></div>

                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full bg-primary-500/20 blur-xl animate-pulse"></div>
            </div>
        </div>
    );
}
