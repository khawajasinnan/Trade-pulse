'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, BarChart3, Newspaper, Brain, Shield, Zap, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import GlassCard from '../components/GlassCard';
import AnimatedCounter from '../components/AnimatedCounter';
import HeroAnimation from '../components/HeroAnimation';

export default function HomePage() {
    const router = useRouter();
    const { isAuthenticated, loading } = useAuth();

    useEffect(() => {
        if (!loading && isAuthenticated) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center hero-gradient">
                <div className="text-center">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary-200 border-t-primary-500 mx-auto"></div>
                        <div className="absolute inset-0 rounded-full animate-ping bg-primary-500/20"></div>
                    </div>
                    <p className="mt-6 text-gray-600 font-medium animate-pulse">Loading your experience...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <div className="relative hero-gradient overflow-hidden">
                <HeroAnimation />

                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-32 relative z-10">
                    <div className="text-center mb-20">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-md border border-primary-200/50 mb-8 shadow-premium animate-bounce-in hover:scale-105 transition-transform cursor-default">
                            <Sparkles className="w-4 h-4 text-primary-500 animate-pulse" />
                            <span className="text-sm font-semibold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">AI-Powered Financial Analytics</span>
                        </div>

                        {/* Main Heading */}
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in-up">
                            <span className="text-gray-900">Trade</span>
                            <span className="gradient-text-emerald animate-gradient-shift">-Pulse</span>
                        </h1>

                        {/* Subheading */}
                        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed px-4 animate-fade-in-up stagger-1">
                            Harness the power of <span className="font-semibold text-primary-600">machine learning</span> and
                            <span className="font-semibold text-accent-600"> real-time analytics</span> to make smarter trading decisions
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center px-4 sm:px-0 animate-fade-in-up stagger-2">
                            <Link href="/signup" className="btn-primary group text-center shadow-premium-lg hover:shadow-glow-emerald">
                                Get Started Free
                                <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform" />
                            </Link>
                            <Link href="/login" className="btn-secondary group text-center hover-lift-lg">
                                Sign In
                                <TrendingUp className="inline-block ml-2 w-5 h-5 group-hover:scale-125 group-hover:rotate-12 transition-all" />
                            </Link>
                        </div>

                        {/* Trust Indicators */}
                        <div className="mt-12 flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-sm text-gray-500 animate-fade-in-up stagger-3">
                            <div className="flex items-center gap-2 hover:text-primary-600 transition-colors">
                                <Shield className="w-4 h-4 text-primary-500" />
                                <span>Bank-level Security</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                            <div className="flex items-center gap-2 hover:text-accent-600 transition-colors">
                                <Zap className="w-4 h-4 text-accent-500" />
                                <span>Real-time Data</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                            <div className="flex items-center gap-2 hover:text-primary-600 transition-colors">
                                <Brain className="w-4 h-4 text-primary-500" />
                                <span>AI Predictions</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wave Divider */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white" />
                    </svg>
                </div>
            </div>

            {/* Features Grid */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
                <div className="text-center mb-12 sm:mb-16">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Powerful Features for <span className="gradient-text-emerald">Smart Trading</span>
                    </h2>
                    <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
                        Everything you need to analyze markets, predict trends, and manage your portfolio
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    <FeatureCard
                        icon={<TrendingUp className="w-12 h-12" />}
                        title="Real-Time Forex Data"
                        description="Live currency rates with 24h changes, top gainers/losers, and market heatmaps"
                        gradient="from-emerald-500 to-teal-500"
                        delay="0"
                    />
                    <FeatureCard
                        icon={<BarChart3 className="w-12 h-12" />}
                        title="Advanced Charts"
                        description="Candlestick charts, line graphs, and historical data visualization"
                        gradient="from-blue-500 to-cyan-500"
                        delay="0.1"
                    />
                    <FeatureCard
                        icon={<Brain className="w-12 h-12" />}
                        title="ML Predictions"
                        description="LSTM-based forex forecasting with buy/sell/hold recommendations"
                        gradient="from-emerald-500 to-green-500"
                        delay="0.2"
                    />
                    <FeatureCard
                        icon={<Newspaper className="w-12 h-12" />}
                        title="Sentiment Analysis"
                        description="Financial news analysis with positive/negative sentiment scoring"
                        gradient="from-purple-500 to-pink-500"
                        delay="0.3"
                    />
                    <FeatureCard
                        icon={<Shield className="w-12 h-12" />}
                        title="Secure & Protected"
                        description="JWT authentication, rate limiting, and enterprise-grade security"
                        gradient="from-orange-500 to-red-500"
                        delay="0.4"
                    />
                    <FeatureCard
                        icon={<Zap className="w-12 h-12" />}
                        title="Portfolio Tracking"
                        description="Virtual wallet with real-time valuation and profit/loss calculations"
                        gradient="from-yellow-500 to-orange-500"
                        delay="0.5"
                    />
                </div>
            </div>

            {/* Stats Section */}
            <div className="relative py-12 sm:py-16 lg:py-20 particles-bg">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
                        <StatCard number={15} label="Currencies" suffix="+" />
                        <StatCard number={100} label="Accuracy" suffix="%" />
                        <StatCard number={24} label="Monitoring" suffix="/7" />
                        <StatCard number={1000} label="Active Users" suffix="+" />
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
                <GlassCard premium className="p-8 sm:p-12 md:p-16 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl"></div>

                    <div className="relative z-10">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            Ready to Start Trading <span className="gradient-text-emerald">Smarter?</span>
                        </h2>
                        <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto px-4">
                            Join thousands of traders using AI-powered analytics to maximize their returns
                        </p>
                        <Link href="/signup" className="btn-primary text-base sm:text-lg group inline-block">
                            Create Free Account
                            <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <p className="mt-4 text-xs sm:text-sm text-gray-500">No credit card required • Setup in 2 minutes</p>
                    </div>
                </GlassCard>
            </div>

            {/* Footer */}
            <footer className="relative mt-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-12">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-accent-500/10"></div>
                <div className="container mx-auto px-4 text-center relative z-10">
                    <div className="mb-6">
                        <h3 className="text-2xl font-bold mb-2">
                            Trade<span className="text-primary-400">-Pulse</span>
                        </h3>
                        <p className="text-gray-400">AI-Powered Financial Analytics Platform</p>
                    </div>
                    <div className="border-t border-gray-700 pt-6">
                        <p className="text-gray-400 text-sm">
                            © 2024 Trade-Pulse. All rights reserved.
                        </p>
                        <p className="text-gray-500 text-xs mt-2">
                            Built with Next.js • Express • TensorFlow • PostgreSQL
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    gradient: string;
    delay: string;
}

function FeatureCard({ icon, title, description, gradient, delay }: FeatureCardProps) {
    return (
        <GlassCard
            className="p-8 group animate-fade-in-up"
            style={{ animationDelay: `${delay}s` } as React.CSSProperties}
            glow="emerald"
        >
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                {icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                {title}
            </h3>
            <p className="text-gray-600 leading-relaxed">{description}</p>
        </GlassCard>
    );
}

interface StatCardProps {
    number: number;
    label: string;
    suffix?: string;
}

function StatCard({ number, label, suffix = '' }: StatCardProps) {
    return (
        <GlassCard className="p-8 text-center group" glow="mint">
            <div className="text-4xl md:text-5xl font-bold gradient-text-emerald mb-3 group-hover:scale-110 transition-transform">
                <AnimatedCounter target={number} suffix={suffix} />
            </div>
            <div className="text-gray-600 font-medium">{label}</div>
        </GlassCard>
    );
}
