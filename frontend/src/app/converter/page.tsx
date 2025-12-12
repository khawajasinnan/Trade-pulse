'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { converterAPI, currenciesAPI } from '../../services/api.service';
import Navbar from '../../components/Navbar';
import ProtectedRoute from '../../components/ProtectedRoute';
import { ArrowLeftRight, RefreshCw, AlertCircle, TrendingUp, Clock } from 'lucide-react';

interface Currency {
    id: string;
    symbol: string;
    name: string;
}

interface ConversionResult {
    from: string;
    to: string;
    amount: number;
    rate: number;
    result: number;
    timestamp: Date;
}

interface ConversionHistory {
    from: string;
    to: string;
    amount: number;
    result: number;
    rate: number;
    timestamp: string;
}

export default function ConverterPage() {
    const { user } = useAuth();
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [fromCurrency, setFromCurrency] = useState('EUR');
    const [toCurrency, setToCurrency] = useState('USD');
    const [amount, setAmount] = useState('100');
    const [result, setResult] = useState<ConversionResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [history, setHistory] = useState<ConversionHistory[]>([]);

    // Fetch available currencies
    useEffect(() => {
        const fetchCurrencies = async () => {
            try {
                const response = await currenciesAPI.getCurrencies();
                setCurrencies(response.data.currencies);
            } catch (err) {
                console.error('Failed to fetch currencies:', err);
            }
        };
        fetchCurrencies();
    }, []);

    const handleConvert = async () => {
        // Validation
        const numAmount = parseFloat(amount);
        if (!amount || isNaN(numAmount) || numAmount <= 0) {
            setError('Please enter a valid amount greater than 0');
            return;
        }

        if (fromCurrency === toCurrency) {
            setError('Please select different currencies');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const response = await converterAPI.convert(fromCurrency, toCurrency, numAmount);
            const conversionData = response.data;

            setResult({
                from: conversionData.from,
                to: conversionData.to,
                amount: conversionData.amount,
                rate: conversionData.rate,
                result: conversionData.result,
                timestamp: new Date(conversionData.timestamp),
            });

            // Add to history (keep last 5)
            const newHistoryItem: ConversionHistory = {
                from: conversionData.from,
                to: conversionData.to,
                amount: conversionData.amount,
                result: conversionData.result,
                rate: conversionData.rate,
                timestamp: new Date().toLocaleTimeString(),
            };

            setHistory(prev => [newHistoryItem, ...prev].slice(0, 5));
        } catch (err: any) {
            setError(err.response?.data?.error || 'Conversion failed. Please try again.');
            setResult(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSwapCurrencies = () => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
        setResult(null);
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Allow only numbers and decimal point
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setAmount(value);
            setError('');
        }
    };

    return (
        <ProtectedRoute>
            <Navbar />
            <div className="min-h-screen bg-gray-50 pt-16">
                {/* Header */}
                <div className="bg-white shadow-sm border-b">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Currency Converter</h1>
                                <p className="text-sm text-gray-600">Convert currencies with real-time exchange rates</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-8">
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Converter Card */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Convert Currency</h2>

                                <div className="space-y-6">
                                    {/* From Currency */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            From
                                        </label>
                                        <select
                                            value={fromCurrency}
                                            onChange={(e) => {
                                                setFromCurrency(e.target.value);
                                                setResult(null);
                                            }}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                                        >
                                            {currencies.map((currency) => (
                                                <option key={currency.id} value={currency.symbol}>
                                                    {currency.symbol} - {currency.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Amount Input */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Amount
                                        </label>
                                        <input
                                            type="text"
                                            value={amount}
                                            onChange={handleAmountChange}
                                            placeholder="Enter amount"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    </div>

                                    {/* Swap Button */}
                                    <div className="flex justify-center">
                                        <button
                                            onClick={handleSwapCurrencies}
                                            className="p-3 bg-primary-100 hover:bg-primary-200 rounded-full transition-colors currency-cursor"
                                            title="Swap currencies"
                                        >
                                            <ArrowLeftRight className="w-5 h-5 text-primary-600" />
                                        </button>
                                    </div>

                                    {/* To Currency */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            To
                                        </label>
                                        <select
                                            value={toCurrency}
                                            onChange={(e) => {
                                                setToCurrency(e.target.value);
                                                setResult(null);
                                            }}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                                        >
                                            {currencies.map((currency) => (
                                                <option key={currency.id} value={currency.symbol}>
                                                    {currency.symbol} - {currency.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Error Message */}
                                    {error && (
                                        <div className="p-4 bg-danger-light/20 border border-danger rounded-lg flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                                            <p className="text-sm text-danger">{error}</p>
                                        </div>
                                    )}

                                    {/* Convert Button */}
                                    <button
                                        onClick={handleConvert}
                                        disabled={loading}
                                        className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold currency-cursor"
                                    >
                                        {loading ? (
                                            <>
                                                <RefreshCw className="w-5 h-5 animate-spin" />
                                                Converting...
                                            </>
                                        ) : (
                                            <>
                                                <ArrowLeftRight className="w-5 h-5" />
                                                Convert
                                            </>
                                        )}
                                    </button>

                                    {/* Result Display */}
                                    {result && (
                                        <div className="mt-6 p-6 bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl border border-primary-200">
                                            <div className="text-center">
                                                <p className="text-sm text-gray-600 mb-2">Converted Amount</p>
                                                <div className="text-4xl font-bold text-gray-900 mb-4">
                                                    {result.result.toLocaleString('en-US', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 4,
                                                    })}{' '}
                                                    <span className="text-2xl text-primary-600">{result.to}</span>
                                                </div>
                                                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                                                    <TrendingUp className="w-4 h-4" />
                                                    <span>
                                                        1 {result.from} = {result.rate.toFixed(4)} {result.to}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Last updated: {result.timestamp.toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Conversion History */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-primary-500" />
                                    Recent Conversions
                                </h3>

                                {history.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-8">
                                        No conversions yet. Start converting to see your history!
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {history.map((item, index) => (
                                            <div
                                                key={index}
                                                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-sm font-semibold text-gray-900">
                                                        {item.from} → {item.to}
                                                    </span>
                                                    <span className="text-xs text-gray-500">{item.timestamp}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">
                                                        {item.amount.toLocaleString()} {item.from}
                                                    </span>
                                                    <span className="text-sm font-semibold text-primary-600">
                                                        {item.result.toLocaleString(undefined, {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}{' '}
                                                        {item.to}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Rate: {item.rate.toFixed(4)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
