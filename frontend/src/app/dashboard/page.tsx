'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { dashboardAPI } from '../../services/api.service';
import Navbar from '../../components/Navbar';
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle, FileDown } from 'lucide-react';

interface LiveRate {
    currencyPair: string;
    targetCurrency: string;
    name: string;
    rate: number;
    change24h: number;
    trend: 'up' | 'down' | 'neutral';
}

interface DashboardData {
    liveRates: LiveRate[];
    topGainers: any[];
    topLosers: any[];
    marketSummary: {
        totalPairs: number;
        positiveMovers: number;
        negativeMovers: number;
        marketSentiment: string;
    };
}

export default function DashboardPage() {
    const { isAuthenticated, loading: authLoading, user } = useAuth();
    const router = useRouter();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, authLoading, router]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await dashboardAPI.getDashboard();
            setData(response.data);
            setLastUpdated(new Date());
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchDashboardData();

            // Auto-refresh every 30 seconds
            const interval = setInterval(fetchDashboardData, 30000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated]);

    const handleExportPDF = () => {
        alert('PDF export feature coming soon! This will generate a comprehensive market report.');
    };

    const handleExportExcel = () => {
        alert('Excel export feature coming soon! This will export all market data to Excel format.');
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 pt-16">
                {/* Header */}
                <div className="bg-white shadow-sm border-b">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex justify-between items-center flex-wrap gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                                <p className="text-sm text-gray-600">Welcome back, {user?.name}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleExportPDF}
                                    className="flex items-center gap-2 bg-danger hover:bg-danger-dark text-white px-4 py-2 rounded-lg transition text-sm"
                                >
                                    <FileDown className="w-4 h-4" />
                                    Export PDF
                                </button>
                                <button
                                    onClick={handleExportExcel}
                                    className="flex items-center gap-2 bg-success hover:bg-success-dark text-white px-4 py-2 rounded-lg transition text-sm"
                                >
                                    <FileDown className="w-4 h-4" />
                                    Export Excel
                                </button>
                                <button
                                    onClick={fetchDashboardData}
                                    className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Refresh
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-8">
                    {error && (
                        <div className="mb-6 p-4 bg-danger-light/20 border border-danger rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-danger">{error}</p>
                        </div>
                    )}

                    {/* Market Summary */}
                    {data && (
                        <>
                            <div className="grid md:grid-cols-4 gap-6 mb-8">
                                <SummaryCard
                                    title="Total Pairs"
                                    value={data.marketSummary.totalPairs}
                                    color="blue"
                                />
                                <SummaryCard
                                    title="Positive Movers"
                                    value={data.marketSummary.positiveMovers}
                                    color="green"
                                />
                                <SummaryCard
                                    title="Negative Movers"
                                    value={data.marketSummary.negativeMovers}
                                    color="red"
                                />
                                <SummaryCard
                                    title="Market Sentiment"
                                    value={data.marketSummary.marketSentiment}
                                    color={data.marketSummary.marketSentiment === 'bullish' ? 'green' : 'red'}
                                />
                            </div>

                            {/* Top Movers */}
                            <div className="grid md:grid-cols-2 gap-6 mb-8">
                                <div className="bg-white rounded-xl shadow-md p-6">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <TrendingUp className="w-6 h-6 text-success" />
                                        Top Gainers
                                    </h2>
                                    <div className="space-y-3">
                                        {data.topGainers.slice(0, 5).map((gainer, index) => (
                                            <div key={index} className="flex justify-between items-center p-3 bg-success-light/10 rounded-lg">
                                                <div>
                                                    <div className="font-semibold text-gray-900">{gainer.currencyPair}</div>
                                                    <div className="text-sm text-gray-600">{gainer.name}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-success">+{gainer.change.toFixed(2)}%</div>
                                                    <div className="text-sm text-gray-600">${gainer.currentRate.toFixed(4)}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl shadow-md p-6">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <TrendingDown className="w-6 h-6 text-danger" />
                                        Top Losers
                                    </h2>
                                    <div className="space-y-3">
                                        {data.topLosers.slice(0, 5).map((loser, index) => (
                                            <div key={index} className="flex justify-between items-center p-3 bg-danger-light/10 rounded-lg">
                                                <div>
                                                    <div className="font-semibold text-gray-900">{loser.currencyPair}</div>
                                                    <div className="text-sm text-gray-600">{loser.name}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-danger">{loser.change.toFixed(2)}%</div>
                                                    <div className="text-sm text-gray-600">${loser.currentRate.toFixed(4)}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Live Rates Grid */}
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Live Currency Rates</h2>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {data.liveRates.map((rate, index) => (
                                        <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="font-bold text-gray-900">{rate.currencyPair}</div>
                                                    <div className="text-sm text-gray-600">{rate.name}</div>
                                                </div>
                                                {rate.trend === 'up' ? (
                                                    <TrendingUp className="w-5 h-5 text-success" />
                                                ) : rate.trend === 'down' ? (
                                                    <TrendingDown className="w-5 h-5 text-danger" />
                                                ) : null}
                                            </div>
                                            <div className="text-2xl font-bold text-gray-900">${rate.rate.toFixed(4)}</div>
                                            <div className={`text-sm font-semibold ${rate.change24h >= 0 ? 'text-success' : 'text-danger'}`}>
                                                {rate.change24h >= 0 ? '+' : ''}{rate.change24h.toFixed(2)}% (24h)
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Last Updated */}
                            <div className="mt-4 text-center text-sm text-gray-500">
                                Last updated: {lastUpdated.toLocaleTimeString()}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

function SummaryCard({ title, value, color }: { title: string; value: string | number; color: string }) {
    const colorClasses = {
        blue: 'bg-accent-50 text-accent-700',
        green: 'bg-success-light/20 text-success-dark',
        red: 'bg-danger-light/20 text-danger-dark',
    };

    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-sm text-gray-600 mb-2">{title}</div>
            <div className={`text-3xl font-bold capitalize ${colorClasses[color as keyof typeof colorClasses]}`}>
                {value}
            </div>
        </div>
    );
}
