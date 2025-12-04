'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';
import Card from '../../components/Card';
import { BarChart3, TrendingUp, Calendar } from 'lucide-react';

export default function ChartsPage() {
    const { isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();
    const [selectedPair, setSelectedPair] = useState('EUR/USD');
    const [timeframe, setTimeframe] = useState('1D');

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, authLoading, router]);

    if (authLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const currencyPairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD'];
    const timeframes = ['1D', '1W', '1M', '3M', '1Y'];

    return (
        <>
            <Navbar />
            <div className="min-h-screen pt-20 pb-12">
                <div className="container mx-auto px-4">
                    {/* Header */}
                    <div className="mb-8 animate-fade-in-down">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                            <BarChart3 className="w-10 h-10 text-primary-500" />
                            Advanced Charts
                        </h1>
                        <p className="text-gray-600">Interactive candlestick charts and technical analysis</p>
                    </div>

                    {/* Controls */}
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <Card variant="glass">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Currency Pair</label>
                            <div className="flex flex-wrap gap-2">
                                {currencyPairs.map((pair) => (
                                    <button
                                        key={pair}
                                        onClick={() => setSelectedPair(pair)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${selectedPair === pair
                                                ? 'bg-primary-500 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {pair}
                                    </button>
                                ))}
                            </div>
                        </Card>

                        <Card variant="glass">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Timeframe</label>
                            <div className="flex flex-wrap gap-2">
                                {timeframes.map((tf) => (
                                    <button
                                        key={tf}
                                        onClick={() => setTimeframe(tf)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${timeframe === tf
                                                ? 'bg-accent-500 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {tf}
                                    </button>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Chart Placeholder */}
                    <Card variant="glass" className="mb-6">
                        <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl p-12 flex items-center justify-center min-h-[500px]">
                            <div className="text-center">
                                <BarChart3 className="w-24 h-24 text-primary-300 mx-auto mb-4 floating" />
                                <h3 className="text-2xl font-bold text-gray-700 mb-2">
                                    {selectedPair} - {timeframe}
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    Interactive chart will be rendered here using lightweight-charts library
                                </p>
                                <div className="flex gap-2 justify-center text-sm text-gray-500">
                                    <span className="px-3 py-1 bg-white rounded-full">Candlestick</span>
                                    <span className="px-3 py-1 bg-white rounded-full">Volume</span>
                                    <span className="px-3 py-1 bg-white rounded-full">RSI</span>
                                    <span className="px-3 py-1 bg-white rounded-full">MACD</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Stats */}
                    <div className="grid md:grid-cols-4 gap-6">
                        <Card variant="glass">
                            <p className="text-sm text-gray-600 mb-1">Current Price</p>
                            <p className="text-2xl font-bold text-gray-900">1.0945</p>
                            <p className="text-sm text-success font-medium">+0.32%</p>
                        </Card>
                        <Card variant="glass">
                            <p className="text-sm text-gray-600 mb-1">24h High</p>
                            <p className="text-2xl font-bold text-gray-900">1.0987</p>
                        </Card>
                        <Card variant="glass">
                            <p className="text-sm text-gray-600 mb-1">24h Low</p>
                            <p className="text-2xl font-bold text-gray-900">1.0901</p>
                        </Card>
                        <Card variant="glass">
                            <p className="text-sm text-gray-600 mb-1">Volume</p>
                            <p className="text-2xl font-bold text-gray-900">2.4M</p>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
