import { ReactNode, CSSProperties } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    variant?: 'default' | 'glass' | 'flat';
    hover?: boolean;
    style?: CSSProperties;
    key?: string;
}

export default function Card({ children, className = '', variant = 'default', hover = true, style }: CardProps) {
    const variantClasses = {
        default: 'card',
        glass: 'glass-card',
        flat: 'card-flat',
    };

    const hoverClass = hover ? 'hover:shadow-xl hover:-translate-y-1' : '';

    return (
        <div className={`${variantClasses[variant]} ${hoverClass} ${className}`} style={style}>
            {children}
        </div>
    );
}
