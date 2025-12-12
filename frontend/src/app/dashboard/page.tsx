'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardAPI } from '../../services/api.service';
import Navbar from '../../components/Navbar';
import ProtectedRoute from '../../components/ProtectedRoute';
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle, FileDown } from 'lucide-react';

interface LiveRate {
    pair: string;
    currency: string;
    name: string;
    currentRate: number;
    change: number;
    previousRate: number;
    currencyPair?: string;
    trend?: 'up' | 'down' | 'neutral';
}

interface DashboardData {
    currencyPairs: any[];
    gainers: any[];
    losers: any[];
    stats: {
        totalPairs: number;
        positiveMovers: number;
        negativeMovers: number;
        sentiment: string;
    };
    news?: {
        total: number;
        positive: number;
        negative: number;
    };
    timestamp: string;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

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
        fetchDashboardData();

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchDashboardData, 30000);

        // Server-Sent Events for live rates
        let es: EventSource | null = null;
        try {
            es = new EventSource('/api/events');

            es.addEventListener('rates', (ev: MessageEvent) => {
                try {
                    const payload = JSON.parse(ev.data);
                    const rates = payload.rates || {};

                    setData((prev) => {
                        if (!prev) return prev;

                        const updatedPairs = prev.currencyPairs.map((cp: any) => {
                            const pairKey = cp.pair || cp.currencyPair || '';
                            const altKey = pairKey.replace('/', '-');

                            const rate = rates[pairKey] ?? rates[altKey] ?? cp.currentRate;
                            const previousRate = cp.currentRate || rate;
                            const change = previousRate ? ((rate - previousRate) / previousRate) * 100 : 0;
                            const trend = rate > previousRate ? 'up' : rate < previousRate ? 'down' : 'neutral';

                            return {
                                ...cp,
                                previousRate,
                                currentRate: rate,
                                change,
                                trend,
                            };
                        });

                        return { ...prev, currencyPairs: updatedPairs, timestamp: payload.timestamp };
                    });
                } catch (e) {
                    console.error('Failed to parse SSE rates message', e);
                }
            });

            es.addEventListener('error', (err) => {
                console.warn('SSE connection error', err);
            });
        } catch (e) {
            console.warn('SSE not available', e);
        }

        return () => {
            clearInterval(interval);
            if (es) es.close();
        };
    }, []);

    const handleExportPDF = async () => {
        try {
            const response = await fetch('/api/export/pdf', {
                method: 'GET',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to generate PDF');
            }

            // Get filename from header or use default
            const disposition = response.headers.get('Content-Disposition');
            const filename = disposition
                ? disposition.split('filename=')[1]?.replace(/"/g, '')
                : `trade-pulse-report-${Date.now()}.pdf`;

            // Download file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('PDF export error:', error);
            alert('Failed to export PDF. Please try again.');
        }
    };

    const handleExportExcel = async () => {
        try {
            const response = await fetch('/api/export/excel', {
                method: 'GET',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to generate Excel');
            }

            // Get filename from header or use default
            const disposition = response.headers.get('Content-Disposition');
            const filename = disposition
                ? disposition.split('filename=')[1]?.replace(/"/g, '')
                : `trade-pulse-${Date.now()}.xlsx`;

            // Download file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Excel export error:', error);
            alert('Failed to export Excel. Please try again.');
        }
    };

    return (
        <ProtectedRoute>
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
                                {/* Export buttons - Only for Traders */}
                                {user?.role === 'Trader' && (
                                    <>
                                        <button
                                            onClick={handleExportPDF}
                                            className="flex items-center gap-2 bg-danger hover:bg-danger-dark text-white px-4 py-2 rounded-lg transition text-sm currency-cursor"
                                        >
                                            <FileDown className="w-4 h-4" />
                                            Export PDF
                                        </button>
                                        <button
                                            onClick={handleExportExcel}
                                            className="flex items-center gap-2 bg-success hover:bg-success-dark text-white px-4 py-2 rounded-lg transition text-sm currency-cursor"
                                        >
                                            <FileDown className="w-4 h-4" />
                                            Export Excel
                                        </button>
                                    </>
                                )}
                                {/* Refresh button - Available to all users */}
                                <button
                                    onClick={fetchDashboardData}
                                    className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition currency-cursor"
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
                                    value={data.stats.totalPairs}
                                    color="blue"
                                />
                                <SummaryCard
                                    title="Positive Movers"
                                    value={data.stats.positiveMovers}
                                    color="green"
                                />
                                <SummaryCard
                                    title="Negative Movers"
                                    value={data.stats.negativeMovers}
                                    color="red"
                                />
                                <SummaryCard
                                    title="Market Sentiment"
                                    value={data.stats.sentiment}
                                    color={data.stats.sentiment === 'POSITIVE' ? 'green' : data.stats.sentiment === 'NEGATIVE' ? 'red' : 'blue'}
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
                                        {data.gainers.slice(0, 5).map((gainer, index) => (
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
                                        {data.losers.slice(0, 5).map((loser, index) => (
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
                                    {data.currencyPairs.map((rate: any, index: number) => (
                                        <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="font-bold text-gray-900">{rate.pair || rate.currencyPair || 'N/A'}</div>
                                                    <div className="text-sm text-gray-600">{rate.name}</div>
                                                </div>
                                                {rate.trend === 'up' ? (
                                                    <TrendingUp className="w-5 h-5 text-success" />
                                                ) : rate.trend === 'down' ? (
                                                    <TrendingDown className="w-5 h-5 text-danger" />
                                                ) : null}
                                            </div>
                                            <div className="text-2xl font-bold text-gray-900">${rate.currentRate?.toFixed(4) || 'N/A'}</div>
                                            <div className={`text-sm font-semibold ${rate.change >= 0 ? 'text-success' : 'text-danger'}`}>
                                                {rate.change >= 0 ? '+' : ''}{rate.change?.toFixed(2) || '0.00'}% (24h)
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
        </ProtectedRoute>
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
