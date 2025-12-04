'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';
import Card from '../../components/Card';
import { TrendingUp, TrendingDown, Minus, Brain, AlertCircle, RefreshCw } from 'lucide-react';

interface Prediction {
    currencyPair: string;
    currentRate: number;
    predictedRate: number;
    change: number;
    recommendation: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    timeframe: string;
}

export default function PredictionsPage() {
    const { isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCurrency, setSelectedCurrency] = useState('EUR/USD');

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, authLoading, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchPredictions();
        }
    }, [isAuthenticated, selectedCurrency]);

    const fetchPredictions = async () => {
        setLoading(true);
        // Simulate API call - replace with actual API
        setTimeout(() => {
            setPredictions([
                {
                    currencyPair: 'EUR/USD',
                    currentRate: 1.0945,
                    predictedRate: 1.1025,
                    change: 0.73,
                    recommendation: 'BUY',
                    confidence: 87,
                    timeframe: '24 hours',
                },
                {
                    currencyPair: 'GBP/USD',
                    currentRate: 1.2678,
                    predictedRate: 1.2601,
                    change: -0.61,
                    recommendation: 'SELL',
                    confidence: 82,
                    timeframe: '24 hours',
                },
                {
                    currencyPair: 'USD/JPY',
                    currentRate: 149.85,
                    predictedRate: 149.92,
                    change: 0.05,
                    recommendation: 'HOLD',
                    confidence: 75,
                    timeframe: '24 hours',
                },
                {
                    currencyPair: 'AUD/USD',
                    currentRate: 0.6589,
                    predictedRate: 0.6645,
                    change: 0.85,
                    recommendation: 'BUY',
                    confidence: 79,
                    timeframe: '24 hours',
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

    const currencyPairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'NZD/USD'];

    return (
        <>
            <Navbar />
            <div className="min-h-screen pt-20 pb-12">
                <div className="container mx-auto px-4">
                    {/* Header */}
                    <div className="mb-8 animate-fade-in-down">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                            <Brain className="w-10 h-10 text-primary-500" />
                            AI Predictions
                        </h1>
                        <p className="text-gray-600">LSTM-based forex forecasting with buy/sell/hold recommendations</p>
                    </div>

                    {/* Currency Selector */}
                    <Card variant="glass" className="mb-8 animate-fade-in-up">
                        <div className="flex flex-wrap gap-3">
                            {currencyPairs.map((pair) => (
                                <button
                                    key={pair}
                                    onClick={() => setSelectedCurrency(pair)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${selectedCurrency === pair
                                            ? 'bg-primary-500 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {pair}
                                </button>
                            ))}
                            <button
                                onClick={fetchPredictions}
                                className="ml-auto px-4 py-2 rounded-lg bg-accent-500 text-white hover:bg-accent-600 transition-all flex items-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh
                            </button>
                        </div>
                    </Card>

                    {/* Predictions Grid */}
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-6">
                            {predictions.map((prediction, index) => (
                                <Card
                                    key={prediction.currencyPair}
                                    variant="glass"
                                    className={`animate-fade-in-up`}
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-2xl font-bold text-gray-900">
                                                {prediction.currencyPair}
                                            </h3>
                                            <p className="text-sm text-gray-600">{prediction.timeframe} forecast</p>
                                        </div>
                                        <RecommendationBadge recommendation={prediction.recommendation} />
                                    </div>

                                    {/* Rates */}
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <p className="text-xs text-gray-600 mb-1">Current Rate</p>
                                            <p className="text-2xl font-bold text-gray-900">
                                                {prediction.currentRate.toFixed(4)}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-primary-50 rounded-lg">
                                            <p className="text-xs text-gray-600 mb-1">Predicted Rate</p>
                                            <p className="text-2xl font-bold text-primary-600">
                                                {prediction.predictedRate.toFixed(4)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Change & Confidence */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                        <div className="flex items-center gap-2">
                                            {prediction.change > 0 ? (
                                                <TrendingUp className="w-5 h-5 text-success" />
                                            ) : prediction.change < 0 ? (
                                                <TrendingDown className="w-5 h-5 text-danger" />
                                            ) : (
                                                <Minus className="w-5 h-5 text-neutral" />
                                            )}
                                            <span
                                                className={`font-bold ${prediction.change > 0
                                                        ? 'text-success'
                                                        : prediction.change < 0
                                                            ? 'text-danger'
                                                            : 'text-neutral'
                                                    }`}
                                            >
                                                {prediction.change > 0 ? '+' : ''}
                                                {prediction.change.toFixed(2)}%
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-right">
                                                <p className="text-xs text-gray-600">Confidence</p>
                                                <p className="text-lg font-bold text-gray-900">
                                                    {prediction.confidence}%
                                                </p>
                                            </div>
                                            <div className="w-16 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-primary-500 h-2 rounded-full transition-all"
                                                    style={{ width: `${prediction.confidence}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Info Banner */}
                    <Card variant="flat" className="mt-8 animate-fade-in bg-accent-50 border-accent-200">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-6 h-6 text-accent-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-accent-900 mb-1">About AI Predictions</h4>
                                <p className="text-sm text-accent-800">
                                    Our predictions are powered by LSTM (Long Short-Term Memory) neural networks trained on
                                    historical forex data. Predictions are for educational purposes and should not be
                                    considered as financial advice. Always do your own research.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );
}

function RecommendationBadge({ recommendation }: { recommendation: 'BUY' | 'SELL' | 'HOLD' }) {
    const styles = {
        BUY: 'bg-success text-white',
        SELL: 'bg-danger text-white',
        HOLD: 'bg-warning text-white',
    };

    const icons = {
        BUY: TrendingUp,
        SELL: TrendingDown,
        HOLD: Minus,
    };

    const Icon = icons[recommendation];

    return (
        <div className={`${styles[recommendation]} px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md`}>
            <Icon className="w-4 h-4" />
            {recommendation}
        </div>
    );
}
