'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';
import Card from '../../components/Card';
import { Wallet, TrendingUp, TrendingDown, Plus, ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react';

interface Holding {
    currency: string;
    amount: number;
    avgBuyPrice: number;
    currentPrice: number;
    value: number;
    profitLoss: number;
    profitLossPercent: number;
}

interface Transaction {
    id: string;
    type: 'BUY' | 'SELL';
    currency: string;
    amount: number;
    price: number;
    total: number;
    timestamp: string;
}

export default function PortfolioPage() {
    const { isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showBuyModal, setShowBuyModal] = useState(false);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, authLoading, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchPortfolio();
        }
    }, [isAuthenticated]);

    const fetchPortfolio = async () => {
        setLoading(true);
        // Simulate API call - replace with actual API
        setTimeout(() => {
            setHoldings([
                {
                    currency: 'EUR/USD',
                    amount: 5000,
                    avgBuyPrice: 1.0850,
                    currentPrice: 1.0945,
                    value: 5475,
                    profitLoss: 475,
                    profitLossPercent: 8.76,
                },
                {
                    currency: 'GBP/USD',
                    amount: 3000,
                    avgBuyPrice: 1.2800,
                    currentPrice: 1.2678,
                    value: 3803.4,
                    profitLoss: -365.4,
                    profitLossPercent: -9.6,
                },
                {
                    currency: 'USD/JPY',
                    amount: 2000,
                    avgBuyPrice: 148.50,
                    currentPrice: 149.85,
                    value: 2018.18,
                    profitLoss: 18.18,
                    profitLossPercent: 0.91,
                },
            ]);

            setTransactions([
                {
                    id: '1',
                    type: 'BUY',
                    currency: 'EUR/USD',
                    amount: 2000,
                    price: 1.0850,
                    total: 2170,
                    timestamp: '2024-12-01T10:30:00Z',
                },
                {
                    id: '2',
                    type: 'BUY',
                    currency: 'GBP/USD',
                    amount: 3000,
                    price: 1.2800,
                    total: 3840,
                    timestamp: '2024-11-28T14:15:00Z',
                },
                {
                    id: '3',
                    type: 'SELL',
                    currency: 'AUD/USD',
                    amount: 1500,
                    price: 0.6620,
                    total: 993,
                    timestamp: '2024-11-25T09:45:00Z',
                },
            ]);
            setLoading(false);
        }, 800);
    };

    if (authLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
    const totalPL = holdings.reduce((sum, h) => sum + h.profitLoss, 0);
    const totalPLPercent = (totalPL / (totalValue - totalPL)) * 100;

    return (
        <>
            <Navbar />
            <div className="min-h-screen pt-20 pb-12">
                <div className="container mx-auto px-4">
                    {/* Header */}
                    <div className="mb-8 animate-fade-in-down flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                                <Wallet className="w-10 h-10 text-primary-500" />
                                Portfolio
                            </h1>
                            <p className="text-gray-600">Your virtual currency holdings and transactions</p>
                        </div>
                        <button
                            onClick={() => setShowBuyModal(true)}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            New Trade
                        </button>
                    </div>

                    {/* Portfolio Summary */}
                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                        <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-primary-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Total Value</p>
                                    <p className="text-2xl font-bold text-gray-900">${totalValue.toFixed(2)}</p>
                                </div>
                            </div>
                        </Card>

                        <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${totalPL >= 0 ? 'bg-success-light/30' : 'bg-danger-light/30'
                                    }`}>
                                    {totalPL >= 0 ? (
                                        <TrendingUp className="w-6 h-6 text-success" />
                                    ) : (
                                        <TrendingDown className="w-6 h-6 text-danger" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Total P/L</p>
                                    <p className={`text-2xl font-bold ${totalPL >= 0 ? 'text-success' : 'text-danger'}`}>
                                        {totalPL >= 0 ? '+' : ''}${totalPL.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center">
                                    <Wallet className="w-6 h-6 text-accent-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Holdings</p>
                                    <p className="text-2xl font-bold text-gray-900">{holdings.length}</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Holdings */}
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Holdings</h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                {holdings.map((holding, index) => (
                                    <Card
                                        key={holding.currency}
                                        variant="glass"
                                        className="animate-fade-in-up"
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900">{holding.currency}</h3>
                                                <p className="text-sm text-gray-600">{holding.amount.toFixed(0)} units</p>
                                            </div>
                                            <div className={`px-3 py-1 rounded-lg text-sm font-bold ${holding.profitLoss >= 0
                                                    ? 'bg-success-light/30 text-success'
                                                    : 'bg-danger-light/30 text-danger'
                                                }`}>
                                                {holding.profitLoss >= 0 ? '+' : ''}{holding.profitLossPercent.toFixed(2)}%
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Avg Buy Price</span>
                                                <span className="font-medium">${holding.avgBuyPrice.toFixed(4)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Current Price</span>
                                                <span className="font-medium">${holding.currentPrice.toFixed(4)}</span>
                                            </div>
                                            <div className="border-t border-gray-200 pt-3 flex justify-between">
                                                <span className="text-sm text-gray-600">Value</span>
                                                <span className="font-bold text-lg">${holding.value.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">P/L</span>
                                                <span className={`font-bold ${holding.profitLoss >= 0 ? 'text-success' : 'text-danger'
                                                    }`}>
                                                    {holding.profitLoss >= 0 ? '+' : ''}${holding.profitLoss.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>

                            {/* Transaction History */}
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Transactions</h2>
                            <Card variant="glass">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Currency</th>
                                                <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
                                                <th className="text-right py-3 px-4 font-semibold text-gray-700">Price</th>
                                                <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                                                <th className="text-right py-3 px-4 font-semibold text-gray-700">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transactions.map((tx) => (
                                                <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                                    <td className="py-3 px-4">
                                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-bold ${tx.type === 'BUY'
                                                                ? 'bg-success-light/30 text-success'
                                                                : 'bg-danger-light/30 text-danger'
                                                            }`}>
                                                            {tx.type === 'BUY' ? (
                                                                <ArrowDownRight className="w-4 h-4" />
                                                            ) : (
                                                                <ArrowUpRight className="w-4 h-4" />
                                                            )}
                                                            {tx.type}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 font-medium">{tx.currency}</td>
                                                    <td className="py-3 px-4 text-right">{tx.amount.toFixed(0)}</td>
                                                    <td className="py-3 px-4 text-right">${tx.price.toFixed(4)}</td>
                                                    <td className="py-3 px-4 text-right font-bold">${tx.total.toFixed(2)}</td>
                                                    <td className="py-3 px-4 text-right text-sm text-gray-600">
                                                        {new Date(tx.timestamp).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
