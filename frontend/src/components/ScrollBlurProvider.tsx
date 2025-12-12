'use client';

import { ReactNode, useEffect, useRef } from 'react';

export default function ScrollBlurProvider({ children }: { children: ReactNode }) {
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const handleScroll = () => {
            // Add scrolling-active class to body
            document.body.classList.add('scrolling-active');

            // Clear existing timeout
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }

            // Remove class after scroll ends (300ms)
            scrollTimeoutRef.current = setTimeout(() => {
                document.body.classList.remove('scrolling-active');
            }, 300);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);

    return <>{children}</>;
}
