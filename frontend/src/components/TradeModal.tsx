'use client';

import { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { portfolioAPI } from '../services/api.service';
import Card from './Card';
import { X, TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';

interface TradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    defaultCurrency?: string;
}

export default function TradeModal({ isOpen, onClose, onSuccess, defaultCurrency = 'EUR/USD' }: TradeModalProps) {
    const { showSuccess, showError, showWarning } = useToast();
    const [selectedCurrency, setSelectedCurrency] = useState(defaultCurrency);
    const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
    const [tradeAmount, setTradeAmount] = useState<number>(0);
    const [liveRate, setLiveRate] = useState<number | null>(null);
    const [fetchingRate, setFetchingRate] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currencyPairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'NZD/USD'];

    // Fetch live rate when currency changes or modal opens
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
        if (isOpen) {
            setSelectedCurrency(defaultCurrency);
            fetchLiveRate(defaultCurrency);
        }
    }, [isOpen, defaultCurrency]);

    useEffect(() => {
        if (isOpen && selectedCurrency) {
            fetchLiveRate(selectedCurrency);
        }
    }, [selectedCurrency]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!liveRate) {
            showWarning('Please wait for live rate to load');
            return;
        }

        if (tradeAmount <= 0) {
            showError('Please enter a valid amount');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await portfolioAPI.addToPortfolio({
                currency: selectedCurrency,
                amount: tradeType === 'BUY' ? tradeAmount : -tradeAmount,
                purchasePrice: liveRate,
            });

            showSuccess(`${tradeType} order for ${selectedCurrency} placed successfully!`);
            onSuccess();
            onClose();

            // Reset form
            setTradeAmount(0);
            setTradeType('BUY');
        } catch (error: any) {
            console.error('Trade error:', error);
            showError(error.message || 'Failed to place trade. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const totalValue = liveRate && tradeAmount > 0 ? liveRate * tradeAmount : 0;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
            <Card variant="glass" className="max-w-md sm:max-w-lg w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <DollarSign className="w-6 h-6 sm:w-7 sm:h-7 text-primary-500" />
                        New Trade
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 hover:text-gray-700" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Trade Type */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Trade Type
                        </label>
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            <button
                                type="button"
                                onClick={() => setTradeType('BUY')}
                                className={`py-3 sm:py-3 px-3 sm:px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 min-h-[48px] ${tradeType === 'BUY'
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg scale-105'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="text-sm sm:text-base">BUY</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setTradeType('SELL')}
                                className={`py-3 sm:py-3 px-3 sm:px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 min-h-[48px] ${tradeType === 'SELL'
                                    ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg scale-105'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="text-sm sm:text-base">SELL</span>
                            </button>
                        </div>
                    </div>

                    {/* Currency Pair */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Currency Pair
                        </label>
                        <select
                            value={selectedCurrency}
                            onChange={(e) => setSelectedCurrency(e.target.value)}
                            required
                            className="w-full px-3 sm:px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition bg-white font-medium text-base min-h-[48px]"
                        >
                            {currencyPairs.map((pair) => (
                                <option key={pair} value={pair}>
                                    {pair}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Amount (units)
                        </label>
                        <input
                            type="number"
                            value={tradeAmount || ''}
                            onChange={(e) => setTradeAmount(parseFloat(e.target.value) || 0)}
                            required
                            min="1"
                            step="1"
                            placeholder="1000"
                            className="w-full px-3 sm:px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition bg-white font-medium text-base sm:text-lg min-h-[48px]"
                        />
                    </div>

                    {/* Live Rate Display */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 rounded-xl p-4 sm:p-5">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold text-gray-700">Current Market Rate</span>
                            {fetchingRate && <span className="text-xs text-blue-600 animate-pulse">Fetching...</span>}
                        </div>
                        <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                            {liveRate ? liveRate.toFixed(5) : '—'}
                        </div>
                        {liveRate && tradeAmount > 0 && (
                            <div className="pt-3 border-t-2 border-blue-200">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-600">Total Value</span>
                                    <span className="text-2xl font-bold text-gray-900">
                                        ${totalValue.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Info Alert */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800">
                            This is a virtual trade for demo purposes. No real money is involved.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 sm:gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 sm:px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition currency-cursor min-h-[48px] text-sm sm:text-base"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || fetchingRate || !liveRate}
                            className={`flex-1 px-4 sm:px-6 py-3 rounded-xl font-semibold transition shadow-lg currency-cursor min-h-[48px] text-sm sm:text-base ${tradeType === 'BUY'
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                                : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            <span className="hidden sm:inline">{isSubmitting ? 'Placing Order...' : `Place ${tradeType} Order`}</span>
                            <span className="sm:hidden">{isSubmitting ? 'Placing...' : tradeType}</span>
                        </button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
