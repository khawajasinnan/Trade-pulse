'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { portfolioAPI } from '../../services/api.service';
import Navbar from '../../components/Navbar';
import ProtectedRoute from '../../components/ProtectedRoute';
import UpgradePrompt from '../../components/UpgradePrompt';
import LoadingSpinner from '../../components/LoadingSpinner';
import Card from '../../components/Card';
import TradeModal from '../../components/TradeModal';
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
    const { user } = useAuth();
    const { showSuccess, showError } = useToast();
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showTradeModal, setShowTradeModal] = useState(false);

    const fetchPortfolio = async () => {
        setLoading(true);
        try {
            // Fetch portfolio from backend API
            const response = await portfolioAPI.getPortfolio();
            const data = response.data;

            // Transform backend data to frontend format
            if (data.holdings) {
                const transformedHoldings = data.holdings.map((item: any) => ({
                    currency: item.currency,
                    amount: item.amount,
                    avgBuyPrice: item.purchasePrice,
                    currentPrice: item.currentPrice || item.purchasePrice,
                    value: item.currentValue || item.amount * item.purchasePrice,
                    profitLoss: item.profitLoss || 0,
                    profitLossPercent: item.profitLossPercentage || 0,
                }));

                setHoldings(transformedHoldings);
            }

            // Mock transactions for demo (can be added to backend later)
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
            ]);
        } catch (error) {
            console.error('Error fetching portfolio:', error);
            // Fallback to empty state on error
            setHoldings([]);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    // Removed fetchLiveRate - now handled by TradeModal

    useEffect(() => {
        fetchPortfolio();
    }, []);

    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
    const totalPL = holdings.reduce((sum, h) => sum + h.profitLoss, 0);
    const totalPLPercent = (totalPL / (totalValue - totalPL)) * 100;

    // BasicUser restriction - show upgrade prompt
    if (user?.role === 'BasicUser') {
        return (
            <ProtectedRoute>
                <Navbar />
                <UpgradePrompt
                    feature="Portfolio Management"
                    description="Track your forex holdings, manage virtual positions, and monitor your profit/loss with advanced analytics"
                />
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <Navbar />
            <div className="min-h-screen pt-20 pb-12 bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8 animate-fade-in-down flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                                <Wallet className="w-8 h-8 sm:w-10 sm:h-10 text-primary-500" />
                                Portfolio
                            </h1>
                            <p className="text-sm sm:text-base text-gray-600">Your virtual currency holdings and transactions</p>
                        </div>
                        <button
                            onClick={() => setShowTradeModal(true)}
                            className="btn-primary flex items-center gap-2 currency-cursor w-full sm:w-auto justify-center"
                        >
                            <Plus className="w-5 h-5" />
                            New Trade
                        </button>
                    </div>

                    {/* Portfolio Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
                        <Card variant="glass" className="animate-fade-in-up p-6 sm:p-8" style={{ animationDelay: '0ms' }}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                                        <DollarSign className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm text-gray-500 mb-1">Total Value</p>
                                        <p className="text-2xl sm:text-3xl font-bold text-gray-900">${totalValue.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card variant="glass" className="animate-fade-in-up p-6 sm:p-8" style={{ animationDelay: '100ms' }}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg ${totalPL >= 0 ? 'bg-gradient-to-br from-green-400 to-emerald-600' : 'bg-gradient-to-br from-red-400 to-rose-600'
                                        }`}>
                                        {totalPL >= 0 ? (
                                            <TrendingUp className="w-8 h-8 text-white" />
                                        ) : (
                                            <TrendingDown className="w-8 h-8 text-white" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm text-gray-500 mb-1">Total P/L</p>
                                        <p className={`text-2xl sm:text-3xl font-bold ${totalPL >= 0 ? 'text-success' : 'text-danger'}`}>
                                            {totalPL >= 0 ? '+' : ''}${totalPL.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card variant="glass" className="animate-fade-in-up p-6 sm:p-8 sm:col-span-2 lg:col-span-1" style={{ animationDelay: '200ms' }}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-accent-400 to-accent-600 rounded-xl flex items-center justify-center shadow-lg">
                                        <Wallet className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm text-gray-500 mb-1">Holdings</p>
                                        <p className="text-2xl sm:text-3xl font-bold text-gray-900">{holdings.length}</p>
                                    </div>
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
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Holdings</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
                                {holdings.map((holding, index) => (
                                    <Card
                                        key={holding.currency}
                                        variant="glass"
                                        className="animate-bounce-in hover-lift-lg shadow-premium"
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900">{holding.currency}</h3>
                                                <p className="text-sm text-gray-600">{holding.amount.toFixed(0)} units</p>
                                            </div>
                                            <div className={`px-3 py-1 rounded-lg text-sm font-bold ${holding.profitLoss >= 0
                                                ? 'bg-success-light/30 text-success animate-glow-pulse'
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
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Recent Transactions</h2>
                            <Card variant="glass">
                                <div className="overflow-x-auto -mx-4 sm:mx-0">
                                    <div className="inline-block min-w-full align-middle">
                                        <div className="overflow-hidden">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="text-left py-3 px-2 sm:px-4 font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">Type</th>
                                                        <th className="text-left py-3 px-2 sm:px-4 font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">Currency</th>
                                                        <th className="text-right py-3 px-2 sm:px-4 font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">Amount</th>
                                                        <th className="text-right py-3 px-2 sm:px-4 font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">Price</th>
                                                        <th className="text-right py-3 px-2 sm:px-4 font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">Total</th>
                                                        <th className="text-right py-3 px-2 sm:px-4 font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-100">
                                                    {transactions.map((tx) => (
                                                        <tr key={tx.id} className="hover:bg-gray-50 transition">
                                                            <td className="py-3 px-2 sm:px-4 whitespace-nowrap">
                                                                <span className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-bold ${tx.type === 'BUY'
                                                                    ? 'bg-success-light/30 text-success'
                                                                    : 'bg-danger-light/30 text-danger'
                                                                    }`}>
                                                                    {tx.type === 'BUY' ? (
                                                                        <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4" />
                                                                    ) : (
                                                                        <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />
                                                                    )}
                                                                    <span className="hidden sm:inline">{tx.type}</span>
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm whitespace-nowrap">{tx.currency}</td>
                                                            <td className="py-3 px-2 sm:px-4 text-right text-xs sm:text-sm whitespace-nowrap">{tx.amount.toFixed(0)}</td>
                                                            <td className="py-3 px-2 sm:px-4 text-right text-xs sm:text-sm whitespace-nowrap">${tx.price.toFixed(4)}</td>
                                                            <td className="py-3 px-2 sm:px-4 text-right font-bold text-xs sm:text-sm whitespace-nowrap">${tx.total.toFixed(2)}</td>
                                                            <td className="py-3 px-2 sm:px-4 text-right text-xs text-gray-600 whitespace-nowrap">
                                                                {new Date(tx.timestamp).toLocaleDateString()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </>
                    )}
                </div>

                {/* Trade Modal */}
                <TradeModal
                    isOpen={showTradeModal}
                    onClose={() => setShowTradeModal(false)}
                    onSuccess={fetchPortfolio}
                />
            </div>
        </ProtectedRoute>
    );
}
