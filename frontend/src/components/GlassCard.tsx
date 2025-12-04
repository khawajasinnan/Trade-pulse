'use client';

import { ReactNode } from 'react';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    premium?: boolean;
    hover?: boolean;
    glow?: 'emerald' | 'mint' | 'noon' | 'none';
    style?: React.CSSProperties;
}

export default function GlassCard({
    children,
    className = '',
    premium = false,
    hover = true,
    glow = 'none',
    style
}: GlassCardProps) {
    const baseClass = premium ? 'glass-premium' : 'glass-card';
    const hoverClass = hover ? '' : 'hover:scale-100 hover:shadow-glass';
    const glowClass = glow !== 'none' ? `hover:glow-${glow}` : '';

    return (
        <div className={`${baseClass} ${hoverClass} ${glowClass} ${className}`} style={style}>
            {children}
        </div>
    );
}
