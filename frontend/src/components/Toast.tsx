'use client';

import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
    id: string;
    message: string;
    type: ToastType;
    onClose: (id: string) => void;
    duration?: number;
}

export default function Toast({ id, message, type, onClose, duration = 5000 }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, onClose]);

    const styles = {
        success: {
            bg: 'bg-gradient-to-r from-emerald-50 to-emerald-100',
            border: 'border-emerald-400',
            text: 'text-emerald-800',
            icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
        },
        error: {
            bg: 'bg-gradient-to-r from-red-50 to-red-100',
            border: 'border-red-400',
            text: 'text-red-800',
            icon: <AlertCircle className="w-5 h-5 text-red-600" />,
        },
        warning: {
            bg: 'bg-gradient-to-r from-amber-50 to-amber-100',
            border: 'border-amber-400',
            text: 'text-amber-800',
            icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
        },
        info: {
            bg: 'bg-gradient-to-r from-blue-50 to-blue-100',
            border: 'border-blue-400',
            text: 'text-blue-800',
            icon: <Info className="w-5 h-5 text-blue-600" />,
        },
    };

    const style = styles[type];

    return (
        <div
            className={`${style.bg} border ${style.border} rounded-xl shadow-lg p-4 mb-3 flex items-start gap-3 min-w-[320px] max-w-md animate-slide-in-right backdrop-blur-sm`}
            role="alert"
        >
            <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
            <p className={`${style.text} text-sm font-medium flex-1 leading-relaxed`}>{message}</p>
            <button
                onClick={() => onClose(id)}
                className={`${style.text} hover:opacity-70 transition-opacity flex-shrink-0`}
                aria-label="Close notification"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
