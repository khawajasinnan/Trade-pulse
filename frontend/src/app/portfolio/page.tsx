'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import ProtectedRoute from '../../components/ProtectedRoute';
import UpgradePrompt from '../../components/UpgradePrompt';
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
    const { user } = useAuth();
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState('EUR/USD');
    const [liveRate, setLiveRate] = useState<number | null>(null);
    const [tradeAmount, setTradeAmount] = useState<number>(0);
    const [fetchingRate, setFetchingRate] = useState(false);

    const fetchPortfolio = async () => {
        setLoading(true);
        try {
            // Fetch portfolio from backend API
            const response = await fetch('/api/portfolio', {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch portfolio');
            }

            const data = await response.json();

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

            // Fetch recent transactions (mock for now - can be added to backend later)
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

    // Fetch live rate when currency changes
    const fetchLiveRate = async (currency: string) => {
        setFetchingRate(true);
        try {
            const [from, to] = currency.split('/');
            const response = await fetch(
                `/api/converter?from=${from}&to=${to}&amount=1`,
                { credentials: 'include' }
            );
            const data = await response.json();
            setLiveRate(data.convertedAmount || 1);
        } catch (error) {
            console.error('Failed to fetch live rate:', error);
            setLiveRate(1);
        } finally {
            setFetchingRate(false);
        }
    };

    useEffect(() => {
        fetchPortfolio();
    }, []);

    // Fetch live rate when modal opens
    useEffect(() => {
        if (showBuyModal) {
            fetchLiveRate(selectedCurrency);
        }
    }, [showBuyModal]);

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
                            className="btn-primary flex items-center gap-2 currency-cursor"
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

                {/* Buy/Sell Modal */}
                {showBuyModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <Card variant="glass" className="max-w-md w-full">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-gray-900">New Trade</h3>
                                <button
                                    onClick={() => setShowBuyModal(false)}
                                    className="text-gray-500 hover:text-gray-700 transition"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    const type = formData.get('type') as 'BUY' | 'SELL';

                                    // Use live rate instead of manual input
                                    if (!liveRate) {
                                        alert('Please wait for live rate to load');
                                        return;
                                    }

                                    try {
                                        // Add to backend portfolio
                                        const response = await fetch('/api/portfolio', {
                                            method: 'POST',
                                            credentials: 'include',
                                            headers: {
                                                'Content-Type': 'application/json',
                                            },
                                            body: JSON.stringify({
                                                currency: selectedCurrency,
                                                amount: type === 'BUY' ? tradeAmount : -tradeAmount,
                                                purchasePrice: liveRate,
                                            }),
                                        });

                                        if (!response.ok) {
                                            const error = await response.json();
                                            throw new Error(error.error || 'Failed to add trade');
                                        }

                                        // Add new transaction to list
                                        const newTransaction: Transaction = {
                                            id: Date.now().toString(),
                                            type,
                                            currency: selectedCurrency,
                                            amount: tradeAmount,
                                            price: liveRate,
                                            total: tradeAmount * liveRate,
                                            timestamp: new Date().toISOString(),
                                        };

                                        setTransactions([newTransaction, ...transactions]);
                                        setShowBuyModal(false);

                                        // Refresh portfolio to get updated totals
                                        await fetchPortfolio();

                                        alert(`${type} order placed successfully!`);
                                    } catch (error: any) {
                                        console.error('Trade error:', error);
                                        alert(error.message || 'Failed to place trade. Please try again.');
                                    }
                                }}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Type
                                    </label>
                                    <select
                                        name="type"
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                                    >
                                        <option value="BUY">BUY</option>
                                        <option value="SELL">SELL</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Currency Pair
                                    </label>
                                    <select
                                        name="currency"
                                        value={selectedCurrency}
                                        onChange={(e) => {
                                            setSelectedCurrency(e.target.value);
                                            fetchLiveRate(e.target.value);
                                        }}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                                    >
                                        <option value="EUR/USD">EUR/USD</option>
                                        <option value="GBP/USD">GBP/USD</option>
                                        <option value="USD/JPY">USD/JPY</option>
                                        <option value="AUD/USD">AUD/USD</option>
                                        <option value="USD/CAD">USD/CAD</option>
                                        <option value="NZD/USD">NZD/USD</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Amount (units)
                                    </label>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={tradeAmount || ''}
                                        onChange={(e) => setTradeAmount(parseFloat(e.target.value) || 0)}
                                        required
                                        min="1"
                                        step="1"
                                        placeholder="1000"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                                    />
                                </div>

                                {/* Live Rate Display */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-700">Current Market Rate</span>
                                        {fetchingRate && <span className="text-xs text-blue-600">Fetching...</span>}
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {liveRate ? liveRate.toFixed(4) : '-'}
                                    </div>
                                    {liveRate && tradeAmount > 0 && (
                                        <div className="mt-3 pt-3 border-t border-blue-200">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Total Value</span>
                                                <span className="font-bold text-gray-900">
                                                    ${(liveRate * tradeAmount).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowBuyModal(false)}
                                        className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition currency-cursor"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 btn-primary currency-cursor"
                                    >
                                        Place Order
                                    </button>
                                </div>
                            </form>
                        </Card>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
