'use client';

import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import Card from './Card';
import { Lock, ArrowRight, Star, Check } from 'lucide-react';

interface UpgradePromptProps {
    feature: string;
    description: string;
    children?: ReactNode;
}

export default function UpgradePrompt({ feature, description }: UpgradePromptProps) {
    const { user } = useAuth();

    const traderFeatures = [
        'Unlimited AI predictions with LSTM forecasting',
        'Advanced portfolio management tools',
        'Unlimited price alerts',
        'Export reports and data',
        'Advanced visualization and charts',
        'Priority API access',
    ];

    return (
        <div className="min-h-screen pt-20 pb-12 bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Header Section */}
                <div className="text-center mb-12 animate-fade-in-down">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-emerald rounded-full mb-6">
                        <Lock className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-5xl font-bold text-gray-900 mb-4">
                        Unlock {feature}
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        {description}
                    </p>
                </div>

                {/* Feature ComparisonCards */}
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                    {/* Current Plan */}
                    <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-gray-900">Basic User</h3>
                                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
                                    Current
                                </span>
                            </div>
                            <div className="space-y-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-700">Real-time exchange rates</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-700">Basic historical charts</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-700">Currency converter</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-700">News sentiment (read-only)</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-700">Up to 2 price alerts</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Trader Plan */}
                    <Card variant="glass" className="relative animate-fade-in-up border-2 border-primary-500" style={{ animationDelay: '200ms' }}>
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                            <div className="flex items-center gap-2 bg-gradient-emerald text-white px-4 py-2 rounded-full shadow-lg">
                                <Star className="w-4 h-4" />
                                <span className="font-bold text-sm">Recommended</span>
                            </div>
                        </div>
                        <div className="p-8">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">Trader</h3>
                            <div className="space-y-4 mb-6">
                                {traderFeatures.map((feat, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <Check className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                                        <span className="text-gray-700 font-medium">{feat}</span>
                                    </div>
                                ))}
                            </div>
                            <Link
                                href="/profile"
                                className="btn-primary w-full flex items-center justify-center gap-2"
                            >
                                <span>Upgrade to Trader</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </Card>
                </div>

                {/* Contact Admin Note */}
                <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                    <div className="p-6 text-center">
                        <p className="text-gray-700">
                            To upgrade your account, please contact your system administrator or visit your
                            <Link href="/profile" className="text-primary-600 hover:text-primary-700 font-semibold ml-1">
                                profile settings
                            </Link>
                            .
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
