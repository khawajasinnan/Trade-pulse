'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Sparkles, Zap } from 'lucide-react';

interface FloatingOrb {
    id: number;
    x: number;
    y: number;
    size: number;
    color: string;
    delay: number;
}

export default function HeroAnimation() {
    const [orbs, setOrbs] = useState<FloatingOrb[]>([]);

    useEffect(() => {
        // Generate floating orbs
        const colors = [
            'rgba(5, 176, 132, 0.3)',  // emerald
            'rgba(186, 223, 205, 0.4)', // mint
            'rgba(1, 90, 132, 0.3)',    // noon
        ];

        const generatedOrbs: FloatingOrb[] = Array.from({ length: 6 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: 100 + Math.random() * 200,
            color: colors[i % colors.length],
            delay: Math.random() * 3,
        }));

        setOrbs(generatedOrbs);
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Floating Orbs */}
            {orbs.map((orb) => (
                <div
                    key={orb.id}
                    className="absolute rounded-full blur-3xl opacity-60 animate-float"
                    style={{
                        left: `${orb.x}%`,
                        top: `${orb.y}%`,
                        width: `${orb.size}px`,
                        height: `${orb.size}px`,
                        background: orb.color,
                        animationDelay: `${orb.delay}s`,
                        animationDuration: `${6 + Math.random() * 4}s`,
                    }}
                />
            ))}

            {/* Floating Icons */}
            <div className="absolute top-20 left-10 animate-float opacity-20">
                <TrendingUp className="w-16 h-16 text-primary-500" style={{ animationDelay: '0.5s' }} />
            </div>
            <div className="absolute top-40 right-20 animate-float opacity-20">
                <Sparkles className="w-12 h-12 text-accent-500" style={{ animationDelay: '1.5s' }} />
            </div>
            <div className="absolute bottom-40 left-1/4 animate-float opacity-20">
                <Zap className="w-14 h-14 text-primary-400" style={{ animationDelay: '2.5s' }} />
            </div>
        </div>
    );
}
